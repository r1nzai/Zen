package dev.rinzai.zen.sortable

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.pointer.AwaitPointerEventScope
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Fixed
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Messages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.ring
import dev.rinzai.zen.table.LocalMovingRow
import dev.rinzai.zen.table.MovingRow
import dev.rinzai.zen.table.TableScroller
import dev.rinzai.zen.table.inTable
import dev.rinzai.zen.transition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** One SortableItem of a tree: where it is (as laid out, before any drag), and how far it's moved. */
@Stable
internal class TreeItem(val id: String, private val tree: TreeState) : MovingRow {
    var label: String? = null
    var top = 0f
    var height = 0f
    var laidOut = false
    var drag by mutableFloatStateOf(0f)
    var settle by mutableFloatStateOf(0f)
    var gliding: Job? = null

    /** Its top before the tree changed, to glide from to where it is after. */
    var was: Float? = null

    override val offset get() = drag + settle
    override val moving get() = tree.dragging == id || id in tree.carried
    override val lifted get() = tree.lifted == id
    override val lit get() = tree.target == id

    override fun placed(top: Float, height: Float) {
        this.height = height
        laidOut = true
        val before = was
        this.top = top
        if (before != null) {
            was = null
            settle += before - top
            tree.glide(this)
        }
    }
}

/** Where the drop line goes, in the window. */
@Immutable
internal class DropLine(val top: Float, val left: Float, val width: Float)

private fun same(a: TreePlace, b: TreePlace) = a == b

@Stable
internal class TreeState : Sorter {
    var value: List<SortableNode> = emptyList()
    var onValueChange: (List<SortableNode>) -> Unit = {}
    var accepts: ((String, String?) -> Boolean)? = null
    var indent = 0f
    var reduced = false
    var rtl = false
    var scope: CoroutineScope? = null
    var bounds = Rect.Zero

    override var lifted by mutableStateOf<String?>(null)
    override var dragging by mutableStateOf<String?>(null)
    var carried by mutableStateOf<Set<String>>(emptySet())
    var target by mutableStateOf<String?>(null)
    var line by mutableStateOf<DropLine?>(null)
    var said by mutableStateOf("")
    var before: List<SortableNode>? = null
    val items = mutableMapOf<String, TreeItem>()

    fun item(id: String) = items.getOrPut(id) { TreeItem(id, this) }

    fun glide(item: TreeItem) {
        item.gliding?.cancel()
        if (reduced) { item.settle = 0f; return }
        item.gliding = scope?.launch { animate(item.settle, 0f, animationSpec = tween(220, easing = Ease.OutSoft)) { v, _ -> item.settle = v } }
    }

    /** The rows shown, in order. */
    private fun shown() = items.values.filter { it.laidOut }.sortedBy { it.top }.map { it.id }

    /** A new tree: every item glides from where it shows now to its new place. */
    fun change(next: List<SortableNode>) {
        for (i in items.values) {
            i.settle = i.offset
            i.drag = 0f
            i.was = i.top
            glide(i)
        }
        onValueChange(next)
    }

    private fun nameOf(id: String) = items[id]?.label

    fun placeText(tree: List<SortableNode>, id: String, m: Messages): String {
        val at = indexTree(tree).getValue(id)
        val siblings = if (at.parentId == null) tree else childrenOf(tree, at.parentId) ?: emptyList()
        val group = at.parentId?.let(::nameOf)
        return if (group != null) m.placeIn(at.index + 1, siblings.size, group) else m.place(at.index + 1, siblings.size)
    }

    private class Plan(
        val carried: List<String>,
        val rows: List<String>,
        val tree: List<SortableNode>,
        val node: SortableNode,
        val slots: List<TreeSlot>,
        val depth: Int,
        val place: TreePlace,
    )

    /** Where `id` can go: the tree without it, the rows still shown, and every allowed place among them. */
    private fun plan(id: String): Plan? {
        val rows = shown()
        val info = indexTree(value)
        val from = rows.indexOf(id)
        val at = info[id] ?: return null
        if (from < 0) return null
        // It carries the rows shown under it.
        var end = from + 1
        while (end < rows.size && (info[rows[end]]?.depth ?: 0) > at.depth) end++
        val rest = rows.subList(0, from) + rows.subList(end, rows.size)
        val (tree, node) = removeNode(value, id)
        val slots = treeSlots(tree, rest) { parent -> accepts?.invoke(id, parent) ?: true }
        return Plan(rows.subList(from, end), rest, tree, node ?: return null, slots, at.depth, TreePlace(at.parentId, at.index))
    }

    override fun key(id: String, label: String, key: Key, rtl: Boolean, m: Messages, scope: CoroutineScope): Boolean {
        if (key == Key.Spacebar || key == Key.Enter || key == Key.NumPadEnter) {
            if (lifted == id) {
                lifted = null
                before = null
                said = m.dropped(label, placeText(value, id, m))
            } else if (lifted == null) {
                lifted = id
                before = value
                said = m.pickedUp(label, placeText(value, id, m))
            }
            return true
        }
        if (lifted != id) return false
        if (key == Key.Escape) {
            val back = before ?: value
            lifted = null
            before = null
            if (back != value) change(back)
            said = m.putBack(label, placeText(back, id, m))
            return true
        }
        // In reading order: ← is a level in, in a right-to-left tree.
        val arrow = when (key) {
            Key.DirectionLeft -> if (rtl) Key.DirectionRight else Key.DirectionLeft
            Key.DirectionRight -> if (rtl) Key.DirectionLeft else Key.DirectionRight
            Key.DirectionUp, Key.DirectionDown -> key
            else -> return false
        }
        val p = plan(id) ?: return true
        val here = p.slots.firstOrNull { same(it.place, p.place) } ?: return true
        val to = if (arrow == Key.DirectionLeft || arrow == Key.DirectionRight) {
            val depth = here.depth + if (arrow == Key.DirectionRight) 1 else -1
            p.slots.firstOrNull { it.gap == here.gap && it.depth == depth }
        } else {
            // The nearest gap that way with a place in it, as near this depth as it allows.
            val gaps = p.slots.map { it.gap }.distinct()
            val gap = if (arrow == Key.DirectionUp) gaps.lastOrNull { it < here.gap } else gaps.firstOrNull { it > here.gap }
            gap?.let { nearestSlot(p.slots, it, here.depth) }
        } ?: return true
        val next = insertNode(p.tree, to.place, p.node)
        change(next)
        said = m.movedTo(label, placeText(next, id, m))
        return true
    }

    override suspend fun AwaitPointerEventScope.drag(
        id: String,
        down: PointerInputChange,
        handle: LayoutCoordinates,
        haptics: HapticFeedback,
        scope: CoroutineScope,
        scroller: TableScroller?,
    ) {
        val s = this@TreeState
        val p = s.plan(id) ?: return
        down.consume()
        val start = handle.localToRoot(down.position)
        val scrolled0 = scroller?.state?.value ?: 0
        val rects = p.rows.map { s.items.getValue(it).let { i -> i.top to i.top + i.height } }
        val centres = rects.map { (top, bottom) -> (top + bottom) / 2 }
        // Across the part of the tree in view (a table scrolled sideways shows only some).
        val clip = scroller?.bounds?.let { b -> Rect(maxOf(b.left, s.bounds.left), 0f, minOf(b.right, s.bounds.right), 0f) } ?: s.bounds
        val carried = p.carried.map(s.items::getValue)
        var x = start.x
        var y = start.y
        var target: TreeSlot? = null
        val inset = 8.dp.toPx()
        fun place() {
            val scrolled = (scroller?.state?.value ?: 0) - scrolled0
            val dy = y - start.y + scrolled
            for (c in carried) c.drag = dy
            val pointer = y + scrolled
            val gap = centres.count { it < pointer }
            val wanted = p.depth + (((x - start.x) * if (s.rtl) -1 else 1) / s.indent).roundToInt()
            val was = target
            target = nearestSlot(p.slots, gap, wanted)
            if (target != was && (target?.gap != was?.gap || target?.depth != was?.depth)) haptics.performHapticFeedback(HapticFeedbackType.SegmentFrequentTick)
            s.target = target?.parentId?.takeIf { it in p.rows }
            val t = target ?: return run { s.line = null }
            // The line: between the rows, set in as deep as it'll go.
            val edge = if (t.gap < rects.size) rects[t.gap].first else rects.lastOrNull()?.second ?: 0f
            val by = t.depth * s.indent + inset
            s.line = DropLine(edge - scrolled - 1f, if (s.rtl) clip.left + inset else clip.left + by, maxOf(0f, clip.right - clip.left - by - inset))
        }
        s.dragging = id
        s.carried = p.carried.toSet()
        // Near the edge of the table it's in, it scrolls, by a third of how far in the pointer is each frame.
        val edge = scroller?.let { sc ->
            scope.launch {
                val zone = 48.dp.toPx()
                while (true) {
                    withFrameNanos {}
                    val box = sc.bounds
                    val speed = when {
                        y < box.top + zone -> -(box.top + zone - y)
                        y > box.bottom - zone -> y - (box.bottom - zone)
                        else -> 0f
                    }
                    if (speed != 0f) {
                        sc.state.scrollBy(speed / 3)
                        place()
                    }
                }
            }
        }
        var released = false
        try {
            while (true) {
                val e = awaitPointerEvent()
                val c = e.changes.firstOrNull { it.id == down.id } ?: break
                handle.localToRoot(c.position).let { x = it.x; y = it.y }
                place()
                c.consume()
                if (!c.pressed) { released = true; break }
            }
        } finally {
            edge?.cancel()
            s.line = null
            s.target = null
            s.dragging = null
            s.carried = emptySet()
            val t = target
            if (released && t != null && !same(t.place, p.place)) s.change(insertNode(p.tree, t.place, p.node))
            else for (c in carried) {
                c.settle = c.offset
                c.drag = 0f
                s.glide(c)
            }
        }
    }
}

private val LocalTree = androidx.compose.runtime.compositionLocalOf<TreeState?> { null }

/**
 * Items in groups, and groups in groups, put in order by dragging: an item can go anywhere in its
 * group, into another group (or one open inside it), or under another item. While dragging, a
 * glowing line shows where it will land, set in as deep as it'll go, and the group it would join
 * is lit; drag sideways to go a level in or out. From the keyboard, Space or Enter on a handle
 * picks it up, the up and down arrows move it through every place it can go, left and right a
 * level out or in, Space or Enter drops it and Escape puts it back; each step is announced.
 *
 * `value` is the tree of ids. In `content`, put a SortableItem for each row shown, in order and
 * each in a `key(id)` (flattenTree lists them, with their depths): what's under a closed one isn't
 * shown, and moves with it. `accepts` says which group takes which item. They're a column, `gap`
 * apart; or put a TableContainer in it, the TableBody's rows SortableItems.
 */
@Composable
fun SortableTree(
    value: List<SortableNode>,
    onValueChange: (List<SortableNode>) -> Unit,
    modifier: Modifier = Modifier,
    accepts: ((id: String, parentId: String?) -> Boolean)? = null,
    /** How far in a level is set: the drop line is set in this far, and dragging this far sideways goes a level in or out. */
    indent: Dp = 24.dp,
    gap: Dp = 0.dp,
    label: String? = null,
    content: @Composable SortableScope.() -> Unit,
) {
    val tree = remember { TreeState() }
    tree.value = value
    tree.onValueChange = onValueChange
    tree.accepts = accepts
    tree.indent = with(LocalDensity.current) { indent.toPx() }
    tree.reduced = reducedMotion()
    tree.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    tree.scope = rememberCoroutineScope()
    val scope = remember(tree) { SortableScope(tree) }
    Column(
        modifier
            .onGloballyPositioned { tree.bounds = it.boundsInRoot() }
            .semantics { if (label != null) contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(gap),
    ) {
        CompositionLocalProvider(LocalTree provides tree) { scope.content() }
        Box(Modifier.size(0.dp).semantics { liveRegion = LiveRegionMode.Assertive; contentDescription = tree.said })
    }
    tree.line?.let { DropLineOf(it) }
}

/**
 * One item in a SortableTree; give it the `id` it has in the tree's value. `label` names one with
 * no SortableHandle (a group others go into), to say "2 of 3 in Food". In a table, put the TableRow
 * inside it: the row is the item.
 */
@Composable
fun SortableScope.SortableItem(id: String, modifier: Modifier = Modifier, label: String? = null, content: @Composable () -> Unit) {
    val tree = LocalTree.current ?: error("SortableItem must be inside SortableTree")
    val item = tree.item(id)
    if (label != null) item.label = label
    DisposableEffect(id) { onDispose { tree.items.remove(id) } }
    if (inTable()) {
        CompositionLocalProvider(LocalMovingRow provides item, content = content)
        return
    }
    val t = Zen.tokens
    val dragging = tree.dragging == id
    val lifted = item.lifted
    val raised = dragging || lifted
    val look by animateFloatAsState(if (dragging) 1f else 0f, transition(200))
    val bg by animateColorAsState(
        when {
            raised || id in tree.carried -> t.card.color()
            item.lit -> t.primary.color(0.07f)
            else -> t.card.color(0f)
        },
        transition(200),
    )
    Box(
        modifier
            .zIndex(if (item.moving || lifted) 10f else 0f)
            .onGloballyPositioned { item.placed(it.positionInRoot().y, it.size.height.toFloat()) }
            .graphicsLayer {
                translationY = item.offset
                val k = 1f + 0.02f * look
                scaleX = k
                scaleY = k
            }
            .box(
                if (raised) Zen.radii.xl else androidx.compose.ui.graphics.RectangleShape,
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
    ) { content() }
}

/** The glowing line where a dragged item would land, with a ring at its start. */
@Composable
private fun DropLineOf(line: DropLine) {
    val t = Zen.tokens
    val spec = transition<Float>(100)
    val top = remember { Animatable(line.top) }
    val left = remember { Animatable(line.left) }
    val width = remember { Animatable(line.width) }
    LaunchedEffect(line) {
        launch { top.animateTo(line.top, spec) }
        launch { left.animateTo(line.left, spec) }
        launch { width.animateTo(line.width, spec) }
    }
    Fixed {
        var origin by remember { mutableStateOf(Offset.Zero) }
        Box(Modifier.fillMaxSize().onGloballyPositioned { origin = it.positionInRoot() }) {
            val density = LocalDensity.current
            Box(
                Modifier
                    .absoluteOffset { IntOffset((left.value - origin.x).roundToInt(), (top.value - origin.y).roundToInt()) }
                    .width(with(density) { width.value.toDp() })
                    .height(2.dp)
                    .box(CircleShape, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(blur = 10f, color = t.glow.color(0.9f * t.glowK)))),
            ) {
                Box(
                    Modifier
                        .align(Alignment.CenterStart)
                        .offset(x = (-4).dp)
                        .requiredSize(8.dp)
                        .box(CircleShape, fill = SolidColor(t.background.color()), shadows = listOf(Shadow(spread = 2f, color = t.primary.color(), inset = true))),
                )
            }
        }
    }
}
