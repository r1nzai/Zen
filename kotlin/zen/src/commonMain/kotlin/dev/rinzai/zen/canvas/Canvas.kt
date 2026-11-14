package dev.rinzai.zen.canvas

import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.AwaitPointerEventScope
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.PointerKeyboardModifiers
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.isCtrlPressed
import androidx.compose.ui.input.pointer.isMetaPressed
import androidx.compose.ui.input.pointer.isPrimaryPressed
import androidx.compose.ui.input.pointer.isShiftPressed
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.LayoutModifier
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle
import dev.rinzai.zen.CssCursor
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Messages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.cssCursor
import dev.rinzai.zen.insetRing
import dev.rinzai.zen.outline
import dev.rinzai.zen.radii
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * What a Canvas places: an item with an `id`, where it is (`rect`, in the design's units), and
 * whether it's `locked` (not moved or resized, and presses go through it to the surface, though Tab
 * still reaches it: a background, say). `at` is the same item at another place, its other fields
 * kept, as the canvas moves it.
 */
interface CanvasPlaced<T> {
    val id: String
    val rect: CanvasRect
    val locked: Boolean get() = false
    fun at(rect: CanvasRect): T
}

/** An item that's only a place: for a canvas whose items keep their content elsewhere. */
@Stable
data class CanvasItemRect(
    override val id: String,
    val x: Double,
    val y: Double,
    val w: Double,
    val h: Double,
    override val locked: Boolean = false,
) : CanvasPlaced<CanvasItemRect> {
    override val rect get() = CanvasRect(x, y, w, h)
    override fun at(rect: CanvasRect) = copy(x = rect.x, y = rect.y, w = rect.w, h = rect.h)
}

/** How far (screen px) a press moves before it's a drag, so a click with a shaky hand moves nothing. */
private const val SLOP = 3f

internal class Readout(val box: CanvasRect, val text: String)

internal class Group(val rects: Map<String, CanvasRect>, val box: CanvasRect, val guides: List<CanvasGuide>)

/** What a Canvas's items get: their places, the selection, and the presses and keys on them. */
@Stable
class CanvasScope internal constructor(internal val state: CanvasState<*>)

@Stable
internal class CanvasState<T : CanvasPlaced<T>> {
    // Read as items lay themselves out, so they follow a change.
    var items by mutableStateOf(emptyList<T>())
    var onItemsChange: (List<T>) -> Unit = {}
    var onItemsChangeEnd: ((List<T>, List<T>) -> Unit)? = null
    var selected by mutableStateOf(emptyList<String>())
    var onSelectedChange: ((List<String>) -> Unit)? = null
    var bounds = CanvasBounds(0.0, 0.0, 8.0)
    var threshold = 0.0
    var grid: Double? = null
    var messages: Messages = Messages()

    /** Screen px per design unit. */
    var unit = 1f

    /** How large the design is shown (dp per design unit). */
    var scale by mutableFloatStateOf(1f)

    var guides by mutableStateOf(emptyList<CanvasGuide>())
    var marquee by mutableStateOf<CanvasRect?>(null)
    var readout by mutableStateOf<Readout?>(null)
    var dragging by mutableStateOf(false)
    var said by mutableStateOf("")
    var hovered by mutableStateOf<String?>(null)
    var fitted by mutableStateOf<Float?>(null)
    var focused by mutableStateOf<String?>(null)
    val shapes = mutableStateMapOf<String, Shape>()

    /** How far in from each item's edges its content sits (its border): its handles sit there, as CSS places them in the padding box. */
    val insets = mutableStateMapOf<String, CanvasRect>()
    val focus = mutableMapOf<String, FocusRequester>()
    val labels = mutableMapOf<String, String>()
    val coords = mutableMapOf<String, LayoutCoordinates>()

    /** Focusing an item from a press, which (unlike Tab) doesn't select it. */
    var focusing = false

    /** Puts the drag under way back, as Escape does. */
    var cancel: (() -> Unit)? = null

    fun item(id: String) = items.firstOrNull { it.id == id }
    fun rectOf(id: String) = item(id)?.rect
    fun lockedOf(id: String) = item(id)?.locked == true

    private fun snapping(moving: Set<String>) = SnapOptions(items.filter { it.id !in moving }.map { it.rect }, threshold, grid)

    private fun select(ids: List<String>) {
        if (ids != selected) onSelectedChange?.invoke(ids)
    }

    private fun apply(rects: Map<String, CanvasRect>) = items.map { i -> rects[i.id]?.let(i::at) ?: i }

    private fun moveGroup(starts: List<T>, dx: Double, dy: Double, opts: SnapOptions = SnapOptions()): Group {
        val box = boundsOf(starts.map { it.rect })
        val moved = moveRect(box, dx, dy, bounds, opts)
        val (ox, oy) = moved.rect.x - box.x to moved.rect.y - box.y
        return Group(starts.associate { it.id to it.rect.copy(x = it.rect.x + ox, y = it.rect.y + oy) }, moved.rect, moved.guides)
    }

    private fun tell(who: String, before: CanvasRect, after: CanvasRect) {
        if (after.w != before.w || after.h != before.h) said = messages.resized(who, after.w.roundToInt(), after.h.roundToInt())
        else if (after.x != before.x || after.y != before.y) said = messages.moved(who, after.x.roundToInt(), after.y.roundToInt())
    }

    private fun nameOf(starts: List<T>, id: String, label: String) =
        if (starts.size == 1 && starts[0].id == id) label else "${starts.size} items"

    private fun additive(m: PointerKeyboardModifiers) = m.isShiftPressed || m.isMetaPressed || m.isCtrlPressed

    /** A press on `id` (on its `handle`, resizing), dragged until let go; `at` is where the pointer is, on the screen. */
    suspend fun AwaitPointerEventScope.grab(id: String, down: PointerInputChange, at: (PointerInputChange) -> Offset, handle: CanvasHandle? = null) {
        val item = item(id) ?: return
        // A locked item is left to the surface underneath: a press there draws a box or deselects.
        if (item.locked && handle == null) return
        down.consume()
        val label = labels[id].orEmpty()
        val sel = when {
            handle != null -> listOf(id)
            additive(currentEvent.keyboardModifiers) -> if (id in selected) selected - id else selected + id
            id in selected -> selected
            else -> listOf(id)
        }
        select(sel)
        // Focus too, so the arrow keys work next; not a keyboard selection, so focusing doesn't select.
        focusing = true
        focus[id]?.requestFocus()
        focusing = false
        if (id !in sel) return
        val starts = if (handle != null) listOf(item) else sel.mapNotNull(::item).filter { !it.locked }
        if (starts.isEmpty()) return

        val moving = starts.map { it.id }.toSet()
        val before = items
        val startBox = boundsOf(starts.map { it.rect })
        val who = nameOf(starts, id, label)
        val from = at(down)
        var started = false
        var next = items
        var end = startBox
        var done = false

        fun finish(made: Boolean) {
            if (done) return
            done = true
            cancel = null
            guides = emptyList()
            readout = null
            dragging = false
            if (!started) return
            if (made) {
                onItemsChangeEnd?.invoke(next, before)
                tell(who, startBox, end)
            } else {
                onItemsChange(before)
                said = messages.putBack(who)
            }
        }
        cancel = { finish(false) }
        try {
            while (true) {
                val e = awaitPointerEvent()
                val p = e.changes.firstOrNull { it.id == down.id } ?: break
                if (done) {
                    p.consume()
                    if (!p.pressed) break
                    continue
                }
                if (!p.pressed) {
                    p.consume()
                    finish(true)
                    break
                }
                val s = at(p) - from
                if (!started) {
                    if (hypot(s.x, s.y) < SLOP) continue
                    started = true
                    dragging = true
                }
                p.consume()
                val (dx, dy) = s.x.toDouble() / unit to s.y.toDouble() / unit
                val step = if (handle != null) {
                    val r = resizeRect(item.rect, handle, dx, dy, bounds, snapping(moving), keepRatio = e.keyboardModifiers.isShiftPressed)
                    Group(mapOf(id to r.rect), r.rect, r.guides)
                } else moveGroup(starts, dx, dy, snapping(moving))
                end = step.box
                next = apply(step.rects)
                onItemsChange(next)
                guides = step.guides
                readout = Readout(step.box, if (handle != null) "${step.box.w.roundToInt()} × ${step.box.h.roundToInt()}" else "${step.box.x.roundToInt()}, ${step.box.y.roundToInt()}")
            }
        } finally {
            // Cancelled (the gesture taken away): put back.
            finish(false)
        }
    }

    /** A press on empty space: a box that selects what it touches, or, without dragging, deselects. */
    suspend fun AwaitPointerEventScope.sweep(down: PointerInputChange, touchSlop: Float) {
        fun at(p: Offset) = Offset(
            min(bounds.width, max(0.0, p.x.toDouble() / unit)).toFloat(),
            min(bounds.height, max(0.0, p.y.toDouble() / unit)).toFloat(),
        )
        val base = if (additive(currentEvent.keyboardModifiers)) selected else emptyList()
        val from = at(down.position)
        // On touch the page takes a drag from the surface to scroll: no box, and nothing deselected.
        val touch = down.type == PointerType.Touch
        var started = false
        var last = selected
        try {
            while (true) {
                val e = awaitPointerEvent()
                val p = e.changes.firstOrNull { it.id == down.id } ?: return
                val moved = (p.position - down.position).getDistance()
                if (!p.pressed) {
                    if (started) said = messages.selected(last.size)
                    else if (base.isEmpty()) select(emptyList())
                    return
                }
                if (touch) {
                    if (moved > touchSlop) return
                    continue
                }
                if (!started && moved < SLOP) continue
                started = true
                p.consume()
                val to = at(p.position)
                val area = CanvasRect(
                    min(from.x, to.x).toDouble(), min(from.y, to.y).toDouble(),
                    abs(to.x - from.x).toDouble(), abs(to.y - from.y).toDouble(),
                )
                marquee = area
                val hits = items.filter { !it.locked && intersects(it.rect, area) }.map { it.id }
                val ids = base + hits.filter { it !in base }
                if (ids != last) {
                    last = ids
                    onSelectedChange?.invoke(ids)
                }
            }
        } finally {
            marquee = null
        }
    }

    /** A key pressed on `id` itself (not a field in it); whether it was one of the canvas's. */
    fun key(id: String, key: Key, shift: Boolean, alt: Boolean, command: Boolean): Boolean {
        val item = item(id) ?: return false
        if (key == Key.Escape) {
            if (selected.isEmpty()) return false
            select(emptyList())
            return true
        }
        if (command && key == Key.A) {
            val all = items.filter { !it.locked }.map { it.id }
            select(all)
            said = messages.selected(all.size)
            return true
        }
        val arrow = when (key) {
            Key.DirectionLeft -> -1 to 0
            Key.DirectionRight -> 1 to 0
            Key.DirectionUp -> 0 to -1
            Key.DirectionDown -> 0 to 1
            else -> return false
        }
        val step = if (shift) 10.0 else 1.0
        val (dx, dy) = arrow.first * step to arrow.second * step
        val group = (if (id in selected) selected else listOf(id)).mapNotNull(::item).filter { !it.locked }
        val starts = if (alt) group.filter { it.id == id } else group
        if (starts.isEmpty()) return true
        val rects = if (alt) mapOf(id to resizeRect(item.rect, CanvasHandle.SE, dx, dy, bounds).rect) else moveGroup(starts, dx, dy).rects
        if (rects.all { (rid, r) -> r == item(rid)?.rect }) return true
        val before = items
        val next = apply(rects)
        onItemsChange(next)
        onItemsChangeEnd?.invoke(next, before)
        tell(nameOf(starts, id, labels[id].orEmpty()), boundsOf(starts.map { it.rect }), boundsOf(rects.values.toList()))
        return true
    }

    fun focusedOn(id: String) {
        if (!focusing && id !in selected) select(listOf(id))
    }
}

/**
 * A fixed-size surface where items sit anywhere, such as the cards of a stream overlay or a
 * slide. Drag an item to move it, and the handles of the selected one to resize it (Shift keeps
 * its shape); Escape mid-drag puts it back. Shift- or Cmd-click, or drag a box on empty space, to
 * select several and move them together. From the keyboard, Tab reaches each item, the arrow keys
 * move the selection (Shift by 10), Alt and the arrow keys resize, Cmd or Ctrl+A selects all, and
 * Escape deselects; each change is announced.
 *
 * `width` and `height` are the design's size (dp at scale 1). Items stay on the surface; with
 * `snap` they line up with its edges and centre and with each other (within `snapWithin` on the
 * screen), and with `grid` they keep to a grid. `scale` shows the design larger or smaller, or
 * `fit` fills the width it's given. `onItemsChange` gets the items with every step of a change;
 * `onItemsChangeEnd`, once it's made, with the items before it, for undo or saving. `content`
 * draws a CanvasItem for each item, keyed by its id (`key(item.id) { CanvasItem(…) }`, so one
 * that goes takes its focus with it); later ones sit on top. `surface` false drops its faint fill
 * and edge.
 */
@Composable
fun <T : CanvasPlaced<T>> Canvas(
    width: Int,
    height: Int,
    items: List<T>,
    onItemsChange: (List<T>) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    scale: Float = 1f,
    fit: Boolean = false,
    onItemsChangeEnd: ((items: List<T>, before: List<T>) -> Unit)? = null,
    selected: List<String> = emptyList(),
    onSelectedChange: ((List<String>) -> Unit)? = null,
    minSize: Int = 8,
    snap: Boolean = false,
    snapWithin: Dp = 6.dp,
    grid: Int? = null,
    surface: Boolean = true,
    content: @Composable CanvasScope.() -> Unit,
) {
    val state = remember { CanvasState<T>() }
    val scope = remember(state) { CanvasScope(state) }
    val density = LocalDensity.current
    val t = Zen.tokens
    state.messages = LocalMessages.current
    state.items = items
    state.onItemsChange = onItemsChange
    state.onItemsChangeEnd = onItemsChangeEnd
    state.selected = selected
    state.onSelectedChange = onSelectedChange
    state.bounds = CanvasBounds(width.toDouble(), height.toDouble(), minSize.toDouble())
    state.grid = grid?.toDouble()

    Box(modifier.semantics { if (label != null) contentDescription = label }) {
        val fitted = state.fitted
        val k = if (fit) fitted ?: 1f else scale
        state.unit = k * density.density
        state.scale = k
        state.threshold = if (snap) snapWithin.value / k.toDouble() else 0.0
        val dots = if (state.dragging && grid != null && grid * k >= 6) grid * k else 0f
        val shape = Zen.radii.lg
        Box(
            Modifier
                .then(CanvasSize(width, height, if (fit) null else k) { if (it != state.fitted) state.fitted = it })
                .then(if (surface) Modifier.box(shape, fill = SolidColor(t.tint.color(0.03f)), shadows = listOf(insetRing(t.tint.color(0.08f), 1f))) else Modifier)
                .clip(shape)
                .pointerInput(state) {
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        if (down.isConsumed) return@awaitEachGesture
                        if (down.type == PointerType.Mouse && !currentEvent.buttons.isPrimaryPressed) return@awaitEachGesture
                        with(state) { sweep(down, viewConfiguration.touchSlop) }
                    }
                },
        ) {
            // The design at its own size, shown `k` times as large.
            Box(
                Modifier
                    .layout { m, c ->
                        val p = m.measure(Constraints.fixed(width.dp.roundToPx(), height.dp.roundToPx()))
                        layout(c.constrainWidth((width * k).dp.roundToPx()), c.constrainHeight((height * k).dp.roundToPx())) { p.place(0, 0) }
                    }
                    .graphicsLayer {
                        scaleX = k
                        scaleY = k
                        transformOrigin = TransformOrigin(0f, 0f)
                        // Unseen until it knows how large to show the design.
                        alpha = if (fit && fitted == null) 0f else 1f
                    },
            ) {
                scope.content()
                Decorations(state, k)
            }
            // Over it, at the screen's size: the grid while dragging, the lines it snaps to, the box being drawn, and the readout.
            if (dots > 0f) {
                val dot = t.tint.color(0.22f)
                Box(
                    Modifier.matchParentSize().drawBehind {
                        val step = dots * density.density
                        val r = 1.5f * density.density
                        var x = 0f
                        while (x <= size.width + r) {
                            var y = 0f
                            while (y <= size.height + r) {
                                val c = Offset(x, y)
                                drawCircle(Brush.radialGradient(0f to dot, (1f / 1.5f) to dot, 1f to dot.copy(alpha = 0f), center = c, radius = r), r, c)
                                y += step
                            }
                            x += step
                        }
                    },
                )
            }
            for (g in state.guides) key(g) {
                val guide = Modifier.box(RectangleShape, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(blur = 6f, color = t.glow.color(0.8f))))
                if (g.axis == CanvasAxis.X) Box(Modifier.absoluteOffset { IntOffset((g.at * state.unit).roundToInt(), 0) }.width(1.dp).fillMaxHeight().then(guide))
                else Box(Modifier.absoluteOffset { IntOffset(0, (g.at * state.unit).roundToInt()) }.height(1.dp).fillMaxWidth().then(guide))
            }
            state.marquee?.let { m ->
                Box(
                    Modifier
                        .absoluteOffset((m.x * k).dp, (m.y * k).dp)
                        .size((m.w * k).dp, (m.h * k).dp)
                        .box(Zen.radii.sm, fill = SolidColor(t.primary.color(0.1f)), border = SolidColor(t.primary.color(0.6f))),
                )
            }
            state.readout?.let { r ->
                // Below the box, or above it near the bottom; kept inside the surface.
                val left = min(width * k - 28, max(28f, ((r.box.x + r.box.w / 2) * k).toFloat()))
                val bottom = ((r.box.y + r.box.h) * k).toFloat()
                val top = if (bottom + 26 > height * k) max(4f, (r.box.y * k).toFloat() - 26) else bottom + 6
                Box(
                    Modifier
                        .layout { m, c ->
                            val p = m.measure(c.copy(minWidth = 0, minHeight = 0))
                            layout(0, 0) { p.place((left.dp.toPx() - p.width / 2f).roundToInt(), top.dp.roundToPx()) }
                        }
                        .box(Zen.radii.md, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(y = 4f, blur = 14f, spread = -4f, color = t.glow.color(0.7f))))
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                ) {
                    Text(
                        r.text,
                        color = t.primaryForeground.color(),
                        style = TextStyles.xs.merge(TextStyle(fontSize = 11.sp)).merge(TextStyles.medium).merge(TextStyles.tabular),
                        softWrap = false,
                    )
                }
            }
        }
        // Says what happens, for screen readers.
        Box(Modifier.size(0.dp).semantics { liveRegion = LiveRegionMode.Assertive; contentDescription = state.said })
    }
}

/** The lone selection's handles, over every item and outside each one's clip, at its padding box. */
@Composable
private fun <T : CanvasPlaced<T>> Decorations(state: CanvasState<T>, k: Float) {
    val alone = state.selected.singleOrNull()?.let(state::item)?.takeIf { !it.locked } ?: return
    val r = alone.rect
    val inset = state.insets[alone.id]
    val inner = if (inset == null) r else CanvasRect(r.x + inset.x, r.y + inset.y, r.w - inset.x - inset.w, r.h - inset.y - inset.h)
    for (h in CanvasHandle.entries) key(h) { Handle(state, alone.id, inner, h, k) }
}

@Composable
private fun <T : CanvasPlaced<T>> Handle(state: CanvasState<T>, id: String, r: CanvasRect, h: CanvasHandle, k: Float) {
    val t = Zen.tokens
    // A bigger target than the dot shows, bigger still for fingers.
    val reach = (if (coarsePointer) 14f else 6f) / k
    val dot = 10f / k
    val cx = r.x + when { h.west -> 0.0; h.east -> r.w; else -> r.w / 2 }
    val cy = r.y + when { h.north -> 0.0; h.south -> r.h; else -> r.h / 2 }
    var coords by remember { mutableStateOf<LayoutCoordinates?>(null) }
    val cursor = when (h) {
        CanvasHandle.NW, CanvasHandle.SE -> CssCursor.NwseResize
        CanvasHandle.NE, CanvasHandle.SW -> CssCursor.NeswResize
        CanvasHandle.N, CanvasHandle.S -> CssCursor.NsResize
        CanvasHandle.E, CanvasHandle.W -> CssCursor.EwResize
    }
    Box(
        Modifier
            .absoluteOffset((cx - dot / 2 - reach).dp, (cy - dot / 2 - reach).dp)
            .size((dot + 2 * reach).dp)
            .onGloballyPositioned { coords = it }
            .pointerHoverIcon(cssCursor(cursor))
            .pointerInput(id, h) {
                awaitEachGesture {
                    val down = awaitFirstDown()
                    if (down.type == PointerType.Mouse && !currentEvent.buttons.isPrimaryPressed) return@awaitEachGesture
                    val c = coords ?: return@awaitEachGesture
                    // The handle moves with the box: the pointer's place on the screen, then.
                    with(state) { grab(id, down, { c.localToRoot(it.position) }, h) }
                }
            },
    ) {
        Box(
            Modifier
                .absoluteOffset(reach.dp, reach.dp)
                .size(dot.dp)
                .box(CircleShape, fill = SolidColor(t.foreground.color()), border = SolidColor(t.primary.color()), sides = (2f / k).dp.let { dev.rinzai.zen.Sides(it, it, it, it) }, shadows = listOf(Shadow(blur = 8f, color = t.glow.color(0.6f)))),
        )
    }
}

/**
 * One item on a Canvas, placed where the canvas's items say for its `id`; later items sit on top of
 * earlier ones. `label` names it ("Title") in what's announced. Its content is yours: fields and
 * buttons in it work as usual, and pressing them doesn't drag it. `shape` is the shape its
 * outlines follow (give its look in `modifier`); a key handler in `modifier` hears the keys pressed
 * on the item or in it (Delete, say), after the canvas has had its own.
 */
@Composable
fun CanvasScope.CanvasItem(
    id: String,
    label: String,
    modifier: Modifier = Modifier,
    shape: Shape = RectangleShape,
    content: @Composable BoxScope.() -> Unit,
) {
    val s = state
    val t = Zen.tokens
    val r = s.rectOf(id) ?: return
    val locked = s.lockedOf(id)
    val m = LocalMessages.current
    val requester = remember { FocusRequester() }
    val density = LocalDensity.current
    var coords by remember { mutableStateOf<LayoutCoordinates?>(null) }
    var inner by remember { mutableStateOf<LayoutCoordinates?>(null) }
    fun measureInset() {
        val (o, i) = (coords ?: return) to (inner ?: return)
        if (!o.isAttached || !i.isAttached) return
        val at = o.localPositionOf(i, Offset.Zero)
        val d = density.density
        val inset = CanvasRect(
            (at.x / d).toDouble(), (at.y / d).toDouble(),
            ((o.size.width - i.size.width - at.x) / d).toDouble(), ((o.size.height - i.size.height - at.y) / d).toDouble(),
        )
        if (s.insets[id] != inset) s.insets[id] = inset
    }
    s.labels[id] = label
    s.focus[id] = requester
    if (s.shapes[id] != shape) s.shapes[id] = shape
    DisposableEffect(id) {
        onDispose {
            s.focus -= id
            s.labels -= id
            s.shapes -= id
            s.insets -= id
            if (s.hovered == id) s.hovered = null
        }
    }
    Box(
        Modifier
            .absoluteOffset(r.x.dp, r.y.dp)
            .size(r.w.dp, r.h.dp)
            .onGloballyPositioned { coords = it; measureInset() }
            // Its outline is painted with it, as a positioned element's is: a later item covers it, its own clip doesn't.
            .then(
                when {
                    id in s.selected -> Modifier.outline(shape, t.primary.color(0.8f), (2f / s.scale).dp, (1f / s.scale).dp)
                    s.focused == id && Zen.page.keyboard -> Modifier.outline(shape, t.ring.color(0.7f), (2f / s.scale).dp, (1f / s.scale).dp)
                    s.hovered == id -> Modifier.outline(shape, t.tint.color(0.35f), (1f / s.scale).dp, (1f / s.scale).dp)
                    else -> Modifier
                },
            )
            .pointerHoverIcon(if (locked) PointerIcon.Default else cssCursor(CssCursor.Move))
            .pointerInput(id) {
                awaitPointerEventScope {
                    while (true) {
                        when (awaitPointerEvent().type) {
                            PointerEventType.Enter -> s.hovered = id
                            PointerEventType.Exit -> if (s.hovered == id) s.hovered = null
                        }
                    }
                }
            }
            .pointerInput(id) {
                awaitEachGesture {
                    // Fields and buttons inside take their own presses.
                    val down = awaitFirstDown(requireUnconsumed = false)
                    if (down.isConsumed) return@awaitEachGesture
                    if (down.type == PointerType.Mouse && !currentEvent.buttons.isPrimaryPressed) return@awaitEachGesture
                    val c = coords ?: return@awaitEachGesture
                    with(s) { grab(id, down, { c.localToRoot(it.position) }) }
                }
            }
            .then(modifier)
            .onPreviewKeyEvent { e ->
                val cancel = s.cancel
                if (e.type == KeyEventType.KeyDown && e.key == Key.Escape && cancel != null) {
                    cancel()
                    true
                } else false
            }
            .onKeyEvent { e ->
                e.type == KeyEventType.KeyDown && s.focused == id &&
                    s.key(id, e.key, e.isShiftPressed, e.isAltPressed, e.isMetaPressed || e.isCtrlPressed)
            }
            .focusRequester(requester)
            .onFocusChanged {
                if (it.isFocused) {
                    s.focused = id
                    s.focusedOn(id)
                } else if (s.focused == id) s.focused = null
            }
            .focusable()
            .semantics {
                contentDescription = label
                stateDescription = if (locked) "locked item" else "movable item. ${m.canvasHelp}"
            },
    ) {
        Box(Modifier.matchParentSize().onGloballyPositioned { inner = it; measureInset() })
        content()
    }
}

/**
 * The surface's size: the design's `k` times over, or (`k` null, "fit") the width it's given and as
 * tall as the design's shape makes that, telling `fitted` the scale. As CSS sizes a box with width
 * 100% and an aspect ratio, a fitted one has no width of its own to shrink to.
 */
private class CanvasSize(val width: Int, val height: Int, val k: Float?, val fitted: (Float) -> Unit) : LayoutModifier {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val (w, h) = if (k == null) {
            val w = if (constraints.hasBoundedWidth) constraints.maxWidth else constraints.minWidth
            if (constraints.hasBoundedWidth) fitted(w / width.dp.toPx())
            w to (w * height / width.toFloat()).roundToInt()
        } else (width * k).dp.roundToPx() to (height * k).dp.roundToPx()
        val p = measurable.measure(Constraints.fixed(w, h))
        return layout(w, h) { p.place(0, 0) }
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = if (k == null) 0 else (width * k).dp.roundToPx()
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = minIntrinsicWidth(measurable, height)
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) =
        if (k == null) (width * height / this@CanvasSize.width.toFloat()).roundToInt() else (height * k).dp.roundToPx()
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = minIntrinsicHeight(measurable, width)
}
