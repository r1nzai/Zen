package dev.rinzai.zen.spinner

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.size
import dev.rinzai.zen.LocalContentColor
import dev.rinzai.zen.reducedMotion

/**
 * Small circular spinner in the current text colour (size-4 by default). Decorative unless given a
 * `label`, which screen readers announce (role="status").
 */
@Composable
fun Spinner(modifier: Modifier = Modifier, label: String? = null, size: Dp = 16.dp, stroke: Dp = 2.dp, color: Color = Color.Unspecified) {
    val c = if (color != Color.Unspecified) color else LocalContentColor.current
    // animate-spin; with reduced motion the animation ends at once, as theme.css ends every zen__ one.
    val turn = if (reducedMotion()) 0f else rememberInfiniteTransition().animateFloat(0f, 360f, infiniteRepeatable(tween(1000, easing = LinearEasing), RepeatMode.Restart)).value
    Canvas(
        modifier
            .size(size)
            .semantics {
                if (label != null) {
                    contentDescription = label
                    liveRegion = LiveRegionMode.Polite
                }
            },
    ) {
        val w = stroke.toPx()
        // A round box's border with its top side transparent: the sides meet on the diagonals, so a quarter is missing.
        rotate(turn) {
            drawArc(c, -45f, 270f, false, Offset(w / 2, w / 2), Size(this.size.width - w, this.size.height - w), style = Stroke(w))
        }
    }
}
