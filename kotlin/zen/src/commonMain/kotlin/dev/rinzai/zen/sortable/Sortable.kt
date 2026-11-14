package dev.rinzai.zen.sortable

import dev.rinzai.zen.activeElement
import androidx.compose.ui.input.pointer.AwaitPointerEventScope
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import dev.rinzai.zen.Messages
import dev.rinzai.zen.table.TableScroller
import dev.rinzai.zen.table.LocalTableScroller
import kotlinx.coroutines.CoroutineScope
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.LocalPinnableContainer
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import dev.rinzai.zen.scrollIntoView
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerHoverIcon
import dev.rinzai.zen.grabCursor
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.isPrimaryPressed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.ring
import dev.rinzai.zen.transition
import kotlinx.coroutines.launch


/** What a SortableList's or SortableTree's items get to drag by: its handle. */
class SortableScope internal constructor(internal val state: Sorter)

/** What a handle drives: a SortableList's order, or a SortableTree's. */
internal interface Sorter {
    val lifted: String?
    val dragging: String?

    /** A key pressed on `id`'s handle; whether it was one of the sorter's. */
    fun key(id: String, label: String, key: Key, rtl: Boolean, m: Messages, scope: CoroutineScope): Boolean

    /** A press on `id`'s handle (`handle`, where it is), dragged until let go. */
    suspend fun AwaitPointerEventScope.drag(id: String, down: PointerInputChange, handle: LayoutCoordinates, haptics: HapticFeedback, scope: CoroutineScope, scroller: TableScroller?)
}

@Stable
internal class SortableState : Sorter {
    var value: List<String> = emptyList()
    var onValueChange: (List<String>) -> Unit = {}
    override var lifted by mutableStateOf<String?>(null)
    override var dragging by mutableStateOf<String?>(null)
    var sorting by mutableStateOf(false)
    var said by mutableStateOf("")
    var before: List<String>? = null

    /** The drag under way: from which place, to which, how far the pointer has gone, and the room the dragged item takes. */
    var from by mutableIntStateOf(-1)
    var target by mutableIntStateOf(-1)
    var dy by mutableFloatStateOf(0f)
    var room = 0f

    /** While dragging, how far the item at `index` is moved out of the way (the dragged one: under the pointer). */
    fun shift(index: Int): Float = when {
        from < 0 -> 0f
        index == from -> dy
        from < index && index <= target -> -room
        target <= index && index < from -> room
        else -> 0f
    }

    /** Where each item on screen is, in the list (a virtualized list has only some). */
    val tops = mutableMapOf<String, Float>()
    val heights = mutableMapOf<String, Float>()

    /** After a reorder, where each item was on screen, to move it from there to its new place. */
    var flipFrom: Map<String, Float>? = null
    val settling = mutableMapOf<String, Animatable<Float, *>>()

    /** Where an item shows now: its place, plus a drag or a settle under way. */
    fun shown(id: String) = (tops[id] ?: 0f) + shift(value.indexOf(id)) + (settling[id]?.value ?: 0f)

    /** Settles every item from where it shows to its place after `next` (the same order, to drop back). */
    fun reorder(next: List<String>) {
        flipFrom = tops.keys.associateWith(::shown)
        from = -1
        if (next != value) onValueChange(next) else settleBack()
    }

    var settleBack: () -> Unit = {}

    /** Runs once the items are laid out after a reorder. */
    var laidOut: (() -> Unit)? = null

    /** A virtualized list's scroll, and the room each item takes in it. */
    var lazy: LazyListState? = null
    var itemRoom = 0f
    var viewport: Rect? = null

    /** How far a virtualized list is scrolled (its items all the same height). */
    fun scrolled(): Float = lazy?.let { it.firstVisibleItemIndex * itemRoom + it.firstVisibleItemScrollOffset } ?: 0f

    override fun key(id: String, label: String, key: Key, rtl: Boolean, m: Messages, scope: CoroutineScope): Boolean {
        val value = value
        val at = value.indexOf(id)
        val of = m.place(at + 1, value.size)
        val held = lifted == id
        return when {
            key == Key.Spacebar || key == Key.Enter || key == Key.NumPadEnter -> {
                if (held) {
                    lifted = null
                    before = null
                    said = m.dropped(label, of)
                } else if (lifted == null) {
                    lifted = id
                    before = value
                    said = m.pickedUp(label, of)
                }
                true
            }
            held && (key == Key.DirectionUp || key == Key.DirectionDown) -> {
                val to = at + if (key == Key.DirectionUp) -1 else 1
                if (to in value.indices) {
                    reorder(value.move(at, to))
                    // A keyboard move can take it past the edge of the view.
                    lazy?.let { list -> scope.launch { list.scrollIntoView(to) } }
                    said = m.movedTo(label, m.place(to + 1, value.size))
                }
                true
            }
            held && key == Key.Escape -> {
                val back = before ?: value
                lifted = null
                before = null
                if (back != value) reorder(back)
                said = m.putBack(label, m.place(back.indexOf(id) + 1, back.size))
                true
            }
            else -> false
        }
    }

    override suspend fun AwaitPointerEventScope.drag(
        id: String,
        down: PointerInputChange,
        handle: LayoutCoordinates,
        haptics: HapticFeedback,
        scope: CoroutineScope,
        scroller: TableScroller?,
    ) {
        val s = this@SortableState
        val value = s.value
        val from = value.indexOf(id)
        if (from < 0) return
        down.consume()
        val startY = handle.localToRoot(down.position).y
        val startScroll = s.scrolled()
        val lazy = s.lazy
        // The room the dragged item takes: its height and the gap after it. A virtualized
        // list has only some of its items, all the same height, so they're placed by place.
        val targetFor: (Float) -> Int
        if (lazy != null) {
            s.room = s.itemRoom
            targetFor = { dy -> (from + (dy / s.room).toInt()).coerceIn(0, value.size - 1) }
        } else {
            val tops = value.map { s.tops[it] ?: 0f }
            val heights = value.map { s.heights[it] ?: 0f }
            val gap = if (value.size > 1) tops[1] - (tops[0] + heights[0]) else 0f
            s.room = heights[from] + gap
            val centres = value.indices.map { tops[it] + heights[it] / 2 }
            targetFor = { dy ->
                val centre = centres[from] + dy
                var to = from
                while (to < value.size - 1 && centre > centres[to + 1]) to++
                while (to > 0 && centre < centres[to - 1]) to--
                to
            }
        }
        var y = startY
        fun place() {
            // In the window's coordinates (the handle itself moves with the item), plus what's scrolled since.
            s.dy = y - startY + s.scrolled() - startScroll
            val was = s.target
            s.target = targetFor(s.dy)
            // A light tap as it takes a new place, where phones can vibrate.
            if (s.target != was) haptics.performHapticFeedback(HapticFeedbackType.SegmentFrequentTick)
        }
        s.from = from
        s.target = from
        s.dy = 0f
        s.sorting = true
        s.dragging = id
        // Near a virtualized list's edge, it scrolls, by a third of how far in the pointer is each frame.
        val edge = lazy?.let { list ->
            scope.launch {
                val zone = 48.dp.toPx()
                while (true) {
                    withFrameNanos {}
                    val box = s.viewport ?: continue
                    val speed = when {
                        y < box.top + zone -> -(box.top + zone - y)
                        y > box.bottom - zone -> y - (box.bottom - zone)
                        else -> 0f
                    }
                    if (speed != 0f) {
                        list.scrollBy(speed / 3)
                        place()
                    }
                }
            }
        }
        try {
            while (true) {
                val e = awaitPointerEvent()
                val p = e.changes.firstOrNull { it.id == down.id } ?: break
                y = handle.localToRoot(p.position).y
                place()
                p.consume()
                if (!p.pressed) break
            }
        } finally {
            edge?.cancel()
            val target = s.target
            s.dragging = null
            s.sorting = false
            s.reorder(if (target != from) value.move(from, target) else value)
        }
    }
}

private fun <T> List<T>.move(from: Int, to: Int) = toMutableList().apply { add(to, removeAt(from)) }

/**
 * A list put in order by dragging: drag an item by its SortableHandle and the others make way (a
 * phone taps lightly at each new place); it settles into place when let go. From the keyboard,
 * Space or Enter on a handle picks the item up, the arrow keys move it, Space or Enter drops it
 * and Escape puts it back; each step is announced. `value` is the ids in order; `item` draws one,
 * `gap` apart. With `itemHeight` (every item that tall), it's a list of any length that scrolls
 * itself (give it a height) and has only the items in view: dragged near its edge, it scrolls.
 */
@Composable
fun SortableList(
    value: List<String>,
    onValueChange: (List<String>) -> Unit,
    modifier: Modifier = Modifier,
    gap: Dp = 0.dp,
    itemHeight: Dp? = null,
    label: String? = null,
    item: @Composable SortableScope.(id: String) -> Unit,
) {
    val state = remember { SortableState() }
    state.value = value
    state.onValueChange = onValueChange
    val scope = remember(state) { SortableScope(state) }
    val reduced = reducedMotion()
    val coroutines = rememberCoroutineScope()
    fun settle(was: Map<String, Float>) {
        for ((id, from) in was) {
            val by = from - (state.tops[id] ?: continue)
            val anim = state.settling.getOrPut(id) { Animatable(0f) }
            coroutines.launch {
                anim.snapTo(if (reduced) 0f else by)
                anim.animateTo(0f, tween(220, easing = Ease.OutSoft))
            }
        }
    }
    state.settleBack = {
        state.flipFrom?.let(::settle)
        state.flipFrom = null
    }
    // Once the moved items are laid out in their new places, each glides there from where it was.
    SideEffect {
        val was = state.flipFrom ?: return@SideEffect
        state.laidOut = { state.flipFrom = null; settle(was) }
    }
    val rows: @Composable (index: Int, id: String) -> Unit = { index, id -> Row(state, scope, index, id, reduced, item) }
    val named = Modifier.semantics { if (label != null) contentDescription = label }
    Box(modifier.then(named)) {
        if (itemHeight == null) {
            Column(verticalArrangement = Arrangement.spacedBy(gap)) {
                value.forEachIndexed { i, id -> key(id) { rows(i, id) } }
            }
        } else {
            val list = rememberLazyListState()
            state.lazy = list
            state.itemRoom = with(LocalDensity.current) { (itemHeight + gap).toPx() }
            LazyColumn(Modifier.matchParentSize().onGloballyPositioned { state.viewport = it.boundsInRoot() }, list, verticalArrangement = Arrangement.spacedBy(gap)) {
                itemsIndexed(value, key = { _, id -> id }) { i, id ->
                    Box(Modifier.height(itemHeight)) { rows(i, id) }
                }
            }
        }
        // Says what happens, for screen readers.
        Box(Modifier.size(0.dp).semantics { liveRegion = LiveRegionMode.Assertive; contentDescription = state.said })
    }
}

@Composable
private fun Row(
    s: SortableState,
    scope: SortableScope,
    index: Int,
    id: String,
    reduced: Boolean,
    item: @Composable SortableScope.(id: String) -> Unit,
) {
    val dragging = s.dragging == id
    val lifted = s.lifted == id
    val t = Zen.tokens
    val look by animateFloatAsState(if (dragging) 1f else 0f, transition(200))
    val raised = dragging || lifted
    val bg by animateColorAsState(if (raised) t.card.color() else t.card.color(0f), transition(200))
    val shift by animateFloatAsState(
        s.shift(index),
        // The others glide out of its way; the dragged one follows the pointer.
        if (dragging || !s.sorting || reduced) tween(0) else transition(200, Ease.OutSoft),
    )
    // Scrolled out of a virtualized list's view while it's held, it stays: its drag goes on.
    val pinnable = LocalPinnableContainer.current
    DisposableEffect(raised, pinnable) {
        val pin = if (raised) pinnable?.pin() else null
        onDispose { pin?.release() }
    }
    DisposableEffect(id) { onDispose { s.tops -= id; s.heights -= id } }
    Box(
        Modifier
            .zIndex(if (raised) 10f else 0f)
            .onPlaced { c ->
                // A virtualized list's item is placed in its own slot: its top is its place.
                s.tops[id] = if (s.lazy != null) index * s.itemRoom else c.positionInParent().y
                s.heights[id] = c.size.height.toFloat()
            }
            // After every item is placed: the first to report starts the glide.
            .onGloballyPositioned {
                if (s.flipFrom != null) {
                    val done = s.laidOut
                    s.laidOut = null
                    done?.invoke()
                }
            }
            .graphicsLayer {
                translationY = (if (dragging) s.shift(index) else shift) + (s.settling[id]?.value ?: 0f)
                val k = 1f + 0.02f * look
                scaleX = k
                scaleY = k
            }
            .box(
                Zen.radii.xl,
                fill = SolidColor(bg),
                shadows = when {
                    lifted -> listOf(ring(t.primary.color(0.6f), 2f))
                    look > 0f -> listOf(
                        ring(t.tint.color(0.08f * look), 1f),
                        Shadow(y = 12f, blur = 32f, spread = -12f, color = Color.Black.copy(alpha = 0.6f * look)),
                    )
                    else -> emptyList()
                },
            ),
    ) { scope.item(id) }
}

/**
 * What an item is dragged by: a grip button. `label` names the item ("Rent"); the button reads
 * "Reorder Rent".
 */
@Composable
fun SortableScope.SortableHandle(id: String, label: String, modifier: Modifier = Modifier) {
    val m = LocalMessages.current
    val t = Zen.tokens
    val haptics = LocalHapticFeedback.current
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    val keyboard = Zen.page.keyboard
    var coords by remember { mutableStateOf<LayoutCoordinates?>(null) }
    val s = state
    val coroutines = rememberCoroutineScope()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val scroller = LocalTableScroller.current
    val lifted = s.lifted == id
    Box(
        modifier
            .size(32.dp)
            .onGloballyPositioned { coords = it }
            .box(Zen.radii.md, shadows = focusRing(focused && keyboard))
            .clip(Zen.radii.md)
            .hoverable(source)
            .pointerHoverIcon(grabCursor(s.dragging == id))
            .activeElement()
            .focusable(interactionSource = source)
            .semantics {
                role = Role.Button
                contentDescription = m.reorder(label)
                stateDescription = if (lifted) "Pressed" else "Not pressed"
            }
            .onKeyEvent { e -> e.type == KeyEventType.KeyDown && s.key(id, label, e.key, rtl, m, coroutines) }
            .pointerInput(id) {
                awaitEachGesture {
                    val down = awaitFirstDown()
                    if (down.type == PointerType.Mouse && !currentEvent.buttons.isPrimaryPressed) return@awaitEachGesture
                    if (s.lifted != null) return@awaitEachGesture
                    val c = coords ?: return@awaitEachGesture
                    with(s) { drag(id, down, c, haptics, coroutines, scroller) }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        val grip = if (hovered) t.foreground.color() else t.mutedForeground.color()
        Canvas(Modifier.size(16.dp)) {
            val u = size.width / 16f
            for (cy in listOf(4f, 8f, 12f)) for (cx in listOf(5.5f, 10.5f)) drawCircle(grip, 1.25f * u, Offset(cx * u, cy * u))
        }
    }
}
