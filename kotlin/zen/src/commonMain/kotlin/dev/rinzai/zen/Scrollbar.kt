package dev.rinzai.zen

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.LayoutModifier
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.layout.LookaheadScope
import androidx.compose.ui.layout.approachLayout
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

/** The thin scrollbar Chrome draws for base.css (`scrollbar-width: thin`), where there's a mouse: 10px, its thumb tint/0.14. */
internal val SCROLLBAR = 10.dp

@Composable
internal fun androidx.compose.foundation.layout.BoxScope.PageScrollbar(scroll: ScrollState) {
    if (coarsePointer) return
    val thumb = Zen.tokens.tint.color(0.14f)
    val bar = remember(scroll) { scroll.bar() }
    Box(
        Modifier
            .align(androidx.compose.ui.Alignment.TopEnd)
            .width(SCROLLBAR)
            .fillMaxHeight()
            .pointerInput(scroll) {
                detectDragGestures { change, drag ->
                    change.consume()
                    scroll.dispatchRawDelta(drag.y * trackScale(trackLength(size.height.toFloat(), SCROLLBAR.toPx()), bar))
                }
            }
            .drawBehind { drawBar(thumb, Rect(Offset.Zero, size), bar, vertical = true) },
    )
}

/**
 * CSS's `overflow: auto` with base.css's thin scrollbars: `content` scrolls along whichever of
 * `vertical` and `horizontal` it's given. Where there's a mouse and it overflows, a scrollbar takes
 * 10px of room at the end (along the bottom, across), as Chrome lays out a classic one: the content
 * is laid out once, then again beside the scrollbar if it overflowed. Its thumb can be dragged.
 */
@Composable
fun ScrollArea(
    modifier: Modifier = Modifier,
    vertical: ScrollState? = null,
    horizontal: ScrollState? = null,
    /** A resizer in the end corner (resize: vertical): the vertical bar stops short of it, as Chrome's does. */
    resizer: Boolean = false,
    content: @Composable () -> Unit,
) {
    val bars = !coarsePointer && (vertical != null || horizontal != null)
    val gutter = remember { Gutter() }
    LookaheadScope {
        Box(
            modifier
                .then(if (bars) Modifier.scrollbars(gutter, remember(vertical) { vertical?.bar() }, remember(horizontal) { horizontal?.bar() }, resizer) else Modifier)
                .then(if (vertical != null) Modifier.verticalScroll(vertical) else Modifier)
                .then(if (horizontal != null) Modifier.horizontalScroll(horizontal) else Modifier)
                .then(if (bars) Modifier.scrolledContent(gutter) else Modifier),
            propagateMinConstraints = true,
        ) { content() }
    }
}

/**
 * What the content measured, in the look-ahead pass, and which bars that left room for: state, so
 * what's sized from this box's intrinsic size (a list as wide as its widest item) is again once a
 * bar comes or goes, as Chrome lays out again when a scrollbar appears.
 */
internal class Gutter {
    var content = IntSize.Zero
    /** The content's full height where it lays out only the part in view (a windowed Table's rows). */
    var extent = 0
    var down by mutableStateOf(false)
    var across by mutableStateOf(false)
}

/**
 * What a box with scrollbars scrolls: looking ahead, it's measured at its own size, not stretched to
 * fill, into `gutter.content`, for whether it still fits once a bar takes room.
 */
internal fun Modifier.scrolledContent(gutter: Gutter) = layout { m, c ->
    val p = m.measure(if (isLookingAhead) c.copy(minWidth = 0, minHeight = 0) else c)
    if (isLookingAhead) gutter.content = IntSize(p.width, maxOf(p.height, gutter.extent))
    layout(maxOf(p.width, c.minWidth), maxOf(p.height, c.minHeight)) { p.place(0, 0) }
}

/** Intrinsic sizes with the bars' room, as a box's max-content width counts its scrollbar. */
private class GutterIntrinsics(private val gutter: Gutter) : LayoutModifier {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val p = measurable.measure(constraints)
        return layout(p.width, p.height) { p.place(0, 0) }
    }
    private fun IntrinsicMeasureScope.dx() = if (gutter.down) SCROLLBAR.roundToPx() else 0
    private fun IntrinsicMeasureScope.dy() = if (gutter.across) SCROLLBAR.roundToPx() else 0
    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = measurable.minIntrinsicWidth(height) + dx()
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = measurable.maxIntrinsicWidth(height) + dx()
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.minIntrinsicHeight(width) + dy()
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.maxIntrinsicHeight(width) + dy()
}

/** What a scrollbar shows and moves: a ScrollState, or a TableScrollState (which scrolls a view it lays out itself). */
internal interface Scrolled {
    val value: Int
    val maxValue: Int
    val viewportSize: Int
    fun dispatchRawDelta(delta: Float): Float
}

internal fun ScrollState.bar() = object : Scrolled {
    override val value get() = this@bar.value
    override val maxValue get() = this@bar.maxValue
    override val viewportSize get() = this@bar.viewportSize
    override fun dispatchRawDelta(delta: Float) = this@bar.dispatchRawDelta(delta)
}

/**
 * Classic scrollbars along the box's end and bottom, which take room from its content when it
 * overflows, as Chrome's do. In a LookaheadScope, whatever the box scrolls records its size in
 * `gutter.content` in the look-ahead pass; the bars are laid out from that.
 */
@Composable
internal fun Modifier.scrollbars(gutter: Gutter, vertical: Scrolled?, horizontal: Scrolled?, resizer: Boolean = false): Modifier {
    val thumb = Zen.tokens.tint.color(0.14f)
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    return then(GutterIntrinsics(gutter)).scrollbars(gutter, vertical, horizontal, thumb, rtl, resizer)
}

private fun Modifier.scrollbars(gutter: Gutter, vertical: Scrolled?, horizontal: Scrolled?, thumb: Color, rtl: Boolean, resizer: Boolean) = this
    .pointerInput(vertical, horizontal, rtl) {
        awaitEachGesture {
            val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
            val g = SCROLLBAR.toPx()
            val x = if (rtl) size.width - down.position.x else down.position.x
            val (state, onVertical) = when {
                gutter.down && vertical != null && x >= size.width - g -> vertical to true
                gutter.across && horizontal != null && down.position.y >= size.height - g -> horizontal to false
                else -> return@awaitEachGesture
            }
            down.consume()
            val track = trackLength(if (onVertical) size.height - (if (gutter.across || resizer) g else 0f) else size.width - (if (gutter.down) g else 0f), g)
            while (true) {
                val change = awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull { it.id == down.id } ?: break
                if (!change.pressed) break
                val moved = change.positionChange()
                val by = if (onVertical) moved.y else if (rtl) -moved.x else moved.x
                state.dispatchRawDelta(by * trackScale(track, state))
                change.consume()
            }
        }
    }
    .drawWithContent {
        drawContent()
        val g = SCROLLBAR.toPx()
        val rtl = layoutDirection == LayoutDirection.Rtl
        val corner = if (gutter.down && gutter.across) g else 0f
        if (gutter.down && vertical != null) {
            val left = if (rtl) 0f else size.width - g
            drawBar(thumb, Rect(left, 0f, left + g, size.height - (if (gutter.across || resizer) g else 0f)), vertical, vertical = true)
        }
        if (gutter.across && horizontal != null) {
            val start = if (rtl) corner else 0f
            drawBar(thumb, Rect(start, size.height - g, start + size.width - corner, size.height), horizontal, vertical = false, rtl = rtl)
        }
    }
    .approachLayout({ true }) { measurable, constraints ->
        val g = SCROLLBAR.roundToPx()
        val content = gutter.content
        // Room for one bar can push the content over along the other.
        var down = vertical != null && constraints.hasBoundedHeight && content.height > constraints.maxHeight
        val across = horizontal != null && constraints.hasBoundedWidth && content.width > constraints.maxWidth - (if (down) g else 0)
        if (across && vertical != null && constraints.hasBoundedHeight) down = content.height > constraints.maxHeight - g
        if (gutter.down != down) gutter.down = down
        if (gutter.across != across) gutter.across = across
        val dx = if (down) g else 0
        val dy = if (across) g else 0
        val p = measurable.measure(constraints.shrink(dx, dy))
        layout(p.width + dx, p.height + dy) { p.place(if (layoutDirection == LayoutDirection.Rtl) dx else 0, 0) }
    }

private fun Constraints.shrink(dx: Int, dy: Int) = Constraints(
    minWidth = (minWidth - dx).coerceAtLeast(0),
    maxWidth = if (hasBoundedWidth) (maxWidth - dx).coerceAtLeast(0) else maxWidth,
    minHeight = (minHeight - dy).coerceAtLeast(0),
    maxHeight = if (hasBoundedHeight) (maxHeight - dy).coerceAtLeast(0) else maxHeight,
)

/** How far the content scrolls for each pixel the thumb moves along a `track` that long. */
private fun trackScale(track: Float, scroll: Scrolled) = (scroll.viewportSize + scroll.maxValue) / track

/**
 * Chrome's thin classic scrollbar in `bar`: a button at each end (a pixel longer than the bar is
 * thick) with a small arrow, and between them the thumb, as long as the share of the content in view
 * (11px at least), inset 1px along and 2px across, round. Arrows and thumb are the thumb colour.
 */
private fun DrawScope.drawBar(color: Color, bar: Rect, scroll: Scrolled, vertical: Boolean, rtl: Boolean = false) {
    if (scroll.maxValue <= 0) return
    val g = if (vertical) bar.width else bar.height
    val unit = g / 10f
    val button = g + unit
    // The arrows: rows of 2, 4 and 6px pointing out, centred in the button down the bar, a pixel nearer the end across it.
    val from = if (vertical) 4 else 3
    for ((n, w) in listOf(2f, 4f, 6f).withIndex()) {
        val along = (from + n) * unit
        val half = w / 2 * unit
        if (vertical) {
            val cx = bar.left + bar.width / 2
            drawRect(color, Offset(cx - half, bar.top + along), Size(2 * half, unit))
            drawRect(color, Offset(cx - half, bar.bottom - along - unit), Size(2 * half, unit))
        } else {
            val cy = bar.top + bar.height / 2
            drawRect(color, Offset(bar.left + along, cy - half), Size(unit, 2 * half))
            drawRect(color, Offset(bar.right - along - unit, cy - half), Size(unit, 2 * half))
        }
    }
    val length = trackLength(if (vertical) bar.height else bar.width, g)
    if (length <= 0f) return
    val viewport = scroll.viewportSize.toFloat()
    val end = unit
    val l = maxOf(length * viewport / (viewport + scroll.maxValue), 11 * unit + 2 * end).coerceAtMost(length)
    val along = (length - l) * scroll.value / scroll.maxValue
    val at = button + if (!vertical && rtl) length - l - along else along
    val inset = 2 * unit
    val thickness = g - 2 * inset
    drawRoundRect(
        color,
        if (vertical) Offset(bar.left + inset, bar.top + at + end) else Offset(bar.left + at + end, bar.top + inset),
        if (vertical) Size(thickness, l - 2 * end) else Size(l - 2 * end, thickness),
        CornerRadius(thickness / 2),
    )
}

/** The track a bar `size` long and `g` thick leaves the thumb, between its buttons. */
private fun trackLength(size: Float, g: Float) = size - 2 * (g + g / 10f)
