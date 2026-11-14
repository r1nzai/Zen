package dev.rinzai.zen

import androidx.compose.ui.unit.dp
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.ScrollState
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.hypot

/** How far (in px a millisecond) a finger must flick a sheet to send it away, however short the swipe. */
internal const val FLICK_SPEED = 0.5f
private const val FLICK_WINDOW = 100L
private const val SLOP = 8f
/** A swipe this far (px), or a flick, closes a sheet: the same reach on a phone as on a desk. */
private val SWIPE_COMMIT = 80.dp
/** How far (px) a sheet stretches at most when pulled past where it rests. */
private val RUBBER = 64.dp

/** The way a sheet goes when swiped off: down, or out to its side. */
enum class SheetSide { Bottom, Left, Right }

/**
 * A sheet being swiped: how far it's been pulled out (rubber-banded the wrong way) and how far
 * that is of its size, which the scrim fades by.
 */
@Stable
class SheetSwipe internal constructor() {
    var pulled by mutableFloatStateOf(0f)
        internal set
    var progress by mutableFloatStateOf(0f)
        internal set
    var swiping by mutableStateOf(false)
        internal set

    /** Settling back after a swipe that didn't go far enough. */
    internal val back = Animatable(0f)

    /** Where it is now, pulled or settling back. */
    internal val offset: Float get() = pulled + back.value

    internal fun reset() {
        pulled = 0f
        progress = 0f
    }
}

/**
 * Swipes a sheet away with a finger, as a phone's sheets go: pulled toward `side` it follows (and
 * stretches only a little the other way); let go past 80px, or flicked, it closes, else it springs
 * back. A light tap as it passes that point. A swipe that starts in a field, or where `scroll` can
 * still scroll back, is the content's.
 */
internal fun Modifier.sheetSwipe(
    swipe: SheetSwipe,
    side: SheetSide?,
    rtl: Boolean,
    scroll: ScrollState?,
    haptics: HapticFeedback,
    settle: suspend (Animatable<Float, *>) -> Unit,
    onClose: () -> Unit,
): Modifier = if (side == null) this else pointerInput(swipe, side, rtl) {
    val vertical = side == SheetSide.Bottom
    val sign = if (side == SheetSide.Left) -1f else 1f
    val after = this
    kotlinx.coroutines.coroutineScope { val tasks = this; after.awaitPointerEventScope {
        while (true) {
            val down = awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull { it.pressed && !it.previousPressed } ?: continue
            if (down.type != PointerType.Touch) continue
            var start = down.position
            var on = false
            var past = false
            val points = ArrayDeque<Pair<Long, Float>>().apply { add(down.uptimeMillis to 0f) }
            var d = 0f
            fun along(p: Offset) = (if (vertical) p.y - start.y else p.x - start.x) * sign
            fun across(p: Offset) = if (vertical) p.x - start.x else p.y - start.y
            var released = false
            var time = down.uptimeMillis
            while (true) {
                val e = awaitPointerEvent(PointerEventPass.Initial)
                val c = e.changes.firstOrNull { it.id == down.id } ?: break
                d = along(c.position)
                time = c.uptimeMillis
                if (!c.pressed) { released = true; if (on) c.consume(); break }
                if (!on) {
                    if (hypot(d, across(c.position)) < SLOP) continue
                    if (d <= 0f || abs(across(c.position)) * 1.5f > d || (scroll != null && scroll.value > 0)) break
                    on = true
                    swipe.swiping = true
                    // Measured from here on, where it became a swipe, so what follows the finger doesn't jump the slop.
                    start = c.position
                    d = 0f
                    points.clear()
                }
                c.consume()
                points.add(time to d)
                while (points.isNotEmpty() && time - points.first().first >= FLICK_WINDOW) points.removeFirst()
                swipe.pulled = if (d > 0) d else RUBBER.toPx().let { r -> -(r * -d) / (r - d) }
                val size = (if (vertical) this@pointerInput.size.height else this@pointerInput.size.width).toFloat()
                swipe.progress = (d / size).coerceIn(0f, 1f)
                if ((d > SWIPE_COMMIT.toPx()) != past) {
                    past = !past
                    haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                }
            }
            if (!on) continue
            swipe.swiping = false
            val size = (if (vertical) size.height else size.width).toFloat()
            val (t0, d0) = points.firstOrNull() ?: (time to d)
            val speed = (d - d0) / maxOf(1L, time - t0)
            // Closing, it goes on from where the finger left it (the sheet resets it as it next opens).
            if (released && (d > SWIPE_COMMIT.toPx() || (d > 0 && speed > FLICK_SPEED))) {
                onClose()
            } else {
                swipe.progress = 0f
                val from = swipe.pulled
                swipe.pulled = 0f
                tasks.launch {
                    swipe.back.snapTo(from)
                    settle(swipe.back)
                }
            }
        }
    } }
}

/**
 * A sheet coming in from its edge and going back: `slide` from 1 (off at its edge) to 0 over 320ms,
 * `shown` (its opacity) over 200ms, from wherever a swipe left it. Mounted while it's open or still
 * going.
 */
@Stable
internal class SheetMotion {
    val slide = Animatable(1f)
    val shown = Animatable(0f)
    val swipe = SheetSwipe()
    var mounted by mutableStateOf(false)
        private set

    /** How far toward its edge it is, for a sheet `size` px along the way it goes. */
    fun offset(size: Float): Float = swipe.offset + (size - swipe.offset) * slide.value

    internal suspend fun run(open: Boolean, reduced: Boolean) {
        if (open) {
            swipe.reset()
            swipe.back.snapTo(0f)
            mounted = true
        }
        val to = if (open) 0f else 1f
        if (reduced) {
            slide.snapTo(to)
            shown.snapTo(1f - to)
        } else coroutineScope {
            launch { slide.animateTo(to, tween(320, easing = Ease.Sheet)) }
            launch { shown.animateTo(1f - to, tween(200, easing = Ease.Css)) }
        }
        if (!open) {
            mounted = false
            swipe.reset()
        }
    }
}

/** A sheet's motion, run as `open` changes; it holds the page still while it's open. */
@Composable
internal fun rememberSheetMotion(open: Boolean): SheetMotion {
    val motion = remember { SheetMotion() }
    val reduced = reducedMotion()
    LaunchedEffect(open) { motion.run(open, reduced) }
    if (open) LockPage()
    return motion
}

/** What a touchSwipe tells as it goes: how far along (`move`), let go (with its speed, px/ms), or interrupted. */
internal class SwipeHandlers(
    val move: (d: Float) -> Unit,
    val release: (d: Float, speed: Float) -> Unit,
    val cancel: () -> Unit,
    /** How far along letting go would act; crossing it, either way, gives a light tap. */
    val threshold: (() -> Float)? = null,
)

/**
 * A finger swiping this along an axis, `sign` 1 for right or down, -1 for left or up: only a
 * deliberate swipe, one finger, mostly along the way, and not while something under it can still
 * scroll that way (`scrollsFirst`). Once it's a swipe it's this one's: what's under the finger
 * isn't scrolled, and the tap that ends it isn't a click.
 */
internal fun Modifier.touchSwipe(
    key: Any?,
    horizontal: Boolean,
    sign: () -> Float,
    scrollsFirst: () -> Boolean,
    haptics: HapticFeedback,
    handlers: () -> SwipeHandlers,
    swiping: (Boolean) -> Unit = {},
): Modifier = pointerInput(key, horizontal) {
    awaitPointerEventScope {
        while (true) {
            val down = awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull { it.pressed && !it.previousPressed } ?: continue
            if (down.type != PointerType.Touch) continue
            var start = down.position
            val s = sign()
            var on = false
            var past = false
            val points = ArrayDeque<Pair<Long, Float>>().apply { add(down.uptimeMillis to 0f) }
            var d = 0f
            var time = down.uptimeMillis
            var released = false
            fun along(p: Offset) = (if (horizontal) p.x - start.x else p.y - start.y) * s
            fun across(p: Offset) = if (horizontal) p.y - start.y else p.x - start.x
            while (true) {
                val e = awaitPointerEvent(PointerEventPass.Initial)
                // A second finger (a pinch): not a swipe after all.
                if (e.changes.count { it.pressed } > 1) break
                val c = e.changes.firstOrNull { it.id == down.id } ?: break
                d = along(c.position)
                time = c.uptimeMillis
                if (!c.pressed) {
                    released = true
                    if (on) c.consume()
                    break
                }
                if (!on) {
                    if (hypot(d, across(c.position)) < SLOP) continue
                    if (d <= 0f || abs(across(c.position)) * 1.5f > d || scrollsFirst()) break
                    on = true
                    swiping(true)
                    start = c.position
                    d = 0f
                    points.clear()
                }
                c.consume()
                points.add(time to d)
                while (points.isNotEmpty() && time - points.first().first >= FLICK_WINDOW) points.removeFirst()
                val h = handlers()
                h.move(d)
                val at = h.threshold?.invoke()
                if (at != null && (d > at) != past) {
                    past = !past
                    haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                }
            }
            if (!on) continue
            swiping(false)
            val (t0, d0) = points.firstOrNull() ?: (time to d)
            if (released) handlers().release(d, (d - d0) / maxOf(1L, time - t0)) else handlers().cancel()
        }
    }
}
