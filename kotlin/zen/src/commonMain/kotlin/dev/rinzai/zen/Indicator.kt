package dev.rinzai.zen

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.AnimationVector1D
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/**
 * Where the active item of a track is, for an indicator that travels to it (Pills, Tabs,
 * Segmented): in place where it first appears, then each edge going on its own, the one toward the
 * new item first ([lead]) and the far one a beat after ([trail]), so the indicator stretches across
 * and catches up (theme.css's .zen__indicator).
 */
@Stable
internal class Indicator(private val scope: CoroutineScope) {
    lateinit var lead: AnimationSpec<Float>
    lateinit var trail: AnimationSpec<Float>
    private var track: LayoutCoordinates? = null
    private var item: LayoutCoordinates? = null
    internal var owner: Any? by mutableStateOf(null)
    private var edges: List<Animatable<Float, AnimationVector1D>>? by mutableStateOf(null)

    /** Drawn with no item active: one that's active next starts in place rather than sliding from the last. */
    internal var absent = true

    /** The indicator's box in the track, or null while no item is active. */
    val rect: Rect?
        get() = if (owner == null) null else edges?.let { (l, t, r, b) -> Rect(l.value, t.value, r.value, b.value) }

    fun track(coordinates: LayoutCoordinates) {
        track = coordinates
        measure()
    }

    fun item(owner: Any, coordinates: LayoutCoordinates) {
        this.owner = owner
        item = coordinates
        measure()
    }

    fun leave(owner: Any) {
        if (this.owner !== owner) return
        this.owner = null
        item = null
    }

    private fun measure() {
        val track = track?.takeIf { it.isAttached } ?: return
        val item = item?.takeIf { it.isAttached } ?: return
        val to = track.localBoundingBoxOf(item, clipBounds = false)
        val at = edges
        if (at == null || absent) {
            edges = listOf(to.left, to.top, to.right, to.bottom).map { Animatable(it) }
            absent = false
            return
        }
        val (l, t, r, b) = at
        val end = to.left > l.targetValue
        val down = to.top > t.targetValue
        fun go(edge: Animatable<Float, AnimationVector1D>, value: Float, leads: Boolean) {
            if (edge.targetValue != value) scope.launch { edge.animateTo(value, if (leads) lead else trail) }
        }
        go(l, to.left, !end)
        go(r, to.right, end)
        go(t, to.top, !down)
        go(b, to.bottom, down)
    }
}

/** An indicator travelling on Zen's spring, its far edge [TRAIL] ms behind. */
@Composable
internal fun rememberIndicator(): Indicator {
    val scope = rememberCoroutineScope()
    val lead = transition<Float>(Spring.Shape)
    val trail = transition<Float>(Spring.Shape, delay = TRAIL)
    return remember { Indicator(scope) }.also {
        it.lead = lead
        it.trail = trail
    }
}

/** How far (ms) an indicator's far edge follows its near one: theme.css's .zen__indicator. */
private const val TRAIL = 70

/** The track an Indicator slides in: `draw` paints it at its box, behind the track's content. */
internal fun Modifier.indicatorTrack(indicator: Indicator, draw: DrawScope.(Rect) -> Unit): Modifier = this
    .onGloballyPositioned(indicator::track)
    .drawBehind {
        val rect = indicator.rect
        // Another item takes over in the same frame the last lets go; only a frame drawn without one is a gap.
        if (rect == null) indicator.absent = true else draw(rect)
    }

/** An item of the track: while `active`, the indicator goes to it. */
@Composable
internal fun Modifier.indicatorItem(indicator: Indicator, active: Boolean): Modifier {
    val owner = remember { Any() }
    DisposableEffect(indicator, active) {
        onDispose { indicator.leave(owner) }
    }
    return if (active) onGloballyPositioned { indicator.item(owner, it) } else this
}
