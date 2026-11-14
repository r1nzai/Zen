package dev.rinzai.zen

import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.foundation.gestures.BringIntoViewSpec
import kotlin.math.max
import kotlin.math.min

/**
 * How a scroll container brings what takes focus into view, as a browser's focus() does
 * (Blink's "center if needed"): along each axis, nothing if it's in view (or bigger than the
 * view), its nearest edge in if it's partly in view, and centred if it's out of view. At once,
 * as browsers scroll for focus without `scroll-behavior: smooth`.
 */
internal object FocusScroll : BringIntoViewSpec {
    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override val scrollAnimationSpec: AnimationSpec<Float> = snap()

    override fun calculateScrollDistance(offset: Float, size: Float, containerSize: Float): Float {
        val end = offset + size
        val shown = min(end, containerSize) - max(offset, 0f)
        return when {
            shown >= size || shown >= containerSize -> 0f
            // The nearest edge is the far one when it's past the far side and fits, or when it's bigger and short of it.
            shown > 0f -> if ((end > containerSize && size < containerSize) || (end < containerSize && size > containerSize)) end - containerSize else offset
            else -> offset + size / 2 - containerSize / 2
        }
    }
}
