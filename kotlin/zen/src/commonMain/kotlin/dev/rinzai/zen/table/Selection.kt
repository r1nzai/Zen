package dev.rinzai.zen.table

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.input.pointer.isShiftPressed
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Fixed
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.checkbox.Checkbox
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState

/**
 * Which rows are selected, by key: made by rememberTableSelection with the keys in the order
 * shown. Shift-click selects (or clears) every row between the last one clicked and this one; keys
 * no longer shown drop out of the selection.
 */
@Stable
class TableSelection<K> internal constructor() {
    private var chosen by mutableStateOf<Set<K>>(emptySet())
    internal var keys: List<K> = emptyList()
    private var anchor: K? = null

    val selected: Set<K> get() = keys.toSet().let { shown -> chosen.filterTo(LinkedHashSet()) { it in shown } }

    fun isSelected(key: K) = key in chosen && key in keys

    fun clear() {
        chosen = emptySet()
    }

    internal val all get() = keys.isNotEmpty() && selected.size == keys.size

    internal fun set(picked: List<K>, on: Boolean) {
        val shown = keys.toSet()
        val next = chosen.filterTo(LinkedHashSet()) { it in shown }
        if (on) next.addAll(picked) else next.removeAll(picked.toSet())
        chosen = next
    }

    internal fun select(key: K, on: Boolean, range: Boolean) {
        val from = if (range) anchor?.let(keys::indexOf) ?: -1 else -1
        val to = keys.indexOf(key)
        set(if (from == -1) listOf(key) else keys.subList(minOf(from, to), maxOf(from, to) + 1), on)
        anchor = key
    }
}

/** Remembers a TableSelection over `keys`, the rows' keys in the order shown. */
@Composable
fun <K> rememberTableSelection(keys: List<K>): TableSelection<K> {
    val selection = remember { TableSelection<K>() }
    selection.keys = keys
    return selection
}

/** A row's checkbox cell, for `key` in `selection`; `label` names it ("Select Rent"). */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun <K> TableSelectCell(selection: TableSelection<K>, key: K, label: String, modifier: Modifier = Modifier) {
    val row = LocalRow.current ?: error("TableSelectCell must be inside TableRow")
    val part = LocalPart.current
    val t = Zen.tokens
    val window = LocalWindowInfo.current
    Box(
        modifier
            .then(CellData(row, part, 40.dp, start = false, span = false))
            .then(LocalSwipeGesture.current)
            .motion(row, sticky = false)
            .box(RectangleShape, fill = SolidColor(if (row.selected) t.primary.color(0.09f) else Color.Transparent), border = SolidColor(t.tint.color(0.045f)), sides = Sides.Bottom)
            .padding(start = 12.dp, top = 10.dp, bottom = 10.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        Checkbox(selection.isSelected(key), { on -> selection.select(key, on, window.keyboardModifiers.isShiftPressed) }, label = label)
    }
}

/** The header's checkbox, for every row at once: checked when all are, a dash when some are. */
@Composable
fun <K> TableSelectHead(selection: TableSelection<K>, modifier: Modifier = Modifier, label: String? = null) {
    val row = LocalRow.current ?: error("TableSelectHead must be inside TableRow")
    val part = LocalPart.current
    val count = selection.selected.size
    val some = count > 0 && !selection.all
    Box(
        modifier
            .then(CellData(row, part, 40.dp, start = false, span = false))
            .sticky(part, false, row)
            .box(RectangleShape, border = SolidColor(Zen.tokens.tint.color(0.07f)), sides = Sides.Bottom)
            .padding(start = 12.dp, top = 10.dp, bottom = 10.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        Checkbox(
            selection.all,
            { on -> selection.set(selection.keys, if (some) false else on) },
            indeterminate = some,
            label = label ?: LocalMessages.current.selectAll,
        )
    }
}

/**
 * What to do with the selected rows: their count, your actions (`content`), and a × to clear the
 * selection. Floats at the bottom of the screen, rising into view, while any are selected.
 */
@Composable
fun SelectionBar(
    count: Int,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
    label: ((Int) -> String)? = null,
    clearLabel: String? = null,
    content: @Composable RowScope.() -> Unit = {},
) {
    if (count == 0) return
    val m = LocalMessages.current
    val t = Zen.tokens
    val shape = Zen.radii.xl2
    val reduced = reducedMotion()
    val rise = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(Unit) { rise.animateTo(1f, tween(300, easing = Ease.OutSoft)) }
    Fixed {
        Row(
            modifier
                .align(Alignment.BottomCenter)
                .padding(start = 16.dp, end = 16.dp, bottom = 24.dp)
                .graphicsLayer {
                    alpha = rise.value
                    translationY = (1f - rise.value) * 16.dp.toPx()
                }
                .semantics { contentDescription = m.selection }
                .glowEdge(shape)
                .glass(shape, blur = true, shadow = Shadow(y = 12f, blur = 40f, spread = -12f, color = Color.Black.copy(alpha = 0.6f)))
                .padding(start = 16.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                (label ?: m::selectedCount)(count),
                Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                style = TextStyles.sm.merge(TextStyles.medium).merge(TextStyles.tabular),
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Visible,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically, content = content)
            val state = rememberControlState()
            Box(
                Modifier
                    .size(32.dp)
                    .box(
                        Zen.radii.lg,
                        fill = SolidColor(if (state.hovered) t.tint.color(0.1f) else Color.Transparent),
                        shadows = focusRing(state.focusVisible),
                    )
                    .control(state, label = clearLabel ?: m.clearSelection, onClick = onClear)
                    .semantics { contentDescription = clearLabel ?: m.clearSelection },
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.XMarkMicro, color = if (state.hovered) t.foreground.color() else t.mutedForeground.color())
            }
        }
    }
}
