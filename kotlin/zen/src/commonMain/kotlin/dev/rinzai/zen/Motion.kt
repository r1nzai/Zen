package dev.rinzai.zen

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.lerp
import androidx.compose.ui.geometry.Offset
import androidx.compose.runtime.withFrameNanos
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.State
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.Stable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.sin
import kotlin.math.sqrt

/** The timing functions Zen's CSS uses. */
object Ease {
    /** Tailwind's default for transition-* utilities. */
    val Standard: Easing = CubicBezierEasing(0.4f, 0f, 0.2f, 1f)

    /** Tailwind's ease-out. */
    val Out: Easing = CubicBezierEasing(0f, 0f, 0.2f, 1f)

    /** CSS's `ease`, for a transition that names none. */
    val Css: Easing = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f)

    /** CSS's `ease-in` keyword (not Tailwind's). */
    val CssIn: Easing = CubicBezierEasing(0.42f, 0f, 1f, 1f)

    /** CSS's `ease-in-out` keyword (not Tailwind's), as a smooth scroll eases too. */
    val CssInOut: Easing = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

    /** CSS's `ease-out` keyword (not Tailwind's). */
    val CssOut: Easing = CubicBezierEasing(0f, 0f, 0.58f, 1f)

    /** --ease-out-soft: quick off the mark, a long soft landing. */
    val OutSoft: Easing = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)

    /** --ease-sheet: a sheet sliding to or from its edge. */
    val Sheet: Easing = CubicBezierEasing(0.32f, 0.72f, 0f, 1f)

    /** --ease-overshoot: runs a little past its mark and settles back. */
    val Overshoot: Easing = CubicBezierEasing(0.24f, 1.34f, 0.38f, 1f)

    val Linear: Easing = LinearEasing
}

/**
 * A damped spring (mass 1) settling from 0 to 1, as an easing run for [ms], the time it takes to
 * settle: theme.css's --ease-spring* and --duration-spring*, computed alike.
 */
@Stable
class Spring internal constructor(stiffness: Float, damping: Float, val ms: Int) : Easing {
    private val w = sqrt(stiffness)
    private val z = damping / (2 * w)
    private val wd = w * sqrt(1 - z * z)

    override fun transform(fraction: Float): Float {
        if (fraction >= 1f) return 1f
        val t = fraction * ms / 1000f
        return 1 - exp(-z * w * t) * (cos(wd * t) + (z * w / wd) * sin(wd * t))
    }

    companion object {
        /** 380/34: travels and settles, the slightest give. Indicators, positions, stacks moving up. */
        val Shape = Spring(380f, 34f, 450)

        /** 500/18: a pop past its size and a jiggle back. Checks, likes, a chosen thing landing. */
        val Pop = Spring(500f, 18f, 770)

        /** 320/30: a stack fanning out or closing up. */
        val Stack = Spring(320f, 30f, 490)
    }
}

/** A transition on one of Zen's springs: [transition] for its length and curve. */
@Composable
fun <T> transition(spring: Spring, delay: Int = 0): AnimationSpec<T> = transition(spring.ms, spring, delay)

/**
 * A CSS transition: `ms` long, eased, after `delay`; instant with reduced motion (the OS setting),
 * as theme.css shortens every Zen transition then, and while the theme changes.
 */
@Composable
fun <T> transition(ms: Int, easing: Easing = Ease.Standard, delay: Int = 0): AnimationSpec<T> =
    if (reducedMotion() || LocalThemeWave.current.applying) snap() else tween(ms, delay, easing)

/**
 * `target`, followed as a CSS transition follows a changing value: each change eases from where it
 * is to the new target over `ms`, timed from the frame it changed in. A target changing every frame
 * (a tooltip following the pointer) still moves, where an animation restarted on each change would
 * spend its first frame standing and keep the value still until the changes stop. Instant with
 * reduced motion, as [transition] is.
 */
@Composable
internal fun followed(target: Offset, ms: Int, easing: Easing = Ease.Standard): State<Offset> {
    val f = remember { Follow(target) }
    if (reducedMotion() || LocalThemeWave.current.applying) {
        f.moving = false
        f.to = target
        f.shown.value = target
    } else if (target != f.to) {
        f.from = f.shown.value
        f.to = target
        // Already moving, it counts from the last frame, as the change was made then.
        f.start = if (f.moving) f.last else -1L
        f.moving = true
    }
    LaunchedEffect(f) {
        snapshotFlow { f.moving }.collect { moving ->
            while (moving && f.moving) withFrameNanos { now ->
                if (f.start < 0) f.start = now
                f.last = now
                val p = ((now - f.start) / (ms * 1_000_000f)).coerceIn(0f, 1f)
                f.shown.value = lerp(f.from, f.to, easing.transform(p))
                if (p >= 1f) f.moving = false
            }
        }
    }
    return f.shown
}

private class Follow(start: Offset) {
    val shown = mutableStateOf(start)
    var from = start
    var to = start
    var start = -1L
    var last = -1L
    var moving by mutableStateOf(false)
}

/**
 * .rise (and .rise-list): children enter one after another, rising 8px as they fade in. `index`
 * is the child's place (from 0); `list` uses the quicker steps a list's rows take (past the twelfth,
 * rows just appear).
 */
@Composable
fun Modifier.rise(index: Int, list: Boolean = false): Modifier {
    val reduced = reducedMotion()
    val (duration, delay) = if (list) 450 to minOf(index, 11) * 35 else 500 to minOf(index, 4) * 50
    val skip = reduced || (list && index >= 12)
    val progress = remember { Animatable(if (skip) 1f else 0f) }
    LaunchedEffect(Unit) { if (!skip) progress.animateTo(1f, tween(duration, delay, Ease.OutSoft)) }
    return graphicsLayer {
        val p = progress.value
        alpha = p
        translationY = (1f - p) * 8.dp.toPx()
    }
}

/** Whether a part has been on screen (useSeen): it stays true once it has. */
@Stable
internal class Seen {
    var seen by mutableStateOf(false)
}

@Composable
internal fun rememberSeen() = remember { Seen() }

/** Marks `s` seen once any of this is on screen, as an IntersectionObserver would. */
internal fun Modifier.seen(s: Seen): Modifier =
    if (s.seen) this else onGloballyPositioned { if (!it.boundsInWindow().isEmpty) s.seen = true }
