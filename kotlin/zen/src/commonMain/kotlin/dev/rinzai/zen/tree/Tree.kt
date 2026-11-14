package dev.rinzai.zen.tree

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Zen
import dev.rinzai.zen.activeElement
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.table.Cell
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.transition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/** One visible row of a tree. `depth` is 0 for top-level rows; `position` is its place among its `siblings` (1-based). */
@Immutable
class TreeRowData<T> internal constructor(
    val item: T,
    val key: String,
    val depth: Int,
    val parentKey: String?,
    val hasChildren: Boolean,
    val expanded: Boolean,
    val position: Int,
    val siblings: Int,
    /** Under the row opening: it grows in. */
    internal val entering: Boolean,
    /** Under the row closing: it shrinks away. */
    internal val leaving: Boolean,
) {
    /** In the group opening or closing, at any depth (the table's body leaves it be). */
    internal val animating get() = entering || leaving
}

/** The row's height as a group opens (0 to 1 of it), and how shown its content is. */
private fun grow(p: Float) = Ease.OutSoft.transform(p) to if (p < 0.6f) 0f else Ease.OutSoft.transform((p - 0.6f) / 0.4f)

private fun shrink(p: Float) = (1f - Ease.Standard.transform(p)) to if (p > 0.4f) 0f else 1f - Ease.Standard.transform(p / 0.4f)

/**
 * A tree for tables and lists, from rememberTree: turns nested items into the rows that are
 * visible (children of collapsed rows are skipped), and expands and collapses them; with the
 * Tree* parts, children grow in and shrink away smoothly. In a Table of TreeRows it's a tree
 * grid: one tab stop whose rows the keyboard moves between. Up and Down go row to row, Home and
 * End to the first and last, Right opens a row (or goes to its first child), Left closes it (or
 * goes to its parent).
 */
@Stable
class Tree<T> internal constructor(private val scope: CoroutineScope) {
    internal var items: List<T> = emptyList()
    internal var key: (T) -> String = { it.toString() }
    internal var children: (T) -> List<T>? = { null }
    internal var defaultExpanded = true
    internal var reduced = false
    internal var rowHeight: Dp = 36.dp

    /** Rows whose expanded state differs from the default. */
    private var toggled by mutableStateOf(emptySet<String>())

    /** The group just opened: its rows grow in. The group closing: its rows shrink before they go. */
    internal var opened by mutableStateOf<String?>(null)
    internal var closing by mutableStateOf<String?>(null)
    internal val openProgress = Animatable(1f)
    internal val closeProgress = Animatable(0f)
    private var openJob: Job? = null
    private var closeJob: Job? = null

    /** The row the grid's one tab stop is on: the last one focused, while it's still shown. */
    internal var current by mutableStateOf<String?>(null)
    internal val focus = mutableMapOf<String, FocusRequester>()

    fun isExpanded(key: String) = (key in toggled) != defaultExpanded

    /** The rows shown, in order. */
    val rows: List<TreeRowData<T>>
        get() {
            val out = mutableListOf<TreeRowData<T>>()
            val opened = opened
            val closing = closing
            // Every row under the one opening or closing moves with its group, its own children's too.
            fun walk(list: List<T>, depth: Int, parent: String?, entering: Boolean, leaving: Boolean) {
                list.forEachIndexed { i, item ->
                    val k = key(item)
                    val kids = children(item)
                    val has = !kids.isNullOrEmpty()
                    val expanded = has && isExpanded(k)
                    out += TreeRowData(item, k, depth, parent, has, expanded, i + 1, list.size, entering, leaving)
                    if (expanded) walk(kids!!, depth + 1, k, entering || k == opened, leaving || k == closing)
                }
            }
            walk(items, 0, null, entering = false, leaving = false)
            return out
        }

    private fun parentKeys(): Set<String> {
        val keys = mutableSetOf<String>()
        fun walk(list: List<T>) {
            for (item in list) {
                val kids = children(item)
                if (!kids.isNullOrEmpty()) {
                    keys += key(item)
                    walk(kids)
                }
            }
        }
        walk(items)
        return keys
    }

    private fun setExpanded(key: String, expanded: Boolean) {
        toggled = if (expanded == defaultExpanded) toggled - key else toggled + key
    }

    fun expand(key: String) = setExpanded(key, true)
    fun collapse(key: String) = setExpanded(key, false)

    /** Opens every row that has children. */
    fun expandAll() {
        toggled = if (defaultExpanded) emptySet() else parentKeys()
    }

    /** Closes every row. */
    fun collapseAll() {
        toggled = if (defaultExpanded) parentKeys() else emptySet()
    }

    /** Open, and not on its way closed. */
    internal fun open(row: TreeRowData<T>) = row.expanded && closing != row.key

    private fun growIn(key: String) {
        openJob?.cancel()
        opened = key
        openJob = scope.launch {
            openProgress.snapTo(0f)
            openProgress.animateTo(1f, tween(260, easing = LinearEasing))
            // Done animating: back to plain rows (their borders come back as they do).
            kotlinx.coroutines.delay(60)
            if (opened == key) opened = null
        }
    }

    /** Opens or closes a row, animating its children. */
    fun toggle(key: String) {
        when {
            closing == key -> {
                // Opened again while still closing: stay open, and the rows grow back.
                closeJob?.cancel()
                closing = null
                growIn(key)
            }
            !isExpanded(key) -> {
                growIn(key)
                setExpanded(key, true)
            }
            reduced -> setExpanded(key, false)
            else -> {
                closeJob?.cancel()
                closing = key
                closeJob = scope.launch {
                    closeProgress.snapTo(0f)
                    closeProgress.animateTo(1f, tween(220, easing = LinearEasing))
                    setExpanded(key, false)
                    if (closing == key) closing = null
                }
            }
        }
    }

    /** Keyboard for a focused row. */
    internal fun key(row: TreeRowData<T>, key: Key, rtl: Boolean): Boolean {
        val rows = rows
        val i = rows.indexOfFirst { it.key == row.key }
        val right = if (rtl) Key.DirectionLeft else Key.DirectionRight
        val left = if (rtl) Key.DirectionRight else Key.DirectionLeft
        val to = when (key) {
            Key.DirectionDown -> rows.getOrNull(i + 1)
            Key.DirectionUp -> rows.getOrNull(i - 1)
            Key.MoveHome -> rows.firstOrNull()
            Key.MoveEnd -> rows.lastOrNull()
            right -> if (!row.hasChildren) return false else if (!open(row)) { toggle(row.key); null } else rows.getOrNull(i + 1)
            left -> if (open(row)) { toggle(row.key); null } else rows.firstOrNull { it.key == row.parentKey }
            else -> return false
        }
        if (to != null) {
            current = to.key
            focus[to.key]?.requestFocus()
        }
        return true
    }

    internal fun tabStop(rows: List<TreeRowData<T>>) = current?.takeIf { c -> rows.any { it.key == c } } ?: rows.firstOrNull()?.key
}

/**
 * Remembers a Tree over `items`: `key` names each (uniquely), `children` gives an item's
 * children (null or empty for a leaf). `defaultExpanded`: whether rows start open. `rowHeight`
 * is a TreeRow's height, for the open and close animation.
 */
@Composable
fun <T> rememberTree(
    items: List<T>,
    key: (T) -> String,
    children: (T) -> List<T>?,
    defaultExpanded: Boolean = true,
    rowHeight: Dp = 36.dp,
): Tree<T> {
    val scope = rememberCoroutineScope()
    val tree = remember { Tree<T>(scope) }
    tree.items = items
    tree.key = key
    tree.children = children
    tree.defaultExpanded = defaultExpanded
    tree.rowHeight = rowHeight
    tree.reduced = reducedMotion()
    return tree
}

/** A TreeRow's state for its cells: its tree, its data, and whether its focus outline shows. */
private class RowFocus(val tree: Tree<*>, row: TreeRowData<*>, val requester: FocusRequester) {
    // State: a cell that is skipped as its row recomposes still follows it (into its group closing).
    var row by mutableStateOf(row)
    var visible by mutableStateOf(false)
    var cells = 0
}

private val LocalRowFocus = compositionLocalOf<RowFocus?> { null }

/**
 * A table row wired to its Tree: tree semantics, the keyboard (its first TreeCell is the row's
 * focus) and the open and close animation. Use TreeCells in it.
 */
@Composable
fun <T> TreeRow(row: TreeRowData<T>, tree: Tree<T>, selected: Boolean = false, content: @Composable () -> Unit) {
    val requester = remember { FocusRequester() }
    DisposableEffect(tree, row.key) {
        tree.focus[row.key] = requester
        onDispose { if (tree.focus[row.key] === requester) tree.focus.remove(row.key) }
    }
    val focus = remember(tree, row.key) { RowFocus(tree, row, requester) }
    focus.row = row
    focus.cells = 0
    TableRow(selected) {
        CompositionLocalProvider(LocalRowFocus provides focus, content = content)
    }
}

/**
 * A cell in a TreeRow: its content sits in a box whose height animates as groups open and close,
 * on one line. The row's first is its focus, for the keyboard.
 */
@Composable
fun TreeCell(modifier: Modifier = Modifier, numeric: Boolean = false, sticky: Boolean = false, width: Dp? = null, fraction: Float? = null, content: @Composable RowScope.() -> Unit) {
    val focus = LocalRowFocus.current ?: error("TreeCell must be inside TreeRow")
    val index = remember { focus.cells }
    focus.cells++
    @Suppress("UNCHECKED_CAST")
    val tree = focus.tree as Tree<Any?>
    @Suppress("UNCHECKED_CAST")
    val row = focus.row as TreeRowData<Any?>
    val t = Zen.tokens
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val entering = row.entering
    val leaving = row.leaving
    // While a row is 0 tall its border would still show as a stacked line.
    val border by animateColorAsState(if (entering || leaving) t.tint.color(0f) else t.tint.color(0.045f), transition(200, Ease.Css))
    val (h, shown) = when {
        entering -> grow(tree.openProgress.value)
        leaving -> shrink(tree.closeProgress.value)
        else -> 1f to 1f
    }
    val own = index == 0
    val source = remember { MutableInteractionSource() }
    val state = if (own) rememberControlState(source) else null
    if (own) focus.visible = state!!.focusVisible
    val full = tree.rowHeight - 1.dp
    Cell(
        modifier,
        width,
        numeric,
        sticky,
        PaddingValues(horizontal = 12.dp),
        border = border,
        outline = focus.visible,
        fraction = fraction,
    ) {
        Row(
            Modifier
                .height(full * h)
                .then(if (h < 1f) Modifier.clipToBounds() else Modifier)
                .graphicsLayer { alpha = shown }
                .then(
                    if (!own) Modifier else Modifier
                        .semantics {
                            // aria-expanded: an expandable row, open or not.
                            if (row.hasChildren) {
                                if (tree.open(row)) collapse { tree.toggle(row.key); true } else expand { tree.toggle(row.key); true }
                            }
                        }
                        .onKeyEvent { e -> e.type == KeyEventType.KeyDown && tree.key(row, e.key, rtl) }
                        .focusRequester(focus.requester)
                        .focusProperties { canFocus = tree.tabStop(tree.rows) == row.key }
                        .onFocusChanged { if (it.isFocused) tree.current = row.key }
                        .activeElement()
                        .focusable(interactionSource = source),
                ),
            horizontalArrangement = if (numeric) Arrangement.End else Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

/** The first column's content: indented by depth, with the row's toggle (or a spacer, so labels line up). */
@Composable
fun <T> TreeLabel(row: TreeRowData<T>, tree: Tree<T>, modifier: Modifier = Modifier, indent: Dp = 20.dp, content: @Composable RowScope.() -> Unit) {
    Row(
        modifier.padding(start = indent * row.depth),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // -ms-1: the toggle (or its spacer) reaches 4dp back, so its chevron lines up with the text above.
        val back = Modifier.layout { measurable, constraints ->
            val p = measurable.measure(constraints)
            val by = 4.dp.roundToPx()
            layout(p.width - by, p.height) { p.placeRelative(-by, 0) }
        }
        if (row.hasChildren) TreeToggle(tree.open(row), { tree.toggle(row.key) }, back)
        else Box(back.width(24.dp))
        content()
    }
}

/** Chevron button that opens and closes a row: points to the end when closed, down when open. Not a tab stop: the keyboard opens rows with the arrows. */
@Composable
fun TreeToggle(expanded: Boolean, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val state = rememberControlState()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val fill by animateColorAsState(if (state.hovered) t.tint.color(0.08f) else t.tint.color(0f), transition(150))
    val color by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
    val turn by animateFloatAsState(if (expanded) (if (rtl) -90f else 90f) else 0f, tween(200, easing = Ease.Out))
    Box(
        modifier
            .size(24.dp)
            .box(Zen.radii.md, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .focusProperties { canFocus = false }
            .control(state, label = if (expanded) m.collapse else m.expand) { onToggle() }
            .semantics { contentDescription = if (expanded) m.collapse else m.expand },
        contentAlignment = Alignment.Center,
    ) {
        Icon(Icons.ChevronRightMicro, Modifier.rotate(turn).then(if (rtl) Modifier.scale(-1f, 1f) else Modifier), size = 16.dp, color = color)
    }
}
