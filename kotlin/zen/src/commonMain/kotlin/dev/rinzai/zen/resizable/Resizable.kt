package dev.rinzai.zen.resizable

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.activeElement
import dev.rinzai.zen.boxShadow
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.resizeCursor
import dev.rinzai.zen.transition
import kotlin.math.roundToInt

enum class ResizableOrientation { Horizontal, Vertical }

/** How far an arrow key moves a handle, in percent. */
private const val STEP = 5f

/** How far a handle's grip reaches past its line, each side. */
private val GRIP = 8.dp

private class PanelSpec(val key: Any, val defaultSize: Float?, val minSize: Float, val maxSize: Float)

/** What a group's child is to it: a panel, or a handle between two. */
private class Slot(val panel: PanelSpec?, val handle: Handle?) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) = this@Slot
}

/** A handle's neighbours, the panels either side of it as laid out. */
private class Handle {
    var neighbours by mutableStateOf<Pair<PanelSpec, PanelSpec>?>(null)
}

@Stable
private class Group(val orientation: ResizableOrientation) {
    /** Sizes the user has given, every panel's at once; panels without one take their default, or share what's left. */
    val stored = mutableStateMapOf<Any, Float>()
    var panels: List<PanelSpec> = emptyList()
    var onLayout: ((List<Float>) -> Unit)? = null
    var dragging by mutableStateOf(false)
    /** Each panel's length as last laid out, in px: a drag turns px into percent by them. */
    var extents: Map<Any, Int> = emptyMap()

    fun sizes(panels: List<PanelSpec> = this.panels): Map<Any, Float> {
        val known = panels.associate { it.key to (stored[it.key] ?: it.defaultSize) }
        val unsized = known.count { it.value == null }
        val taken = known.values.sumOf { (it ?: 0f).toDouble() }.toFloat()
        val share = if (unsized > 0) maxOf(0f, 100f - taken) / unsized else 0f
        val next = known.mapValues { it.value ?: share }
        val total = next.values.sum().takeIf { it != 0f } ?: 1f
        return next.mapValues { it.value * 100f / total }
    }

    /** Moves the boundary between two neighbouring panels so the first is `size` (as near as their limits allow). */
    fun resize(a: PanelSpec, b: PanelSpec, size: Float) {
        val current = sizes()
        val pair = current.getValue(a.key) + current.getValue(b.key)
        val first = minOf(minOf(a.maxSize, pair - b.minSize), maxOf(maxOf(a.minSize, pair - b.maxSize), size))
        if (first == current[a.key]) return
        val next = current + mapOf(a.key to first, b.key to pair - first)
        stored.putAll(next)
        onLayout?.invoke(panels.map { next.getValue(it.key) })
    }
}

private val LocalGroup = compositionLocalOf<Group?> { null }

/**
 * Panels side by side (or stacked, Vertical) with handles between them to drag, or to focus and
 * move with the arrow keys. Sizes are percentages of the group; `onLayout` reports them all after
 * each change, e.g. to keep for next time as the panels' `defaultSize`. Groups nest. Fills what
 * it's given, as the web's `size-full`.
 */
@Composable
fun ResizablePanelGroup(
    modifier: Modifier = Modifier,
    orientation: ResizableOrientation = ResizableOrientation.Horizontal,
    onLayout: ((List<Float>) -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val group = remember(orientation) { Group(orientation) }
    group.onLayout = onLayout
    val horizontal = orientation == ResizableOrientation.Horizontal
    val grip = with(androidx.compose.ui.platform.LocalDensity.current) { GRIP.roundToPx() }
    CompositionLocalProvider(LocalGroup provides group) {
        val policy = remember(group, grip) {
            object : MeasurePolicy {
                override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
                val slots = measurables.map { it.parentData as? Slot }
                val panels = slots.mapNotNull { it?.panel }
                group.panels = panels
                val sizes = group.sizes(panels)
                val width = if (constraints.hasBoundedWidth) constraints.maxWidth else constraints.minWidth
                val height = if (constraints.hasBoundedHeight) constraints.maxHeight else constraints.minHeight
                val length = if (horizontal) width else height
                val cross = if (horizontal) height else width
                val line = 1.dp.roundToPx()
                val handles = slots.count { it?.handle != null }
                val free = (length - handles * line).coerceAtLeast(0)
                val sum = panels.sumOf { sizes.getValue(it.key).toDouble() }.takeIf { it > 0 } ?: 1.0
                // Each panel's share of the room left, rounded so the shares add up to it exactly.
                var acc = 0.0
                var used = 0
                val extent = panels.associate { p ->
                    acc += sizes.getValue(p.key) / sum * free
                    val end = acc.roundToInt()
                    (p.key to (end - used)).also { used = end }
                }
                group.extents = extent
                fun fixed(main: Int) = if (horizontal) Constraints.fixed(main, cross) else Constraints.fixed(cross, main)
                val placeables = measurables.mapIndexed { i, m: Measurable ->
                    val slot = slots[i]
                    when {
                        slot?.panel != null -> m.measure(fixed(extent.getValue(slot.panel.key)))
                        // The grip: wider than the line, over the panels either side.
                        slot?.handle != null -> {
                            val before = slots.subList(0, i).lastOrNull { it?.panel != null }?.panel
                            val after = slots.subList(i + 1, slots.size).firstOrNull { it?.panel != null }?.panel
                            val n = if (before != null && after != null) before to after else null
                            if (slot.handle.neighbours?.let { it.first.key == n?.first?.key && it.second.key == n?.second?.key } != true) slot.handle.neighbours = n
                            m.measure(fixed(line + 2 * grip))
                        }
                        else -> m.measure(fixed(0))
                    }
                }
                return layout(width, height) {
                    var at = 0
                    placeables.forEachIndexed { i, p ->
                        val slot = slots[i]
                        if (slot?.handle != null) {
                            if (horizontal) p.placeRelative(at - grip, 0, zIndex = 1f) else p.placeRelative(0, at - grip, zIndex = 1f)
                            at += line
                        } else {
                            if (horizontal) p.placeRelative(at, 0) else p.placeRelative(0, at)
                            at += if (horizontal) p.width else p.height
                        }
                    }
                }

                }

                // As a flex line's: along it, the parts' sizes added up (a panel's least is 0, as min-w-0 has it); across, the largest.
                fun IntrinsicMeasureScope.along(m: List<IntrinsicMeasurable>, least: Boolean, size: (IntrinsicMeasurable) -> Int) =
                    m.sumOf { if ((it.parentData as? Slot)?.handle != null) 1.dp.roundToPx() else if (least) 0 else size(it) }

                override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
                    if (horizontal) along(measurables, true) { 0 } else measurables.maxOfOrNull { it.minIntrinsicWidth(height) } ?: 0

                override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
                    if (horizontal) along(measurables, false) { it.maxIntrinsicWidth(height) } else measurables.maxOfOrNull { it.maxIntrinsicWidth(height) } ?: 0

                override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
                    if (!horizontal) along(measurables, true) { 0 } else measurables.maxOfOrNull { it.minIntrinsicHeight(width) } ?: 0

                override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
                    if (!horizontal) along(measurables, false) { it.maxIntrinsicHeight(width) } else measurables.maxOfOrNull { it.maxIntrinsicHeight(width) } ?: 0
            }
        }
        Layout(content, modifier.fillMaxSize(), policy)
    }
}

/** One panel: `defaultSize` is a percentage of the group (those without one share what's left); `minSize` and `maxSize` bound it. What's in it is clipped to it. */
@Composable
fun ResizablePanel(
    modifier: Modifier = Modifier,
    defaultSize: Float? = null,
    minSize: Float = 0f,
    maxSize: Float = 100f,
    content: @Composable BoxScope.() -> Unit,
) {
    LocalGroup.current ?: error("ResizablePanel must be inside ResizablePanelGroup")
    val key = remember { Any() }
    val slot = remember(defaultSize, minSize, maxSize) { Slot(PanelSpec(key, defaultSize, minSize, maxSize), null) }
    Box(modifier.then(slot).clipToBounds(), content = content)
}

/**
 * The boundary between two panels: a hairline that lights up while it's dragged, hovered or
 * focused, with a wider grip than it looks. Arrow keys move it, Home and End take the panel
 * before it to its smallest and largest.
 */
@Composable
fun ResizableHandle(modifier: Modifier = Modifier, label: String? = null) {
    val group = LocalGroup.current ?: error("ResizableHandle must be inside ResizablePanelGroup")
    val t = Zen.tokens
    val m = LocalMessages.current
    val handle = remember { Handle() }
    val horizontal = group.orientation == ResizableOrientation.Horizontal
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    val focus = remember { FocusRequester() }
    var active by remember { mutableStateOf(false) }
    val lit = state.focusVisible || active
    val color by animateColorAsState(
        when {
            lit -> t.primary.color()
            state.hovered -> t.primary.color(0.6f)
            else -> t.tint.color(0.09f)
        },
        transition(200),
    )
    val width by animateFloatAsState(if (lit) 2f else 1f, transition(200))
    val halo by animateFloatAsState(if (lit) 1f else 0f, transition(200))
    val glow = t.glow.color(0.8f * t.glowK)
    val shade = remember { Paint() }
    val neighbours = handle.neighbours
    val percent = neighbours?.let { group.sizes()[it.first.key] }
    val current by rememberUpdatedState(percent)
    fun keyTarget(key: Key): Float? {
        val (a, _) = neighbours ?: return null
        val now = current ?: return null
        // Leftwards is forwards in right-to-left text.
        val back = if (horizontal) (if (rtl) Key.DirectionRight else Key.DirectionLeft) else Key.DirectionUp
        val forth = if (horizontal) (if (rtl) Key.DirectionLeft else Key.DirectionRight) else Key.DirectionDown
        return when (key) {
            back -> now - STEP
            forth -> now + STEP
            Key.MoveHome -> a.minSize
            Key.MoveEnd -> a.maxSize
            else -> null
        }
    }
    Box(
        modifier
            .then(Slot(null, handle))
            .semantics {
                contentDescription = label ?: m.resize
                if (neighbours != null && percent != null) {
                    progressBarRangeInfo = ProgressBarRangeInfo(percent.roundToInt().toFloat(), neighbours.first.minSize..neighbours.first.maxSize)
                    setProgress { group.resize(neighbours.first, neighbours.second, it); true }
                }
            }
            .onKeyEvent { e ->
                if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                val (a, b) = neighbours ?: return@onKeyEvent false
                val to = keyTarget(e.key) ?: return@onKeyEvent false
                group.resize(a, b, to)
                true
            }
            .focusRequester(focus)
            .activeElement()
            .focusable(interactionSource = source)
            .pointerHoverIcon(resizeCursor(!horizontal))
            .pointerInput(horizontal, rtl) {
                awaitEachGesture {
                    val down = awaitFirstDown()
                    val (a, b) = handle.neighbours ?: return@awaitEachGesture
                    val sizes = group.sizes()
                    val from = sizes.getValue(a.key)
                    val pair = from + sizes.getValue(b.key)
                    val length = (group.extents[a.key] ?: 0) + (group.extents[b.key] ?: 0)
                    val perPx = pair / length.coerceAtLeast(1)
                    val flip = if (horizontal && rtl) -1f else 1f
                    down.consume()
                    focus.requestFocus()
                    active = true
                    group.dragging = true
                    try {
                        while (true) {
                            val c = awaitPointerEvent().changes.firstOrNull { it.id == down.id } ?: break
                            if (!c.pressed) break
                            val d = if (horizontal) c.position.x - down.position.x else c.position.y - down.position.y
                            group.resize(a, b, from + d * perPx * flip)
                            c.consume()
                        }
                    } finally {
                        active = false
                        group.dragging = false
                    }
                }
            }
            .drawBehind {
                val g = GRIP.toPx()
                val w = width.dp.toPx()
                val line = 1.dp.toPx()
                // Centred on the 1dp line, as the web's absolutely placed span is.
                val (topLeft, box) = if (horizontal) Offset(g + (line - w) / 2f, 0f) to Size(w, size.height) else Offset(0f, g + (line - w) / 2f) to Size(size.width, w)
                if (halo > 0f) boxShadow(Outline.Rectangle(androidx.compose.ui.geometry.Rect(topLeft, box)), Shadow(blur = 12f, color = glow.copy(alpha = glow.alpha * halo)), shade)
                drawRect(color, topLeft, box)
            },
    )
}
