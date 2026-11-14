package dev.rinzai.zen.table

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ScrollState
import androidx.compose.ui.layout.LookaheadScope
import dev.rinzai.zen.Gutter
import dev.rinzai.zen.Scrolled
import dev.rinzai.zen.bar
import dev.rinzai.zen.scrollbars
import dev.rinzai.zen.scrolledContent
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import dev.rinzai.zen.ViewTransitionStyle
import dev.rinzai.zen.viewTransition
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.toSize
import dev.rinzai.zen.BackdropSource
import dev.rinzai.zen.Capture
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.activeElement
import dev.rinzai.zen.alignMiddle
import dev.rinzai.zen.box
import dev.rinzai.zen.browserFocusRing
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.frost
import dev.rinzai.zen.glass
import dev.rinzai.zen.glassFill
import dev.rinzai.zen.frame
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.insetRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.tree.TreeRowData
import dev.rinzai.zen.menu.MenuState
import dev.rinzai.zen.menu.menuContextTrigger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** A row: its hover (any of its cells), and how it moves as rows come, go and change places. */
@Stable
internal class RowState {
    val hover = MutableInteractionSource()
    var selected by mutableStateOf(false)

    /** The menu a right click or long press on it opens. */
    var contextMenu: MenuState? by mutableStateOf(null)

    /** Where it was last placed in the table, to glide from there when the rows change. */
    var top: Int? = null
    var moved = false
    val shift = Animatable(0f)
    val rise = Animatable(1f)
    val enter = Animatable(1f)
    var leaving by mutableStateOf(false)
    val leave = Animatable(0f)

    /** How far it's swiped toward its start, uncovering its actions (TableSwipeRow). */
    val swipe = Animatable(0f)
    var rtl = false

    /** Its SortableTree item, which moves it (and settles it, in place of the table's glide). */
    var sorted: MovingRow? = null

    /** What a click anywhere on it does, and its name for view transitions. */
    var onClick: (() -> Unit)? = null
    var transition: Pair<String, ViewTransitionStyle>? = null

    val alpha get() = rise.value * enter.value * (1f - leave.value)
    fun dx(density: Density) = with(density) { -12.dp.toPx() * leave.value } + if (rtl) swipe.value else -swipe.value
    fun dy(density: Density) = with(density) { shift.value + (1f - rise.value) * 8.dp.toPx() - (1f - enter.value) * 6.dp.toPx() } + (sorted?.offset ?: 0f)
}

/** A row a SortableTree moves (its SortableItem): how far it's moved now, and how it shows. */
internal interface MovingRow {
    val offset: Float

    /** Dragged, or carried along under the dragged one: over the other rows, frosted. */
    val moving: Boolean

    /** Picked up from the keyboard. */
    val lifted: Boolean

    /** Where the dragged one would go: lit. */
    val lit: Boolean
    fun placed(top: Float, height: Float)
}

internal val LocalMovingRow = compositionLocalOf<MovingRow?> { null }

/** A TableContainer's scrolling, for a row dragged near its edge, and the part of the table in view. */
internal class TableScroller(val state: TableScrollState) {
    var bounds = Rect.Zero
}

internal val LocalTableScroller = compositionLocalOf<TableScroller?> { null }

/** Whether this is inside a Table (where a SortableItem is the TableRow inside it). */
@Composable
internal fun inTable() = LocalFlags.current != null

/** Which part of the table a row is in: the header and footer stay put as the body scrolls. */
internal enum class Part { Head, Body, Foot }

internal val LocalRow = compositionLocalOf<RowState?> { null }
private val LocalBodyRow = compositionLocalOf<RowState?> { null }
internal val LocalPart = compositionLocalOf { Part.Body }
private val LocalSticky = compositionLocalOf<Sticky?> { null }

/** A cell's row, the part it's in, and the width its column asks for, for the table to lay them out by. */
internal class CellData(
    val row: RowState,
    val part: Part,
    val width: Dp?,
    val start: Boolean,
    val span: Boolean,
    /** The share of the table's width its column asks for (CSS's percentage width). */
    val fraction: Float? = null,
    /** A swipe row's actions, past its end: no column of its own, as wide as the row is swiped. */
    val tray: Boolean = false,
    /** A spacer row's height, which it stands for without being measured that tall. */
    val extent: Int = 0,
) : ParentDataModifier {
    /** The first and last of its row's cells, as the table lays them out: a row's outline closes at them. */
    var first = false
    var last = false

    override fun Density.modifyParentData(parentData: Any?) = this@CellData
}

/**
 * A TableContainer's scrolling, and its sticky cells: they're drawn over the rest (a copy of which
 * they frost), not with it, so that what scrolls under them is what they frost.
 */
@Stable
private class Sticky(val v: TableScrollState) {
    val h = ScrollState(0)
    val scroller = TableScroller(v)
    /** The table's size, measured in the look-ahead pass: whether it overflows the view, so takes scrollbars. */
    val gutter = Gutter()
    val bars = object : Scrolled {
        override val value get() = v.value
        override val maxValue get() = v.maxValue
        override val viewportSize get() = v.viewportSize
        override fun dispatchRawDelta(delta: Float) = v.dispatchRawDelta(delta)
    } to h.bar()
    val backdrop = BackdropSource()
    val cells = mutableListOf<StickyCell>()
    var version by mutableIntStateOf(0)
    var origin = Offset.Zero
}

private class StickyCell(val part: Part, val start: Boolean, val row: RowState, val layer: GraphicsLayer, val frosted: GraphicsLayer) {
    var at = Offset.Zero
    var size = Size.Zero
}

/** In a TableContainer, a header, footer or first-column cell is drawn by the container, over the rest. */
@Composable
internal fun Modifier.sticky(part: Part, start: Boolean, row: RowState): Modifier {
    val sticky = LocalSticky.current ?: return this
    if (part == Part.Body && !start && row.sorted?.moving != true) return this
    val layer = rememberGraphicsLayer()
    val frosted = rememberGraphicsLayer()
    val cell = remember(sticky, part, start, row) { StickyCell(part, start, row, layer, frosted) }
    DisposableEffect(cell) {
        sticky.cells += cell
        sticky.version++
        onDispose {
            sticky.cells -= cell
            sticky.version++
        }
    }
    return onGloballyPositioned {
        cell.at = it.positionInRoot()
        cell.size = it.size.toSize()
        sticky.version++
    }.drawWithContent {
        layer.record { this@drawWithContent.drawContent() }
        sticky.version++
    }
}

/**
 * The glass panel a Table scrolls in, with its corners and lit edge. Give it a height limit
 * (`heightIn(max = …)`) to scroll vertically: the header and footer stay put, clear at rest and
 * frosted while rows pass under them, and so does a `sticky` first column when it scrolls sideways,
 * which it does when the table can't fit. Name it with `label` to make it a region keyboard users
 * can scroll (the arrow keys, Page Up and Down, Space, Home and End). For thousands of rows, give it
 * a height and window them by its `scroll` (rememberVirtualList), with TableSpacerRows for the rest.
 */
@Composable
fun TableContainer(
    modifier: Modifier = Modifier,
    label: String? = null,
    /** Its vertical scroll, to window the rows by (rememberVirtualList). */
    scroll: TableScrollState = rememberTableScrollState(),
    content: @Composable () -> Unit,
) {
    val shape = Zen.radii.xl
    val t = Zen.tokens
    val sticky = remember(scroll) { Sticky(scroll) }
    // Where there's no live blur (a touch screen), solid.
    val fill = if (coarsePointer) t.card.color() else t.card.color(0.6f)
    // What's under the panel, which its sticky parts frost along with the rows: the page's
    // canvas, what's under the page (the Backdrop), and the panel's own glass.
    val page = Page(t.background.color(), Zen.frame.shownUnder, glassFill(t))
    val top = rememberGraphicsLayer()
    val bottom = rememberGraphicsLayer()
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val ring = focused && Zen.page.keyboard
    val scope = rememberCoroutineScope()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val line = with(LocalDensity.current) { 40.dp.toPx() }
    val region = if (label == null) Modifier else Modifier
        .semantics { contentDescription = label }
        .activeElement()
        .focusable(interactionSource = source)
        .onKeyEvent { e ->
            if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
            val page = sticky.v.viewportSize * 0.875f
            val (scroll, by) = when (e.key) {
                Key.DirectionDown -> sticky.v to line
                Key.DirectionUp -> sticky.v to -line
                Key.PageDown -> sticky.v to page
                Key.PageUp -> sticky.v to -page
                Key.Spacebar -> sticky.v to if (e.isShiftPressed) -page else page
                Key.MoveHome -> sticky.v to -sticky.v.value.toFloat()
                Key.MoveEnd -> sticky.v to (sticky.v.maxValue - sticky.v.value).toFloat()
                Key.DirectionRight -> sticky.h to if (rtl) -line else line
                Key.DirectionLeft -> sticky.h to if (rtl) line else -line
                else -> return@onKeyEvent false
            }
            scope.launch { scroll.animateScrollBy(by) }
            true
        }
    Box(modifier.fillMaxWidth().glowEdge(shape).glass(shape).clip(shape)) {
        Capture(sticky.backdrop, Modifier) {
            // At least as wide as the panel: the table shares the room out among its columns.
            LookaheadScope {
                Box(
                    region.fillMaxWidth()
                        .then(if (coarsePointer) Modifier else Modifier.scrollbars(sticky.gutter, sticky.bars.first, sticky.bars.second))
                        .grows().tableScroll(sticky.v, scope).horizontalScroll(sticky.h)
                        .then(if (coarsePointer) Modifier else Modifier.scrolledContent(sticky.gutter)),
                    propagateMinConstraints = true,
                ) {
                    CompositionLocalProvider(LocalSticky provides sticky, LocalStickyScroll provides sticky.h, LocalTableScroller provides sticky.scroller, content = content)
                }
            }
        }
        Box(
            Modifier
                .matchParentSize()
                .onGloballyPositioned {
                    sticky.origin = it.positionInRoot()
                    sticky.scroller.bounds = it.boundsInRoot()
                }
                .graphicsLayer()
                .drawBehind { drawSticky(sticky, page, fill, t.card.color(0.8f), top, bottom) }
                .box(shape, shadows = if (ring) listOf(insetRing(t.ring.color(0.5f), 2f)) else emptyList()),
        )
    }
}

/** With no height limit (in a page that scrolls), an overflow: auto box is as tall as what's in it. */
private fun Modifier.grows() = layout { m, c ->
    val p = m.measure(if (c.hasBoundedHeight) c else c.copy(maxHeight = TALLEST))
    layout(p.width, p.height) { p.place(0, 0) }
}

/** As tall as anything gets: what a scroller with no limit is measured within. */
private const val TALLEST = (1 shl 18) - 2

/**
 * The sticky parts over the scrolled table: the first column's cells, then the footer row, then
 * the header row (CSS's z-index order). Each frosts what's under it while rows pass under its
 * edge, the header and footer as whole rows, and fades the row it cuts across a short band.
 */
private class Page(val canvas: Color, val under: BackdropSource, val glass: Brush)

private fun DrawScope.drawSticky(s: Sticky, page: Page, fill: Color, movingFill: Color, top: GraphicsLayer, bottom: GraphicsLayer) {
    s.version
    s.backdrop.frame
    page.under.frame
    val panel = size
    val behind = s.backdrop.layer ?: return
    val solid = coarsePointer
    val underTop = s.v.value > 0
    val underBottom = s.v.value < s.v.maxValue
    val underStart = s.h.value > 0
    val band = 28.dp.toPx()
    // Worked out here, not while a layer records (whose scope this one's density then resolves through, round and round).
    val rects = s.cells.associateWith { c ->
        val at = c.at - s.origin
        Rect(Offset(at.x + c.row.dx(this), at.y + c.row.dy(this)), c.size)
    }
    fun rect(c: StickyCell) = rects.getValue(c)
    fun frosted(layer: GraphicsLayer, r: Rect, over: Color = fill, under: DrawScope.() -> Unit = {}) {
        if (!solid) translate(r.left, r.top) {
            clipRect(0f, 0f, r.width, r.height) {
                frost(layer, r.size, 18f, 1.4f) {
                    translate(-r.left, -r.top) {
                        drawRect(page.canvas)
                        page.under.layer?.let { translate(page.under.origin.x - s.origin.x, page.under.origin.y - s.origin.y) { drawLayer(it) } }
                        drawRect(page.glass, size = panel)
                        translate(s.backdrop.origin.x - s.origin.x, s.backdrop.origin.y - s.origin.y) { drawLayer(behind) }
                        under()
                    }
                }
            }
        }
        drawRect(over, r.topLeft, r.size)
    }
    fun cell(c: StickyCell) {
        val r = rect(c)
        c.layer.alpha = c.row.alpha
        translate(r.left, r.top) { drawLayer(c.layer) }
    }
    fun row(part: Part) = s.cells.filter { it.part == part }
    // The first column's body cells, frosted one by one as columns pass under them. Under the header
    // or footer, they're drawn again into what that frosts, their own frost as it was just made.
    val start = s.cells.filter { it.part == Part.Body && it.row.sorted?.moving != true }
    val moving = s.cells.filter { it.part == Part.Body && it.row.sorted?.moving == true }
    fun drawStart(again: Boolean) = start.forEach { c ->
        if (underStart) {
            val r = rect(c)
            if (!again) frosted(c.frosted, r)
            else {
                if (!solid) translate(r.left, r.top) { drawLayer(c.frosted) }
                drawRect(fill, r.topLeft, r.size)
            }
        }
        cell(c)
    }
    drawStart(again = false)
    fun edge(part: Part, layer: GraphicsLayer, under: Boolean, below: Boolean) {
        val cells = row(part)
        if (cells.isEmpty()) return
        val r = cells.map(::rect).reduce { a, b -> Rect(minOf(a.left, b.left), minOf(a.top, b.top), maxOf(a.right, b.right), maxOf(a.bottom, b.bottom)) }
        if (under) {
            frosted(layer, r) { drawStart(again = true) }
            val fade = if (below) Rect(r.left, r.bottom, r.right, r.bottom + band) else Rect(r.left, r.top - band, r.right, r.top)
            drawRect(
                Brush.verticalGradient(if (below) listOf(fill, Color.Transparent) else listOf(Color.Transparent, fill), fade.top, fade.bottom),
                fade.topLeft,
                fade.size,
            )
        } else if (underStart) cells.filter { it.start }.forEach { frosted(it.frosted, rect(it)) }
        cells.forEach(::cell)
    }
    // As CSS stacks them: the header, then rows being dragged over everything else, then the footer.
    edge(Part.Head, top, underTop, below = true)
    val lifted = if (solid) movingFill.copy(alpha = 1f) else movingFill
    moving.forEach { c ->
        frosted(c.frosted, rect(c), lifted) { drawStart(again = true); row(Part.Head).forEach(::cell) }
        cell(c)
    }
    edge(Part.Foot, bottom, underBottom, below = false)
}

/**
 * Rows and columns of data, laid out as a browser lays out a table: each column as wide as its
 * widest cell, columns given a `width` at least that, and the room left shared among the others
 * in proportion to their content. Put a TableHeader, a TableBody of TableRows and a TableFooter inside.
 */
@Composable
fun Table(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val scope = rememberCoroutineScope()
    val sticky = LocalSticky.current
    val flags = remember { TableFlags() }
    ProvideText(style = TextStyles.sm) {
        CompositionLocalProvider(LocalScope provides scope, LocalFlags provides flags) {
            Layout(content, modifier) { measurables, constraints ->
                val cells = measurables.map { it to (it.parentData as CellData) }
                // Rows, in order: a row's cells are composed together.
                val rows = mutableListOf<MutableList<Pair<Measurable, CellData>>>()
                for (c in cells) if (rows.lastOrNull()?.first()?.second?.row === c.second.row) rows.last().add(c) else rows.add(mutableListOf(c))
                // A row spanning the table (TableEmpty) takes no part in sizing the columns, nor a swipe row's actions.
                val flow = rows.filter { !it.first().second.row.leaving && !it.first().second.span }.map { row -> row.filterNot { it.second.tray } }
                val columns = flow.maxOfOrNull { it.size } ?: 0
                val fixed = arrayOfNulls<Float>(columns)
                val min = FloatArray(columns)
                val max = FloatArray(columns)
                val fraction = arrayOfNulls<Float>(columns)
                for (row in flow) row.forEachIndexed { i, (m, data) ->
                    data.width?.let { fixed[i] = maxOf(fixed[i] ?: 0f, it.toPx()) }
                    data.fraction?.let { fraction[i] = maxOf(fraction[i] ?: 0f, it) }
                    min[i] = maxOf(min[i], m.minIntrinsicWidth(Constraints.Infinity).toFloat())
                    max[i] = maxOf(max[i], m.maxIntrinsicWidth(Constraints.Infinity).toFloat())
                }
                val widths = FloatArray(columns) { i -> fixed[i]?.let { maxOf(it, min[i]) } ?: max[i] }
                // The room: what it's given, or in a scroller (unbounded), at least the scroller's width.
                val room = when {
                    constraints.hasBoundedWidth -> constraints.maxWidth.toFloat()
                    else -> maxOf(constraints.minWidth.toFloat(), widths.sum())
                }
                // A percentage width is a share of the table's, at least its content's narrowest; it outranks a length.
                for (i in 0 until columns) fraction[i]?.let { fixed[i] = maxOf(it * room, min[i]); widths[i] = fixed[i]!! }
                val auto = (0 until columns).filter { fixed[it] == null }
                val fixedSum = (0 until columns).filter { fixed[it] != null }.sumOf { widths[it].toDouble() }.toFloat()
                val autoMax = auto.sumOf { max[it].toDouble() }.toFloat()
                val autoMin = auto.sumOf { min[it].toDouble() }.toFloat()
                when {
                    // Room to spare: the auto columns share it, in proportion to their content.
                    fixedSum + autoMax <= room -> {
                        val extra = room - fixedSum - autoMax
                        if (auto.isNotEmpty() && autoMax > 0f) for (i in auto) widths[i] = max[i] + extra * max[i] / autoMax
                        else if (columns > 0) { val all = widths.sum(); for (i in 0 until columns) widths[i] += extra * widths[i] / all }
                    }
                    // Tight: each auto column between its narrowest and its widest.
                    fixedSum + autoMin <= room -> {
                        val f = (room - fixedSum - autoMin) / (autoMax - autoMin)
                        for (i in auto) widths[i] = min[i] + (max[i] - min[i]) * f
                    }
                    else -> for (i in auto) widths[i] = min[i]
                }
                // Each column's edges rounded from where they fall exactly, as browsers snap cells.
                val edges = IntArray(columns + 1)
                var x = 0f
                for (i in 0 until columns) { x += widths[i]; edges[i + 1] = x.roundToInt() }
                val tableWidth = if (columns > 0) edges[columns] else room.roundToInt()
                fun left(row: List<Pair<Measurable, CellData>>, i: Int) = when {
                    row[i].second.span -> 0
                    row[i].second.tray -> tableWidth
                    else -> edges[minOf(i, columns)]
                }
                fun cellWidth(row: List<Pair<Measurable, CellData>>, i: Int) = when {
                    row[i].second.span -> tableWidth
                    row[i].second.tray -> kotlin.math.ceil(row[i].second.row.swipe.value).toInt().coerceAtLeast(0)
                    else -> edges[minOf(i + 1, columns)] - edges[minOf(i, columns)]
                }
                for (row in rows) {
                    val own = row.filterNot { it.second.tray }
                    own.forEachIndexed { i, (_, data) ->
                        data.first = i == 0
                        data.last = i == own.lastIndex
                    }
                }
                val placed = rows.map { row ->
                    val h = row.indices.filterNot { row[it].second.tray }.maxOfOrNull { i -> row[i].first.minIntrinsicHeight(cellWidth(row, i)) } ?: 0
                    row to row.indices.map { i -> row[i].first.measure(Constraints.fixed(cellWidth(row, i), h)) }
                }
                var y = 0
                val tops = placed.map { (row, ps) ->
                    val state = row.first().second.row
                    if (state.leaving) state.top ?: 0
                    else y.also { y += maxOf(row.first().second.extent, ps.maxOfOrNull { it.height } ?: 0) }
                }
                val partOf = placed.map { it.first.first().second.part }
                val headHeight = placed.indices.filter { partOf[it] == Part.Head }.sumOf { placed[it].second.maxOfOrNull { p -> p.height } ?: 0 }
                val footTop = placed.indices.firstOrNull { partOf[it] == Part.Foot }?.let { tops[it] } ?: y
                // In a container, the table is as tall as the view of it (at most), and lays out the part scrolled to.
                val height = if (sticky != null) minOf(y, constraints.maxHeight) else y
                // The look-ahead pass only finds whether it overflows; the view is the one laid out beside the scrollbars.
                if (isLookingAhead) sticky?.gutter?.extent = y
                else sticky?.v?.let {
                    it.viewportSize = height
                    it.maxValue = y - height
                }
                layout(tableWidth, height) {
                    // Sticky parts: the header to the top of the view, the footer to its bottom, the first column to its start.
                    val scrolled = sticky?.v?.value ?: 0
                    val view = height
                    val headBy = scrolled.coerceIn(0, maxOf(0, y - headHeight))
                    val footBy = (scrolled + view - y).coerceIn(-(maxOf(0, footTop - headHeight)), 0)
                    val startBy = sticky?.h?.value ?: 0
                    placed.forEachIndexed { r, (row, ps) ->
                        val state = row.first().second.row
                        val top = tops[r]
                        if (!state.leaving && partOf[r] == Part.Body) {
                            val was = state.top
                            if (state.moved && was != null && was != top && state.sorted == null) {
                                scope.launch {
                                    state.shift.snapTo(state.shift.value + (was - top))
                                    state.shift.animateTo(0f, tween(320, easing = Ease.OutSoft))
                                }
                            }
                            state.moved = false
                            state.top = top
                        }
                        val dy = when (partOf[r]) { Part.Head -> headBy; Part.Foot -> footBy; Part.Body -> 0 }
                        ps.forEachIndexed { i, p ->
                            val start = row[i].second.start
                            val z = (if (partOf[r] != Part.Body) 2f else 0f) + if (start) 1f else 0f
                            p.placeRelative(left(row, i) + if (start) startBy else 0, top + dy - scrolled, z)
                        }
                    }
                }
            }
        }
    }
}

private val LocalScope = compositionLocalOf<CoroutineScope?> { null }

/** What a table's body knows of the rest: with spacer rows, its rows come and go as it scrolls. */
private class TableFlags {
    var windowed = false
}

private val LocalFlags = compositionLocalOf<TableFlags?> { null }

/**
 * An empty row `height` tall, standing in for the rows scrolled out of view (rememberVirtualList's
 * paddingTop and paddingBottom). With one, the body's rows don't animate as they come and go.
 */
@Composable
fun TableSpacerRow(height: Dp) {
    LocalFlags.current?.windowed = true
    if (height <= 0.dp) return
    TableRow {
        val px = with(LocalDensity.current) { height.roundToPx() }
        Box(Modifier.then(CellData(LocalRow.current!!, LocalPart.current, null, start = false, span = true, extent = px)).semantics { hideFromAccessibility() })
    }
}

/** The column headings: a row over the rest, which stays at the top as the body scrolls in a TableContainer. */
@Composable
fun TableHeader(content: @Composable () -> Unit) = CompositionLocalProvider(LocalPart provides Part.Head, content = content)

/** Rows that stay at the bottom as the body scrolls in a TableContainer (totals, balances): TableRows of TableFooterCells. */
@Composable
fun TableFooter(content: @Composable () -> Unit) = CompositionLocalProvider(LocalPart provides Part.Foot, content = content)

/**
 * The table's rows, one for each of `items` (`key` tells them apart): as the items change, new
 * rows fade in, rows that move glide to their place, and rows that go fade out where they were.
 * `rise` has the rows rise into view one after another as they first show (.rise-list).
 */
@Composable
fun <T> TableBody(
    items: List<T>,
    key: (T) -> Any,
    rise: Boolean = false,
    row: @Composable (T) -> Unit,
) {
    val scope = rememberCoroutineScope()
    // Windowed (spacer rows), rows come and go as it scrolls: they don't animate.
    val reduced = reducedMotion() || LocalFlags.current?.windowed == true
    val states = remember { mutableMapOf<Any, RowState>() }
    val shown = remember { mutableStateListOf<Pair<Any, T>>() }
    // Each row's latest item: the keys can stay as an item changes (a tree's rows as their group starts closing).
    val latest = remember { mutableMapOf<Any, T>() }
    val keys = items.map(key)
    val was = remember { arrayOf<List<Any>?>(null) }
    if (was[0] != keys) {
        val before = was[0]
        was[0] = keys
        // A tree animates its own rows opening and closing: then nothing else moves.
        val own = items.any { (it as? TreeRowData<*>)?.animating == true && key(it) !in before.orEmpty() } ||
            shown.any { (k, it) -> k !in keys && ((latest[k] ?: it) as? TreeRowData<*>)?.animating == true }
        val reduced = reduced || own
        val first = before == null
        val kept = before?.any { it in keys } ?: false
        // The departing, kept where they were among the rest while they fade.
        val leaving = shown.withIndex().filter { (_, e) -> e.first !in keys && states[e.first]?.leaving != true }
        val next = items.map { key(it) to it }.toMutableList()
        for ((i, e) in leaving) {
            val state = states[e.first] ?: continue
            if (first || reduced || !kept) { states.remove(e.first); continue }
            state.leaving = true
            next.add(minOf(i, next.size), e)
            scope.launch {
                state.leave.animateTo(1f, tween(220, easing = Ease.CssIn))
                shown.removeAll { it.first == e.first }
                states.remove(e.first)
            }
        }
        // Still fading from before.
        for ((i, e) in shown.withIndex()) if (states[e.first]?.leaving == true && next.none { it.first == e.first }) next.add(minOf(i, next.size), e)
        items.forEachIndexed { i, item ->
            val k = key(item)
            val state = states.getOrPut(k) {
                RowState().also { s ->
                    if (first && rise && !reduced && i < 12) scope.launch {
                        s.rise.snapTo(0f)
                        s.rise.animateTo(1f, tween(450, i * 35, Ease.OutSoft))
                    } else if (!first && !reduced) scope.launch {
                        s.enter.snapTo(0f)
                        s.enter.animateTo(1f, tween(260, easing = Ease.CssOut))
                    }
                }
            }
            state.moved = !first && !reduced
        }
        shown.clear()
        shown.addAll(next)
        latest.keys.retainAll(next.map { it.first }.toSet())
    }
    items.forEach { latest[key(it)] = it }
    CompositionLocalProvider(LocalPart provides Part.Body) {
        for ((k, item) in shown) {
            key(k) {
                CompositionLocalProvider(LocalBodyRow provides states[k]) { row(latest[k] ?: item) }
            }
        }
    }
}

/**
 * A row of cells. `selected` tints it; `onClick` makes all of it a click target (as a tr's onClick:
 * give it a button too, for the keyboard); `viewTransition` names it for view transitions, all its
 * cells one element (Modifier.viewTransition). `contextMenu` opens on a right click or long press
 * anywhere on it (MenuContextTrigger round a tr), and tints it while it's open.
 */
@Composable
fun TableRow(
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
    viewTransition: String? = null,
    viewTransitionStyle: ViewTransitionStyle = ViewTransitionStyle.Default,
    contextMenu: MenuState? = null,
    content: @Composable () -> Unit,
) {
    val own = remember { RowState() }
    val state = LocalBodyRow.current ?: own
    state.selected = selected
    state.sorted = LocalMovingRow.current
    state.onClick = onClick
    state.contextMenu = contextMenu
    state.transition = viewTransition?.let { it to viewTransitionStyle }
    CompositionLocalProvider(LocalRow provides state, LocalBodyRow provides null, LocalMovingRow provides null, content = content)
}

/** How a row shows as it rises, enters, moves or leaves (a sticky cell's container draws it so itself). */
@Composable
internal fun Modifier.motion(row: RowState, sticky: Boolean) =
    (row.sorted?.let { m -> onGloballyPositioned { m.placed(it.positionInRoot().y, it.size.height.toFloat()) } } ?: this)
        .then(row.transition?.let { (name, style) -> Modifier.viewTransition(name, style) } ?: Modifier)
        .then(row.onClick?.let { click -> Modifier.pointerHoverIcon(PointerIcon.Hand).pointerInput(click) { detectTapGestures { click() } } } ?: Modifier)
        .then(row.contextMenu?.let { Modifier.menuContextTrigger(it) } ?: Modifier)
        .let { placed ->
        // A sticky cell's container draws it moved, as it does a row being dragged.
        if ((sticky || row.sorted?.moving == true) && LocalSticky.current != null) placed else placed.moved(row)
    }

private fun Modifier.moved(row: RowState) =
    graphicsLayer {
        alpha = row.alpha
        translationY = row.dy(this)
        translationX = row.dx(this)
    }

/** The edge a sticky first column keeps against the columns that scroll under it. */
@Composable
private fun startEdge(): Shadow {
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    return Shadow(x = if (rtl) 1f else -1f, color = Zen.tokens.tint.color(0.06f), inset = true)
}

enum class SortDirection { Asc, Desc }

/**
 * A column heading: small, spaced capitals. `width` asks for the column's width (the content's
 * wins if wider), or `fraction` for a share of the table's (w-2/5 is 0.4); `numeric` puts it at the end, over figures; `sticky` keeps it in view as the
 * table scrolls sideways. With `onSort`, it's a button that sorts by the column, showing (and
 * saying) `sortDirection`.
 */
@Composable
fun TableHead(
    modifier: Modifier = Modifier,
    width: Dp? = null,
    fraction: Float? = null,
    numeric: Boolean = false,
    sticky: Boolean = false,
    sortDirection: SortDirection? = null,
    onSort: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit = {},
) {
    val row = LocalRow.current ?: error("TableHead must be inside TableRow")
    val part = LocalPart.current
    val t = Zen.tokens
    val m = LocalMessages.current
    Box(
        modifier
            .then(CellData(row, part, width, sticky, span = false, fraction = fraction))
            .sticky(part, sticky, row)
            .box(RectangleShape, border = SolidColor(t.tint.color(0.07f)), sides = Sides.Bottom)
            .semantics {
                heading()
                if (sortDirection != null) stateDescription = if (sortDirection == SortDirection.Asc) m.sortedAscending else m.sortedDescending
            }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        contentAlignment = if (numeric) Alignment.CenterEnd else Alignment.CenterStart,
    ) {
        val style = TextStyles.xs.merge(TextStyles.medium).copy(lineHeight = 20.sp, letterSpacing = 0.05.em)
        if (onSort == null) {
            ProvideText(color = t.mutedForeground.color(), style = style, transform = TextTransform.Uppercase) { content() }
        } else {
            val state = rememberControlState()
            ProvideText(
                color = if (state.hovered) t.foreground.color() else t.mutedForeground.color(),
                style = style,
                transform = TextTransform.Uppercase,
            ) {
                Row(
                    Modifier
                        .alignMiddle()
                        .browserFocusRing(state.focusVisible)
                        .control(state, onClick = onSort),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // A numeric column's chevron goes before its name, nearer the middle of the table.
                    val chevron: @Composable () -> Unit = {
                        Box(Modifier.width(12.dp)) {
                            when (sortDirection) {
                                SortDirection.Asc -> Icon(Icons.ChevronUp, size = 12.dp, strokeWidth = 2.5f)
                                SortDirection.Desc -> Icon(Icons.ChevronDown, size = 12.dp, strokeWidth = 2.5f)
                                null -> {}
                            }
                        }
                    }
                    if (numeric) chevron()
                    Box { content() }
                    if (!numeric) chevron()
                }
            }
        }
    }
}

/**
 * A cell. Its row lights faintly under the pointer. `width` asks for the column's width (the
 * content's wins if wider), or `fraction` for a share of the table's; `numeric` sets figures at the end, all one width; `sticky` keeps it in
 * view as the table scrolls sideways; `padding` replaces CellPadding.
 */
@Composable
fun TableCell(
    modifier: Modifier = Modifier,
    width: Dp? = null,
    fraction: Float? = null,
    numeric: Boolean = false,
    sticky: Boolean = false,
    padding: PaddingValues = CellPadding,
    content: @Composable BoxScope.() -> Unit,
) = Cell(modifier, width, numeric, sticky, padding, fraction = fraction, content = content)

/** A body cell; `border` in place of the row's hairline, and `outline` drawing its part of the row's focus outline (a TreeRow's). */
@Composable
internal fun Cell(
    modifier: Modifier,
    width: Dp?,
    numeric: Boolean,
    sticky: Boolean,
    padding: PaddingValues,
    border: Color? = null,
    outline: Boolean = false,
    fraction: Float? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val row = LocalRow.current ?: error("TableCell must be inside TableRow")
    val part = LocalPart.current
    val t = Zen.tokens
    val hovered by row.hover.collectIsHoveredAsState()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    // The row's tint is layered over the cell, so it shows the same over any background.
    val sorted = row.sorted
    val tint = when {
        row.selected || sorted?.lifted == true || sorted?.lit == true -> t.primary.color(0.09f)
        row.contextMenu?.open == true -> t.tint.color(0.06f)
        hovered -> t.tint.color(0.035f)
        else -> t.tint.color(0f)
    }
    val data = CellData(row, part, width, sticky, span = false, fraction = fraction)
    val ring = t.ring.color(0.6f)
    Box(
        modifier
            .then(data)
            .then(LocalSwipeGesture.current)
            .sticky(part, sticky, row)
            .motion(row, sticky)
            .hoverable(row.hover)
            .then(
                // focus-visible:outline-2 -outline-offset-2: the row's outline, over it and inside it, closed at its ends.
                if (!outline) Modifier else Modifier.drawWithContent {
                    drawContent()
                    val w = 2.dp.toPx()
                    drawRect(ring, size = Size(size.width, w))
                    drawRect(ring, Offset(0f, size.height - w), Size(size.width, w))
                    val (start, end) = if (rtl) data.last to data.first else data.first to data.last
                    if (start) drawRect(ring, Offset(0f, w), Size(w, size.height - 2 * w))
                    if (end) drawRect(ring, Offset(size.width - w, w), Size(w, size.height - 2 * w))
                },
            )
            .box(
                RectangleShape,
                // Dragged outside a TableContainer, a card over the rest (in one, the container frosts it).
                fill = SolidColor(if (sorted?.moving == true && LocalSticky.current == null) tint.compositeOver(t.card.color(0.8f)) else tint),
                border = SolidColor(border ?: t.tint.color(0.045f)),
                sides = Sides.Bottom,
                shadows = buildList {
                    if (sticky) add(startEdge())
                    // Picked up: a line along its top and bottom.
                    if (sorted?.lifted == true) {
                        add(Shadow(y = 2f, color = t.primary.color(0.6f), inset = true))
                        add(Shadow(y = -2f, color = t.primary.color(0.6f), inset = true))
                    }
                },
            )
            .padding(padding),
        contentAlignment = if (numeric) Alignment.CenterEnd else Alignment.CenterStart,
    ) {
        if (numeric) ProvideText(style = TextStyles.tabular) { content() } else content()
    }
}

/** A cell's padding, px-3 py-2.5. */
val CellPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp)

/** A footer cell: on the card, above a hairline, in medium weight. Use inside TableFooter. */
@Composable
fun TableFooterCell(
    modifier: Modifier = Modifier,
    width: Dp? = null,
    numeric: Boolean = false,
    sticky: Boolean = false,
    content: @Composable BoxScope.() -> Unit,
) {
    val row = LocalRow.current ?: error("TableFooterCell must be inside TableRow")
    val part = LocalPart.current
    val t = Zen.tokens
    Box(
        modifier
            .then(CellData(row, part, width, sticky, span = false))
            .sticky(part, sticky, row)
            .height(36.dp)
            .box(
                RectangleShape,
                border = SolidColor(t.tint.color(0.07f)),
                sides = Sides.Top,
                shadows = if (sticky) listOf(startEdge()) else emptyList(),
            )
            .padding(horizontal = 12.dp),
        contentAlignment = if (numeric) Alignment.CenterEnd else Alignment.CenterStart,
    ) {
        ProvideText(style = if (numeric) TextStyles.medium.merge(TextStyles.tabular) else TextStyles.medium) { content() }
    }
}

/** One row spanning the table, for "nothing here" messages (Messages.nothingHere unless `content` says otherwise). */
@Composable
fun TableEmpty(content: (@Composable () -> Unit)? = null) {
    TableRow {
        val row = LocalRow.current!!
        Box(
            Modifier
                .then(CellData(row, LocalPart.current, null, start = false, span = true))
                .padding(horizontal = 12.dp, vertical = 32.dp),
            contentAlignment = Alignment.Center,
        ) {
            ProvideText(color = Zen.tokens.mutedForeground.color()) {
                if (content != null) content() else Text(LocalMessages.current.nothingHere, align = TextAlign.Center)
            }
        }
    }
}

/**
 * Sorting for a table: `toggle(key)` (a heading's onSort) sorts by that column, again reverses it,
 * a third time clears it; `direction(key)` is the heading's sortDirection; `rows` are in that order.
 */
@Stable
class TableSort<T, K> internal constructor(private val compare: Map<K, Comparator<T>>, initial: Pair<K, SortDirection>?) {
    var sort by mutableStateOf(initial)
    internal var source: List<T> = emptyList()

    val rows: List<T>
        get() {
            val (key, direction) = sort ?: return source
            val out = source.sortedWith(compare.getValue(key))
            return if (direction == SortDirection.Desc) out.reversed() else out
        }

    fun direction(key: K): SortDirection? = sort?.takeIf { it.first == key }?.second

    fun toggle(key: K) {
        val s = sort
        sort = when {
            s?.first != key -> key to SortDirection.Asc
            s.second == SortDirection.Asc -> key to SortDirection.Desc
            else -> null
        }
    }
}

/** Remembers a TableSort over `rows`, by the comparators in `compare`. */
@Composable
fun <T, K> rememberTableSort(rows: List<T>, compare: Map<K, Comparator<T>>, initial: Pair<K, SortDirection>? = null): TableSort<T, K> {
    val sort = remember { TableSort(compare, initial) }
    sort.source = rows
    return sort
}
