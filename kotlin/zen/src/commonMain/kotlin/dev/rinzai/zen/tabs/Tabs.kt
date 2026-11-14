package dev.rinzai.zen.tabs

import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Indicator
import dev.rinzai.zen.LocalRoving
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Sides
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.indicatorItem
import dev.rinzai.zen.indicatorTrack
import dev.rinzai.zen.inert
import dev.rinzai.zen.outline
import dev.rinzai.zen.pills.LocalPills
import dev.rinzai.zen.pills.PillItem
import dev.rinzai.zen.pills.Pills
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberIndicator
import dev.rinzai.zen.rememberRoving
import dev.rinzai.zen.rovingItem
import dev.rinzai.zen.transition
import kotlin.math.max
import kotlin.math.min

/** The tab shown: kept by Tabs itself, for when you don't keep it. */
@Stable
class TabsState(value: String) {
    var value by mutableStateOf(value)
}

@Composable
fun rememberTabsState(value: String) = remember { TabsState(value) }

/** Switching from one panel to another: the picked one slides in from its tab's side as the last slides out. */
private class Slide(val from: String, val to: String, val sign: Float, val hasLast: Boolean) {
    val progress = Animatable(0f)
    var done by mutableStateOf(false)
    var fromHeight by mutableFloatStateOf(0f)
    var toHeight by mutableFloatStateOf(0f)
}

@Stable
private class TabsModel {
    var value by mutableStateOf("")
    var select: (String) -> Unit = {}
    val tabs = mutableMapOf<String, LayoutCoordinates>()
    val panels = mutableSetOf<String>()
    var slide by mutableStateOf<Slide?>(null)
}

private val LocalTabs = staticCompositionLocalOf<TabsModel?> { null }

@Composable
private fun tabs(component: String) = LocalTabs.current ?: error("$component must be inside Tabs")

private val SlideEasing = CubicBezierEasing(0.33f, 1f, 0.68f, 1f)

private enum class Part { Active, Leaving }

/** Tab set: a TabList of Tabs, and a TabPanel for each, `value` naming the one shown; `gap` between them. */
@Composable
fun Tabs(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier, gap: Dp = 16.dp, content: @Composable () -> Unit) {
    val model = remember { TabsModel() }
    model.value = value
    model.select = onValueChange
    val reduced = reducedMotion()
    val last = remember { arrayOf(value) }
    // Made as the new value is composed, so its first frame is the slide's first.
    val slide = remember(value) {
        val from = last[0]
        val a = model.tabs[from]?.takeIf { it.isAttached }
        val b = model.tabs[value]?.takeIf { it.isAttached }
        if (from == value || reduced || a == null || b == null || value !in model.panels) null
        // From the right when the new tab is further along (to the left, right to left).
        else Slide(from, value, if (b.positionInRoot().x > a.positionInRoot().x) 1f else -1f, hasLast = from in model.panels)
    }
    model.slide = slide
    SideEffect { last[0] = value }
    LaunchedEffect(slide) {
        slide ?: return@LaunchedEffect
        slide.progress.animateTo(1f, tween(300, easing = SlideEasing))
        slide.done = true
    }
    CompositionLocalProvider(LocalTabs provides model) {
        Layout(content, modifier) { measurables, constraints ->
            // A column as wide as its widest part; the last panel, sliding out, lies over the new one.
            val gap = gap.roundToPx()
            val width = if (constraints.hasFixedWidth) constraints.maxWidth
            else measurables.maxOfOrNull { it.maxIntrinsicWidth(Constraints.Infinity) }?.let { constraints.constrainWidth(it) } ?: constraints.minWidth
            val placeables = measurables.map { it.layoutId to it.measure(Constraints(maxWidth = width)) }
            val flow = placeables.filter { it.first != Part.Leaving }
            val height = flow.sumOf { it.second.height } + gap * max(0, flow.size - 1)
            layout(width, constraints.constrainHeight(height)) {
                var y = 0
                var panelAt = 0
                for ((id, p) in flow) {
                    if (id == Part.Active) panelAt = y
                    p.place(0, y)
                    y += p.height + gap
                }
                placeables.filter { it.first == Part.Leaving }.forEach { it.second.place(0, panelAt, zIndex = 1f) }
            }
        }
    }
}

/** Tabs that keep which tab is shown themselves, starting at `state`'s. */
@Composable
fun Tabs(state: TabsState, modifier: Modifier = Modifier, gap: Dp = 16.dp, content: @Composable () -> Unit) =
    Tabs(state.value, { state.value = it }, modifier, gap, content)

enum class TabListVariant { Underline, Pills }

private val LocalVariant = staticCompositionLocalOf { TabListVariant.Underline }

/**
 * The row of tabs. `Underline` (the default): in-page tabs, a bar sliding under the active tab.
 * `Pills`: the Pills look, a glowing pill sliding along a glass track (for navigation between
 * pages, use Pills itself). ←→ move between tabs and show them, Home and End jump to the ends.
 */
@Composable
fun TabList(modifier: Modifier = Modifier, variant: TabListVariant = TabListVariant.Underline, content: @Composable RowScope.() -> Unit) {
    tabs("TabList")
    val roving = rememberRoving(Orientation.Horizontal, selects = true)
    CompositionLocalProvider(LocalVariant provides variant, LocalRoving provides roving) {
        if (variant == TabListVariant.Pills) Pills(modifier, content = content)
        else UnderlineTrack(modifier, content)
    }
}

private val LocalUnderline = staticCompositionLocalOf<Indicator?> { null }

/** A row with a bar that slides under the active tab. */
@Composable
private fun UnderlineTrack(modifier: Modifier, content: @Composable RowScope.() -> Unit) {
    val t = Zen.tokens
    val bar = rememberIndicator()
    val primary = t.primary.color()
    Row(
        modifier
            .fillMaxWidth()
            .box(RectangleShape, border = SolidColor(t.border.color()), sides = Sides(bottom = 1.dp))
            .indicatorTrack(bar) { at ->
                // h-0.5 at bottom: -1px, over the track's border.
                val h = 2.dp.toPx()
                drawRect(primary, at.topLeft.copy(y = size.height + 1.dp.toPx() - h), at.size.copy(height = h))
            },
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        CompositionLocalProvider(LocalUnderline provides bar) { content() }
    }
}

/** One tab: what it shows, its panel the TabPanel of the same `value`. */
@Composable
fun Tab(value: String, modifier: Modifier = Modifier, enabled: Boolean = true, content: @Composable () -> Unit) {
    val model = tabs("Tab")
    val active = model.value == value
    val select = { model.select(value) }
    val own = modifier
        .onGloballyPositioned { model.tabs[value] = it }
        .rovingItem(enabled, preferred = active, select = select)
    DisposableEffect(value) { onDispose { model.tabs -= value } }
    if (LocalVariant.current == TabListVariant.Pills) {
        PillItem(LocalPills.current!!, active, own, Role.Tab, enabled, select, content)
        return
    }
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val ink = if (active || (state.hovered && enabled)) t.foreground.color() else t.mutedForeground.color()
    Row(
        own
            .indicatorItem(LocalUnderline.current!!, active)
            .box(RectangleShape, shadows = focusRing(state.focusVisible))
            .control(state, enabled, Role.Tab, notAllowed = true, onClick = select)
            .semantics { selected = active }
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        ProvideText(ink, TextStyles.sm) { content() }
    }
}

/**
 * The panel the Tab of the same `value` shows, there only while its tab is: focusable, so the
 * keyboard reaches what's in it. Switching tabs, it slides in from its tab's side.
 */
@Composable
fun TabPanel(
    value: String,
    modifier: Modifier = Modifier,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit,
) {
    val model = tabs("TabPanel")
    DisposableEffect(value) {
        model.panels += value
        onDispose { model.panels -= value }
    }
    val slide = model.slide?.takeIf { !it.done }
    val active = model.value == value
    val leaving = !active && slide?.from == value
    if (!active && !leaving) return
    val t = Zen.tokens
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val ring = focused && Zen.page.keyboard && !leaving
    Column(
        modifier
            .fillMaxWidth()
            .layoutId(if (leaving) Part.Leaving else Part.Active)
            .onSizeChanged { size ->
                when (value) {
                    slide?.from -> slide.fromHeight = size.height.toFloat()
                    slide?.to -> slide.toHeight = size.height.toFloat()
                }
            }
            .then(if (slide != null) Modifier.slide(slide, leaving) else Modifier)
            .outline(RectangleShape, if (ring) t.ring.color(0.5f) else Color.Transparent, 2.dp, 4.dp)
            .inert(leaving)
            .activeElement()
            .focusable(!leaving, source),
        verticalArrangement = verticalArrangement,
    ) {
        content()
    }
}

/**
 * The panel coming in or (`out`) going: across by a quarter of its width (at most 208px), fading,
 * both clipped to a window that eases from the last panel's height to the new one's. Clipped
 * rather than resized, so what's below moves at once and isn't laid out again on every frame.
 */
private fun Modifier.slide(slide: Slide, out: Boolean): Modifier = this
    .graphicsLayer {
        val v = slide.progress.value
        val d = min(size.width * 0.25f, 208.dp.toPx())
        translationX = slide.sign * d * if (out) -v else 1 - v
        alpha = if (out) 1 - v else v
    }
    .drawWithContent {
        val v = slide.progress.value
        val d = min(size.width * 0.25f, 208.dp.toPx())
        val (side, bottom) = if (out) d * v to max(0f, slide.fromHeight - slide.toHeight) * v
        else d * (1 - v) to (if (slide.hasLast) max(0f, slide.toHeight - slide.fromHeight) else 0f) * (1 - v)
        // In, the side it comes from is cut; out, the side it leaves by.
        val cutsRight = (slide.sign > 0) != out
        clipRect(
            left = if (cutsRight) 0f else side,
            right = size.width - if (cutsRight) side else 0f,
            bottom = size.height - bottom,
        ) { this@drawWithContent.drawContent() }
    }
