package dev.rinzai.zen

import androidx.compose.animation.core.VectorConverter
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.first
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.currentValueOf
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/** Which of the trigger's edges a popup lines up with: start, end, or centred on it. */
enum class PopupAlign { Start, Center, End }

/** Below the trigger (above it when there's no room), or beside it (after it; before it when there's no room). */
enum class PopupSide { Below, Beside }

/**
 * A popup's open state and what it's anchored to, as the browser's popover keeps it: open it from
 * its trigger (give the trigger Modifier.popupAnchor), and it closes on its own on a press outside
 * it and on Escape (light dismiss), focus going back to the trigger.
 */
@Stable
class PopupState internal constructor() {
    var open by mutableStateOf(false)
        private set

    /** The trigger's box, in the window. */
    internal var anchor by mutableStateOf(Rect.Zero)

    /** The popup's box once placed, in the window: presses in it don't dismiss it. */
    internal var bounds = Rect.Zero

    internal val trigger = FocusRequester()
    internal var page: Page? = null
    internal var onOpenChange: ((Boolean) -> Unit)? = null

    /** Closes on outside presses and Escape (a popover="auto"); a tooltip's doesn't (manual). */
    internal var lightDismiss = true

    /** Opening in another popup's place (handOff): that one, which this one moves on from. */
    internal var handOff: PopupState? = null

    /** Giving way to another opening in its place: it stays until that one is there, then goes at once. */
    internal var givingWay by mutableStateOf(false)

    fun show() = set(true)
    fun hide() = set(false)
    fun toggle() = set(!open)

    internal fun set(to: Boolean) {
        if (open == to) return
        open = to
        page?.let { if (lightDismiss) it.popups.opened(this, to) }
        onOpenChange?.invoke(to)
    }
}

/** A popup's state; `onOpenChange` hears every open and close (the trigger, outside presses, Escape). */
@Composable
fun rememberPopupState(onOpenChange: ((Boolean) -> Unit)? = null): PopupState {
    val page = LocalPage.current
    val state = remember { PopupState() }
    state.page = page
    state.onOpenChange = onOpenChange
    DisposableEffect(state) { onDispose { if (state.open) page.popups.opened(state, false) } }
    return state
}

/** The element a popup is placed against (its trigger), and where focus goes back to when it closes. */
fun Modifier.popupAnchor(state: PopupState): Modifier =
    this.onGloballyPositioned { state.anchor = it.boundsInRoot() }.focusRequester(state.trigger)

/** The open auto popups, oldest first: the browser's popover stack. */
internal class PopupStack {
    private val stack = mutableListOf<PopupState>()

    /**
     * As the browser's popover stack does: opening one closes those that aren't its ancestors (the
     * popup its trigger is in, and that one's); closing one closes those above it first.
     */
    fun opened(state: PopupState, open: Boolean) {
        if (open) {
            val at = state.anchor.center
            val parent = stack.indexOfLast { it !== state && at in it.bounds }
            for (popup in stack.drop(parent + 1).asReversed()) if (popup !== state) popup.hide()
            stack -= state
            stack += state
        } else {
            val i = stack.indexOf(state)
            if (i < 0) return
            for (popup in stack.drop(i + 1).asReversed()) popup.hide()
            stack -= state
        }
    }

    /**
     * A press at `at`: closes the popups above the topmost one it's in (in its box, or on its
     * trigger, which toggles it itself), as the browser's light dismiss does.
     */
    fun press(at: Offset) {
        val keep = stack.indexOfLast { at in it.bounds || at in it.anchor }
        for (popup in stack.drop(keep + 1).asReversed()) popup.hide()
    }

    /** All of them, newest first, as a modal dialog opening closes every popover. */
    fun hideAll() {
        for (popup in stack.toList().asReversed()) popup.hide()
    }

    /** Escape: the topmost closes, and focus goes back to its trigger. */
    fun escape(): Boolean {
        val top = stack.lastOrNull() ?: return false
        top.hide()
        runCatching { top.trigger.requestFocus() }
        return true
    }
}

/**
 * Where a popup goes against its trigger, as CSS anchor positioning places one with position-area
 * and its fallbacks (flip-inline, flip-block, both): the first that fits in the window, else the
 * first, shifted into the window. `gap` is its margin from the trigger (on both sides, as
 * margin-block is).
 */
internal fun place(
    anchor: Rect,
    width: Int,
    height: Int,
    window: Rect,
    side: PopupSide,
    align: PopupAlign,
    gap: Float,
    rtl: Boolean,
    margin: Float = 0f,
): Offset {
    val tries = when {
        align != PopupAlign.Center -> listOf(false to false, true to false, false to true, true to true)
        side == PopupSide.Beside -> listOf(false to false, true to false)
        else -> listOf(false to false, false to true)
    }
    fun at(flipInline: Boolean, flipBlock: Boolean): Pair<Offset, Boolean> {
        // Logical start/end, flipped where the text runs right to left.
        val toEnd = rtl == flipInline
        return if (side == PopupSide.Below) {
            val below = !flipBlock
            val y = if (below) anchor.bottom + gap else anchor.top - gap - height
            val fitsY = if (below) anchor.bottom + 2 * gap + height <= window.bottom else anchor.top - 2 * gap - height >= window.top
            val x = when (align) {
                PopupAlign.Center -> (anchor.center.x - width / 2f).coerceIn(window.left, max(window.left, window.right - width))
                PopupAlign.Start -> if (toEnd) anchor.left else anchor.right - width
                PopupAlign.End -> if (toEnd) anchor.right - width else anchor.left
            }
            val fitsX = x >= window.left && x + width <= window.right
            Offset(x, y) to (fitsX && fitsY)
        } else {
            val after = toEnd
            val x = if (after) anchor.right + gap else anchor.left - gap - width
            val fitsX = if (after) anchor.right + 2 * gap + width <= window.right else anchor.left - 2 * gap - width >= window.left
            val y = when (align) {
                PopupAlign.Center -> anchor.center.y - height / 2f
                PopupAlign.Start -> if (!flipBlock) anchor.top + margin else anchor.bottom - height - margin
                PopupAlign.End -> if (!flipBlock) anchor.bottom - height - margin else anchor.top + margin
            }
            val fitsY = y >= window.top && y + height <= window.bottom
            Offset(x, y) to (fitsX && fitsY)
        }
    }
    for ((i, b) in tries) {
        val (o, fits) = at(i, b)
        if (fits) return o
    }
    // Fitting nowhere, the first is shifted into the window, its margin and all, where it fits
    // there: CSS keeps a box that overflows its position-area within the viewport.
    val o = at(false, false).first
    val (gx, gy) = if (side == PopupSide.Below) 0f to gap else gap to 0f
    fun shift(v: Float, size: Int, lo: Float, hi: Float) = if (size > hi - lo) v else v.coerceIn(lo, hi - size)
    return Offset(shift(o.x, width, window.left + gx, window.right - gx), shift(o.y, height, window.top + gy, window.bottom - gy))
}

/*
 * A popup opening against its trigger: it grows out of the edge facing the trigger, from 0.86 × 0.72
 * and 10dp nearer, on the settling spring: it lands on its size without bouncing (the pop spring's
 * wobble read as childish). It's there within 150ms. In a popup opened now and then (a popover, a
 * picker) its rows (Modifier.popupRow) drop in after it, 45ms apart; a menu or list, opened all day,
 * comes in whole, as Apple's guidelines keep motion off frequent interactions. Shutting is quick:
 * it fades in 130ms, pulling back toward the trigger. popupMotion.ts does the same.
 */
private const val FROM_ALONG = 0.86f
private const val FROM_ACROSS = 0.72f
private const val SHUT_ALONG = 0.92f
private const val SHUT_ACROSS = 0.86f
private val NEARER = 10.dp
private val ROW_DROP = 8.dp
private const val ROW_GAP = 45
/** Rows after this many come with the last: a long list doesn't keep arriving. */
private const val ROW_CAP = 6

/**
 * A popup's surface easing from its old size to its new one when what it holds changes (a list
 * filtering as you type), as Apple's guidelines ask of a popover, rather than jumping: 220ms on
 * the ease a shape changing size takes. Goes right after the surface (glass), so the surface is
 * drawn at each size it passes through, its contents clipped to it. popupMotion.ts does the same.
 */
@Composable
internal fun Modifier.popupResize(): Modifier = if (reducedMotion()) this else this then PopupResize

private data object PopupResize : ModifierNodeElement<PopupResizeNode>() {
    override fun create() = PopupResizeNode()
    override fun update(node: PopupResizeNode) = Unit
}

private class PopupResizeNode : Modifier.Node(), LayoutModifierNode, DrawModifierNode, CompositionLocalConsumerModifierNode {
    // Unset until first measured: it opens at its size, easing only later changes.
    private val eased = Animatable(IntSize.Zero, IntSize.VectorConverter)

    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val content = measurable.measure(constraints)
        val natural = IntSize(content.width, content.height)
        // Opening in another's place, it goes from that one's size to its own as it moves, on the move's clock.
        val e = currentValueOf(LocalPopupEntrance)
        val from = e?.from
        if (from != null && eased.value == IntSize.Zero && e.moving.value < 1f) {
            val k = e.moving.value
            val w = (from.width + (natural.width - from.width) * k).roundToInt()
            val h = (from.height + (natural.height - from.height) * k).roundToInt()
            return layout(constraints.constrainWidth(w), constraints.constrainHeight(h)) { content.place(0, 0) }
        }
        when {
            eased.value == IntSize.Zero -> coroutineScope.launch { eased.snapTo(natural) }
            eased.targetValue != natural -> coroutineScope.launch { eased.animateTo(natural, tween(220, easing = Ease.OutSoft)) }
        }
        val shown = if (eased.value == IntSize.Zero) natural else eased.value
        return layout(constraints.constrainWidth(shown.width), constraints.constrainHeight(shown.height)) { content.place(0, 0) }
    }

    // Clipped only while it eases, so nothing of its contents is cut once it has its eased.
    override fun ContentDrawScope.draw() {
        val moving = currentValueOf(LocalPopupEntrance)?.moving?.isRunning == true
        if (eased.isRunning || moving) clipRect { this@draw.drawContent() } else drawContent()
    }

    // Asked how big it would be (IntrinsicSize), it answers for its contents, starting nothing.
    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = measurable.minIntrinsicWidth(height)
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = measurable.maxIntrinsicWidth(height)
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.minIntrinsicHeight(width)
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.maxIntrinsicHeight(width)
}

/**
 * Moving on to another's place, its contents swap in this long, sliding SWAP_SHIFT the way it
 * goes: the old ones gone by SWAP_OUT_MS, the new coming from SWAP_IN_AT (popupMotion's).
 */
internal const val SWAP_MS = 220
internal const val SWAP_OUT_MS = 100
internal const val SWAP_IN_AT = 60
internal val SWAP_SHIFT = 12.dp

/** One opening of a popup: which way its trigger is, and the rows it has handed places to. */
internal class PopupEntrance(val from: Rect? = null) {
    /** Toward the trigger, -1/0/1 on each axis, and where on the popup's facing edge it grows from. */
    var dx = 0f
    var dy = -1f
    var origin = TransformOrigin(0.5f, 0f)
    /** State, so rows caught mid-entrance by a shut are drawn whole: the popup goes as one. */
    var shutting by mutableStateOf(false)

    /**
     * Opening in another's place: that one's box, moved on from as `moving` runs 0 to 1. `swap` is
     * the time through it (0 to 1 over SWAP_MS, linear), as its contents take over from that one's.
     */
    val moving = Animatable(if (from != null) 0f else 1f)
    val swap = Animatable(if (from != null) 0f else 1f)
    /** The popup it opened in place of, there until this one is. */
    var giver: PopupState? = null

    fun handedOver() {
        giver?.givingWay = false
        giver = null
    }

    /** Milliseconds since it opened, run up to when the last row has landed. */
    val clock = Animatable(0f)
    private var rows = 0

    fun nextRow(): Int = rows++

    /** How far in the `row`th row is, 0 to 1. */
    fun row(row: Int): Float =
        if (shutting) 1f else Ease.OutSoft.transform(((clock.value - ROW_START - min(row, ROW_CAP) * ROW_GAP) / ROW_MS).coerceIn(0f, 1f))

    /** The `row`th row's layer, for a layout placing its own rows (placeWithLayer). */
    fun layer(row: Int): GraphicsLayerScope.() -> Unit = {
        val p = row(row)
        alpha = p
        translationX = dx * ROW_DROP.toPx() * (1f - p)
        translationY = dy * ROW_DROP.toPx() * (1f - p)
    }

    companion object {
        const val ROW_START = 30
        const val ROW_MS = 260
        const val END = ROW_START + ROW_CAP * ROW_GAP + ROW_MS
    }
}

internal val LocalPopupEntrance = compositionLocalOf<PopupEntrance?> { null }

/** One row of a popup, whatever rows it holds: they come in with it, as one. */
@Composable
internal fun PopupRow(whole: Boolean = true, content: @Composable () -> Unit) {
    if (!whole) return content()
    Box(Modifier.popupRow()) { CompositionLocalProvider(LocalPopupEntrance provides null, content = content) }
}

/**
 * A row of a popup (an item, a separator, a section): it drops in after the popup opens, each a
 * beat after the one before, as the web's rows do (there, the children of the popup's first
 * element holding more than one). Zen's popovers and pickers have it; give it to the parts of your
 * own popover content. Leave it off a menu's or a list's rows, which come in whole. Outside an
 * opening popup it does nothing.
 */
@Composable
fun Modifier.popupRow(): Modifier {
    val entrance = LocalPopupEntrance.current ?: return this
    val row = remember(entrance) { entrance.nextRow() }
    return graphicsLayer(entrance.layer(row))
}

/**
 * The popup itself, drawn in the browser's top layer (over everything, frosting what's under it)
 * while open and through its exit, placed against `state`'s trigger. It grows out of the trigger as
 * above; a `tooltip` instead fades in (150ms) as its gap grows by 6dp (180ms), and back out (scale
 * reads as resizing, and one flipped above slides the right way). `atLeastTrigger` makes it at
 * least the trigger's width, `matchTrigger` exactly that (anchor-size(width)).
 * `margin` is its margin along the trigger (margin-block beside one), as a submenu's -6dp lines
 * its first item up with the item that opened it.
 */
@Composable
internal fun AnchoredPopup(
    state: PopupState,
    side: PopupSide = PopupSide.Below,
    align: PopupAlign = PopupAlign.Center,
    offset: Dp = 4.dp,
    atLeastTrigger: Boolean = false,
    margin: Dp = 0.dp,
    matchTrigger: Boolean = false,
    tooltip: Boolean = false,
    content: @Composable BoxScope.(gap: Float) -> Unit,
) {
    val page = LocalPage.current
    val reduced = reducedMotion()
    val shown = remember { Animatable(0f) }
    val slid = remember { Animatable(0f) }
    /** How far along the open (or, shutting, the shut) it is. */
    val moved = remember { Animatable(1f) }
    var entrance by remember { mutableStateOf(PopupEntrance()) }
    var mounted by remember { mutableStateOf(state.open) }
    LaunchedEffect(state.open) {
        if (state.open) {
            if (!tooltip) entrance = PopupEntrance(from = if (reduced) null else state.handOff?.bounds)
            entrance.giver = state.handOff
            state.handOff = null
            mounted = true
        } else {
            entrance.shutting = true
            entrance.handedOver()
        }
        val to = if (state.open) 1f else 0f
        val e = entrance
        when {
            !state.open && state.givingWay -> {
                snapshotFlow { state.givingWay }.first { !it }
                shown.snapTo(0f)
            }
            reduced -> {
                shown.snapTo(to)
                slid.snapTo(to)
                moved.snapTo(1f)
                entrance.clock.snapTo(PopupEntrance.END.toFloat())
            }
            // In another's place: there already, it moves on to its own as its contents come in.
            state.open && e.from != null -> {
                shown.snapTo(1f)
                moved.snapTo(1f)
                e.clock.snapTo(PopupEntrance.END.toFloat())
                coroutineScope {
                    launch { e.moving.animateTo(1f, tween(SWAP_MS, easing = Ease.OutSoft)) }
                    launch { e.swap.animateTo(1f, tween(SWAP_MS, easing = Ease.Linear)) }
                }
            }
            tooltip -> coroutineScope {
                launch { shown.animateTo(to, tween(150, easing = Ease.Css)) }
                launch { slid.animateTo(to, tween(180, easing = Ease.OutSoft)) }
            }
            else -> coroutineScope {
                shown.snapTo(1f - to)
                moved.snapTo(0f)
                launch { shown.animateTo(to, tween(if (state.open) 150 else 130, easing = Ease.Linear)) }
                if (state.open) launch { entrance.clock.animateTo(PopupEntrance.END.toFloat(), tween(PopupEntrance.END, easing = Ease.Linear)) }
                launch {
                    if (state.open) moved.animateTo(1f, tween(Spring.Shape.ms, easing = Spring.Shape))
                    else moved.animateTo(1f, tween(180, easing = Ease.OutSoft))
                }
            }
        }
        if (!state.open) mounted = false
    }
    if (!mounted) return
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val e = entrance
    Portal(page.top) {
        Layout(
            content = {
                Box(
                    Modifier.graphicsLayer {
                        alpha = shown.value
                        // Giving way, it stays as it is until the other is there.
                        if (tooltip || reduced || state.givingWay) return@graphicsLayer
                        val from = e.from
                        if (from != null && !e.shutting) {
                            val k = 1f - e.moving.value
                            translationX = (from.left - state.bounds.left) * k
                            translationY = (from.top - state.bounds.top) * k
                            return@graphicsLayer
                        }
                        val vertical = e.dy != 0f
                        val (fx, fy) = when {
                            e.shutting -> if (vertical) SHUT_ALONG to SHUT_ACROSS else SHUT_ACROSS to SHUT_ALONG
                            else -> if (vertical) FROM_ALONG to FROM_ACROSS else FROM_ACROSS to FROM_ALONG
                        }
                        // Opening runs from (fx, fy) to as it is; shutting, back the other way.
                        val k = if (e.shutting) moved.value else 1f - moved.value
                        val d = (if (e.shutting) ROW_DROP else NEARER).toPx() * k
                        transformOrigin = e.origin
                        scaleX = 1f + (fx - 1f) * k
                        scaleY = 1f + (fy - 1f) * k
                        translationX = e.dx * d
                        translationY = e.dy * d
                    },
                    propagateMinConstraints = true,
                ) { CompositionLocalProvider(LocalPopupEntrance provides if (tooltip) null else e) { content(offset.value) } }
            },
            modifier = Modifier.matchParentSize(),
        ) { measurables, c ->
            val window = Rect(0f, 0f, c.maxWidth.toFloat(), c.maxHeight.toFloat())
            val min = if (atLeastTrigger || matchTrigger) min(state.anchor.width.roundToInt(), c.maxWidth) else 0
            val p = measurables.first().measure(Constraints(minWidth = min, maxWidth = if (matchTrigger) min else c.maxWidth, maxHeight = c.maxHeight))
            val gap = if (tooltip) offset.toPx() - 6.dp.toPx() * (1f - slid.value) else offset.toPx()
            val at = place(state.anchor, p.width, p.height, window, side, align, gap, rtl, margin.toPx())
            val box = Rect(at, androidx.compose.ui.geometry.Size(p.width.toFloat(), p.height.toFloat()))
            state.bounds = box
            // Placed: the popup it took over from can go.
            e.handedOver()
            if (!e.shutting) face(e, box, state.anchor)
            layout(c.maxWidth, c.maxHeight) { p.place(at.x.roundToInt(), at.y.roundToInt()) }
        }
    }
}

/** Which way the trigger is from the popup, and the point on the popup's facing edge nearest it. */
private fun face(e: PopupEntrance, p: Rect, t: Rect) {
    val x = (t.center.x - p.left).coerceIn(0f, p.width) / p.width.coerceAtLeast(1f)
    val y = (t.center.y - p.top).coerceIn(0f, p.height) / p.height.coerceAtLeast(1f)
    when {
        p.top >= t.bottom - 1 -> { e.origin = TransformOrigin(x, 0f); e.dx = 0f; e.dy = -1f }
        p.bottom <= t.top + 1 -> { e.origin = TransformOrigin(x, 1f); e.dx = 0f; e.dy = 1f }
        p.left >= t.center.x -> { e.origin = TransformOrigin(0f, y); e.dx = -1f; e.dy = 0f }
        else -> { e.origin = TransformOrigin(1f, y); e.dx = 1f; e.dy = 0f }
    }
}
