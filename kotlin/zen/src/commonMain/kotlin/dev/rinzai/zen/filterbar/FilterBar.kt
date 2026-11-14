package dev.rinzai.zen.filterbar

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val MOVE = 260
private const val LEAVE = 120

/** One child of the bar as it shows: in the row, or fading out where it was. */
@Stable
private class Slot(val key: Any, var content: @Composable () -> Unit) {
    var leaving by mutableStateOf(false)
    var at: IntOffset? = null
    var dx by mutableFloatStateOf(0f)
    var dy by mutableFloatStateOf(0f)
    var alpha by mutableFloatStateOf(1f)
    var scale by mutableFloatStateOf(1f)
}

private object ClearKey

/**
 * The filters in effect, as chips (a FilterChip from `chip`) each removed with its ×, and "Clear
 * all" once there are two or more. Shows nothing when no filter is set. A removed chip fades out
 * where it was, then the others slide over. `key` tells filters apart (the filter itself by
 * default).
 */
@Composable
fun <T> FilterBar(
    filters: List<T>,
    modifier: Modifier = Modifier,
    key: (T) -> Any = { it as Any },
    /** Removes every filter; offered as "Clear all" once there are two or more. */
    onClear: (() -> Unit)? = null,
    clearLabel: String? = null,
    label: String? = null,
    chip: @Composable (T) -> Unit,
) {
    val m = LocalMessages.current
    val reduced = reducedMotion()
    val scope = rememberCoroutineScope()
    // Plain lists, worked out as the filters change; `gone` redraws once a chip has faded out.
    val slots = remember { mutableListOf<Slot>() }
    val left = remember { booleanArrayOf(false) }
    var gone by remember { mutableIntStateOf(0) }
    gone
    if (filters.isEmpty()) {
        slots.clear()
        return
    }
    val name = label ?: m.activeFilters

    // The children as they are now, in order: each filter, then Clear all when it's offered.
    val wanted = filters.map { f -> key(f) to @Composable { chip(f) } } +
        (if (filters.size > 1 && onClear != null) listOf(ClearKey to @Composable { ClearAll(clearLabel ?: m.clearAll, onClear) }) else emptyList())
    val keys = wanted.map { it.first }.toSet()
    val next = wanted.map { (k, c) -> (slots.firstOrNull { it.key == k && !it.leaving } ?: Slot(k, c)).also { it.content = c } }
    val going = slots.filter { it.key !in keys && !it.leaving }
    if (going.isNotEmpty() && !reduced) {
        left[0] = true
        for (s in going) {
            s.leaving = true
            scope.launch {
                animate(0f, 1f, animationSpec = tween(LEAVE, easing = Ease.CssIn)) { p, _ ->
                    s.alpha = 1f - p
                    s.scale = 1f - 0.1f * p
                }
                slots.remove(s)
                gone++
            }
        }
    }
    val leaving = slots.filter { it.leaving && it.key !in keys }
    slots.clear()
    slots.addAll(next + leaving)

    Layout(
        content = {
            for (s in slots) key(s.key) {
                Box(
                    Modifier
                        .layoutId(s)
                        .graphicsLayer {
                            translationX = s.dx
                            translationY = s.dy
                            alpha = s.alpha
                            scaleX = s.scale
                            scaleY = s.scale
                        }
                        .then(if (s.leaving) Modifier.clearAndSetSemantics {} else Modifier),
                ) { s.content() }
            }
        },
        modifier = modifier.semantics {
            contentDescription = name
            isTraversalGroup = true
        },
    ) { measurables, constraints ->
        val gap = 6.dp.roundToPx()
        val loose = Constraints(maxWidth = constraints.maxWidth)
        val all = measurables.map { (it.layoutId as Slot) to it.measure(loose) }
        // flex-wrap with items-center: lines as tall as their tallest child.
        val lines = mutableListOf<MutableList<Int>>()
        var x = 0
        all.forEachIndexed { i, (slot, p) ->
            if (slot.leaving) return@forEachIndexed
            if (lines.isEmpty() || (x > 0 && x + p.width > constraints.maxWidth)) {
                lines += mutableListOf<Int>()
                x = 0
            }
            lines.last() += i
            x += p.width + gap
        }
        val heights = lines.map { line -> line.maxOf { all[it].second.height } }
        val width = lines.maxOfOrNull { line -> line.sumOf { all[it].second.width } + gap * (line.size - 1) } ?: 0
        val height = heights.sum() + gap * maxOf(0, lines.size - 1)
        layout(constraints.constrainWidth(width), constraints.constrainHeight(height)) {
            val wait = if (left[0]) LEAVE else 0
            left[0] = false
            var y = 0
            lines.forEachIndexed { l, line ->
                var lx = 0
                for (i in line) {
                    val (slot, p) = all[i]
                    val to = IntOffset(lx, y + (heights[l] - p.height) / 2)
                    p.placeRelative(to)
                    if (!reduced) slot.moved(slot.at, to, wait, scope)
                    slot.at = to
                    lx += p.width + gap
                }
                y += heights[l] + gap
            }
            // Those leaving stay where they were, out of the row.
            for ((slot, p) in all) if (slot.leaving) slot.at?.let { p.placeRelative(it) }
        }
    }
}

/** The web's FLIP: along its line it slides from where it was; onto another line it fades in, rising 3px. */
private fun Slot.moved(was: IntOffset?, to: IntOffset, wait: Int, scope: CoroutineScope) {
    if (was == null || was == to) return
    if (was.y != to.y) {
        alpha = 0f
        dy = 3f
        scope.launch {
            delay((wait + MOVE * 0.6f).toLong())
            animate(0f, 1f, animationSpec = tween(200, easing = Ease.OutSoft)) { p, _ ->
                alpha = p
                dy = 3f * (1f - p)
            }
        }
    } else {
        val from = (was.x - to.x).toFloat() + dx
        dx = from
        scope.launch {
            delay(wait.toLong())
            animate(from, 0f, animationSpec = tween(MOVE, easing = Ease.OutSoft)) { v, _ -> dx = v }
        }
    }
}

@Composable
private fun ClearAll(label: String, onClear: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val ink by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150, Ease.Css))
    Text(
        label,
        Modifier
            .padding(start = 4.dp)
            .box(Zen.radii.md, shadows = focusRing(state.focusVisible))
            .control(state, onClick = onClear)
            .padding(horizontal = 6.dp, vertical = 4.dp),
        style = TextStyles.xs,
        color = ink,
    )
}

/** One filter in a FilterBar: what it is (e.g. "Amount: $50–$500"), and its × to remove it. */
@Composable
fun FilterChip(
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
    /** The × button's name for screen readers, e.g. "Remove amount filter". */
    removeLabel: String? = null,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val name = removeLabel ?: LocalMessages.current.removeFilter
    val state = rememberControlState()
    val ink by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150, Ease.Css))
    val fill by animateColorAsState(t.tint.color(if (state.hovered) 0.1f else 0f), transition(150, Ease.Css))
    Row(
        modifier
            .box(CircleShape, fill = SolidColor(t.primary.color(0.12f)), shadows = listOf(Shadow(spread = 1f, color = t.primary.color(0.25f), inset = true)))
            .padding(start = 12.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = t.foreground.color(), style = TextStyles.xs, content = content)
        Box(
            Modifier
                .size(20.dp)
                .box(CircleShape, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
                .control(state, onClick = onRemove)
                .semantics { contentDescription = name },
            contentAlignment = Alignment.Center,
        ) { Icon(Icons.XMark, size = 12.dp, color = ink) }
    }
}
