package dev.rinzai.zen.carousel

import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.calculateTargetValue
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.rememberSplineBasedDecay
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.FlingBehavior
import androidx.compose.foundation.gestures.ScrollScope
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.unit.Density
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.unit.Constraints
import kotlin.math.roundToInt
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.fullWidthLaidOut
import dev.rinzai.zen.glass
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.ring
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.transition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.gestures.BringIntoViewSpec
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.runtime.CompositionLocalProvider
import dev.rinzai.zen.FocusScroll
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.sqrt

/** Chrome's smooth scroll: an ease-in-out over √distance frames at 60fps, at most 12 (200ms). */
private val SMOOTH = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

private fun smoothMs(distance: Float) = (min(sqrt(abs(distance)), 12f) / 60f * 1000f).toInt()

/** Where a carousel is: the slide at the start edge, and where it can scroll to. */
@Stable
class CarouselState internal constructor() {
    internal val scroll = ScrollState(0)
    internal var scope: CoroutineScope? = null
    internal var reduced = false

    /** Each slide's start, from the first's, along the scroll. */
    internal val starts = mutableStateListOf<Float>()

    /** How many slides there are. */
    val count get() = starts.size

    /** How many slides can be at the start edge: the last few may already be in view. */
    val stops by derivedStateOf {
        val max = scroll.maxValue
        // A stop at each slide that starts before the end, and the end itself: where the slides
        // don't fill the view evenly, that's short of the next slide's start.
        starts.count { it < max - 1 } + 1
    }

    internal fun stopAt(i: Int) = min(starts.getOrElse(i) { 0f }, scroll.maxValue.toFloat())

    internal fun nearest(at: Float): Int {
        var index = 0
        for (i in 0 until min(stops, count)) if (abs(stopAt(i) - at) < abs(stopAt(index) - at)) index = i
        return index
    }

    /** The slide at the start edge (scrolled to the end, the last stop, even if it isn't there). */
    val index by derivedStateOf {
        val max = scroll.maxValue
        if (max > 0 && scroll.value >= max - 1) stops - 1 else nearest(scroll.value.toFloat())
    }

    /** Scrolls smoothly to the stop of slide `index`. */
    fun scrollTo(index: Int) {
        if (index !in 0 until count) return
        scope?.launch { glide(stopAt(index)) }
    }

    internal suspend fun glide(to: Float) {
        val from = scroll.value.toFloat()
        if (reduced) scroll.scrollTo(to.toInt()) else scroll.animateScrollTo(to.toInt(), tween(smoothMs(to - from), easing = SMOOTH))
    }
}

@Composable
fun rememberCarouselState(): CarouselState = remember { CarouselState() }

private val LocalCarousel = compositionLocalOf<CarouselState?> { null }

private fun carousel(part: String, state: CarouselState?) = state ?: error("$part must be inside Carousel")

/**
 * Slides in a row that scrolls sideways and snaps to each one: swipe, scroll, use the arrow keys
 * once it has focus, or the CarouselPrevious and CarouselNext buttons. Put a CarouselContent of
 * CarouselItems inside, then a CarouselControls of the buttons and CarouselDots if you want them.
 * A slide is as wide as the carousel unless you size it (`basis = width / 3` for three in view).
 * Name it with `label`, as the heading over it does.
 */
@Composable
fun Carousel(
    modifier: Modifier = Modifier,
    state: CarouselState = rememberCarouselState(),
    label: String? = null,
    content: @Composable () -> Unit,
) {
    state.scope = rememberCoroutineScope()
    state.reduced = reducedMotion()
    CompositionLocalProvider(LocalCarousel provides state) {
        // A block: what's in it stacked, each part as wide as it (the controls' row spans it).
        Layout(content, modifier.semantics { if (label != null) contentDescription = label }) { measurables, constraints ->
            val width = if (constraints.hasBoundedWidth) constraints.maxWidth
            else measurables.maxOfOrNull { it.maxIntrinsicWidth(constraints.maxHeight) } ?: 0
            val parts = measurables.map { it.measure(Constraints(minWidth = width, maxWidth = width, maxHeight = constraints.maxHeight)) }
            layout(width, constraints.constrainHeight(parts.sumOf { it.height })) {
                var y = 0
                for (p in parts) {
                    p.placeRelative(0, y)
                    y += p.height
                }
            }
        }
    }
}

/** What a CarouselContent's slides are laid out in: `width` is the row's, to size slides by. */
class CarouselScope internal constructor(val width: Dp)

/** The scrolling row of slides, `gap` apart. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CarouselContent(
    modifier: Modifier = Modifier,
    gap: Dp = 16.dp,
    content: @Composable CarouselScope.() -> Unit,
) {
    val state = carousel("CarouselContent", LocalCarousel.current)
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val decay = rememberSplineBasedDecay<Float>()
    // A fling lands on the stop nearest where it would have come to rest.
    val fling = remember(state, decay) {
        object : FlingBehavior {
            override suspend fun ScrollScope.performFling(initialVelocity: Float): Float {
                val from = state.scroll.value.toFloat()
                val to = state.stopAt(state.nearest(from + decay.calculateTargetValue(0f, initialVelocity)))
                var last = from
                Animatable(from).animateTo(to, tween(smoothMs(to - from), easing = SMOOTH)) {
                    scrollBy(value - last)
                    last = value
                }
                return 0f
            }
        }
    }
    // Mandatory snapping: a scroll that stops between stops (a wheel, a trackpad) settles on one.
    LaunchedEffect(state) {
        snapshotFlow { state.scroll.isScrollInProgress }.collectLatest { moving ->
            if (moving) return@collectLatest
            delay(100)
            val at = state.scroll.value.toFloat()
            val stop = state.stopAt(state.nearest(at))
            if (abs(stop - at) >= 1f) state.glide(stop)
        }
    }
    val shape = Zen.radii.xl
    BoxWithConstraints(
        modifier
            .fullWidthLaidOut()
            .box(shape, shadows = focusRing(focused && Zen.page.keyboard))
            .clip(shape)
            .activeElement()
            .focusable(interactionSource = source)
            // Focused, the arrow keys scroll it, a slide at a time.
            .onKeyEvent { e ->
                if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                val step = when (e.key) {
                    Key.DirectionRight -> if (rtl) -1 else 1
                    Key.DirectionLeft -> if (rtl) 1 else -1
                    else -> return@onKeyEvent false
                }
                state.scrollTo((state.index + step).coerceIn(0, state.stops - 1))
                true
            }
            .semantics { liveRegion = LiveRegionMode.Polite },
    ) {
        val width = maxWidth
        val snapped = remember(state, rtl) { SnappedFocusScroll(state, rtl) }
        CompositionLocalProvider(LocalBringIntoViewSpec provides snapped) {
            Layout(
                // What's in the slides scrolls its own way.
                content = { CompositionLocalProvider(LocalBringIntoViewSpec provides FocusScroll) { CarouselScope(width).content() } },
                modifier = Modifier.horizontalScroll(state.scroll, flingBehavior = fling),
            ) { measurables, constraints ->
                val space = gap.toPx()
                // Each slide's edges rounded from where they fall exactly, as browsers snap boxes to
                // pixels: rounding each width instead would drift the later slides off.
                var x = 0f
                val edges = measurables.map { m ->
                    val basis = (m.parentData as? Basis)?.width?.toPx()
                    val start = x
                    val w = basis ?: m.maxIntrinsicWidth(constraints.maxHeight).toFloat()
                    x += w + space
                    start.roundToInt() to (start + w).roundToInt()
                }
                val slides = measurables.mapIndexed { i, m ->
                    val (start, end) = edges[i]
                    m.measure(Constraints.fixedWidth(end - start).copy(maxHeight = constraints.maxHeight))
                }
                val starts = edges.map { it.first }
                if (state.starts.toList() != starts.map(Int::toFloat)) {
                    state.starts.clear()
                    state.starts.addAll(starts.map(Int::toFloat))
                }
                layout(edges.lastOrNull()?.second ?: 0, slides.maxOfOrNull { it.height } ?: 0) {
                    // placeRelative: in a right-to-left page the first slide is at the right.
                    slides.forEachIndexed { i, p -> p.placeRelative(starts[i], 0) }
                }
            }
        }
    }
}

/**
 * Focus brings a slide into view as a browser does over `scroll-snap-type: x mandatory`: where
 * focus() would scroll to, settled on the nearest stop, in one move (a partly shown slide whose
 * nearest stop is where it is doesn't move at all).
 */
private class SnappedFocusScroll(private val state: CarouselState, rtl: Boolean) : BringIntoViewSpec {
    // The scroll's value runs the other way to the page in a right-to-left one.
    private val sign = if (rtl) -1f else 1f

    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override val scrollAnimationSpec: AnimationSpec<Float> = FocusScroll.scrollAnimationSpec

    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float {
        val at = state.scroll.value.toFloat()
        val to = state.stopAt(state.nearest(at + sign * FocusScroll.calculateScrollDistance(offset, size, containerSize)))
        return sign * (to - at)
    }
}

/** A slide's width, for the row to place it by. */
private class Basis(val width: Dp) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) = this@Basis
}

/** One slide, `basis` wide: it's announced as which of how many. */
@Composable
fun CarouselScope.CarouselItem(
    modifier: Modifier = Modifier,
    basis: Dp = width,
    content: @Composable BoxScope.() -> Unit,
) {
    val state = carousel("CarouselItem", LocalCarousel.current)
    val m = LocalMessages.current
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    var start by remember { mutableIntStateOf(-1) }
    val position = state.starts.indexOf(start.toFloat())
    Box(
        modifier
            .then(Basis(basis))
            .onPlaced { c ->
                // Where it starts along the row, in either reading direction, to find which it is.
                val x = c.positionInParent().x.roundToInt()
                val row = c.parentLayoutCoordinates?.size?.width ?: 0
                start = if (rtl) row - x - c.size.width else x
            }
            .semantics { if (position >= 0) contentDescription = m.slideOf(position + 1, state.count) },
        content = content,
    )
}

/**
 * A round glass button scrolling a slide back or on: gone at the end it can't go past (keeping
 * its place, so the controls don't shift), though still focusable there, faintly shown.
 */
@Composable
private fun Arrow(back: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val state = carousel(if (back) "CarouselPrevious" else "CarouselNext", LocalCarousel.current)
    val m = LocalMessages.current
    val t = Zen.tokens
    val off = if (back) state.index == 0 else state.index >= state.stops - 1
    val control = rememberControlState()
    val opacity by animateFloatAsState(
        when {
            !off -> 1f
            control.focusVisible -> 0.4f
            else -> 0f
        },
        transition(150),
    )
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Box(
        modifier
            .size(36.dp)
            .graphicsLayer { alpha = opacity }
            .glass(CircleShape, blur = true, background = if (control.hovered) t.tint.color(0.08f) else t.tint.color(0f), shadows = focusRing(control.focusVisible).ifEmpty { null })
            .control(control, label = if (back) m.previousSlide else m.nextSlide) {
                onClick()
                if (!off) state.scrollTo(state.index + if (back) -1 else 1)
            }
            .semantics { contentDescription = if (back) m.previousSlide else m.nextSlide },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            if (back) Icons.ChevronLeft else Icons.ChevronRight,
            Modifier.graphicsLayer { if (rtl) scaleX = -1f },
            color = t.foreground.color(),
        )
    }
}

/** Scrolls back one slide; gone at the first. Put it in CarouselControls, under the slides. */
@Composable
fun CarouselPrevious(modifier: Modifier = Modifier, onClick: () -> Unit = {}) = Arrow(true, modifier, onClick)

/** Scrolls on one slide; gone at the last. */
@Composable
fun CarouselNext(modifier: Modifier = Modifier, onClick: () -> Unit = {}) = Arrow(false, modifier, onClick)

/** A dot for each place it can scroll to, the current one drawn out long and lit; each goes there. */
@Composable
fun CarouselDots(modifier: Modifier = Modifier) {
    val state = carousel("CarouselDots", LocalCarousel.current)
    val m = LocalMessages.current
    val t = Zen.tokens
    if (state.stops < 2) return
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterHorizontally)) {
        for (i in 0 until state.stops) {
            val current = i == state.index
            val control = rememberControlState()
            val width by animateDpAsState(if (current) 20.dp else 6.dp, transition(300))
            val fill by animateColorAsState(
                when {
                    current -> t.primary.color()
                    control.hovered -> t.tint.color(0.4f)
                    else -> t.tint.color(0.25f)
                },
                transition(300),
            )
            val glow by animateFloatAsState(if (current) 1f else 0f, transition(300))
            Box(
                Modifier
                    .clip(CircleShape)
                    .control(control, label = m.goToSlide(i + 1)) { state.scrollTo(i) }
                    .semantics { contentDescription = m.goToSlide(i + 1) }
                    .padding(4.dp),
            ) {
                Box(
                    Modifier
                        .width(width)
                        .height(6.dp)
                        .box(
                            CircleShape,
                            fill = SolidColor(fill),
                            shadows = buildList {
                                if (control.focusVisible) add(ring(Zen.tokens.ring.color(0.5f), 2f))
                                if (glow > 0f) add(Shadow(blur = 10f, color = t.glow.color(0.7f * t.glowK * glow)))
                            },
                        ),
                )
            }
        }
    }
}

/**
 * The row under the slides, `margin` below them: CarouselPrevious at the start, CarouselNext at
 * the end, CarouselDots between. Put it beside a heading instead with `margin = 0.dp`.
 */
@Composable
fun CarouselControls(
    modifier: Modifier = Modifier,
    margin: Dp = 12.dp,
    /** Spread apart (the default), or e.g. `Arrangement.spacedBy(12.dp, Alignment.End)` for both buttons together at the end. */
    horizontalArrangement: Arrangement.Horizontal = spaceBetween(12.dp),
    content: @Composable RowScope.() -> Unit,
) {
    Row(
        modifier.padding(top = margin),
        horizontalArrangement = horizontalArrangement,
        verticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}
