package dev.rinzai.zen.progressring

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.filterDropShadow
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.transition
import kotlin.math.roundToInt

/**
 * Circular progress, 0–1 (clamped), with optional content in the middle; `label` names it, e.g.
 * "Savings goal". Reaching 1 while shown sends out a ring of glow, once.
 */
@Composable
fun ProgressRing(
    value: Float,
    label: String,
    modifier: Modifier = Modifier,
    size: Dp = 84.dp,
    stroke: Dp = 7.dp,
    content: (@Composable () -> Unit)? = null,
) {
    val t = Zen.tokens
    val v = value.coerceIn(0f, 1f)
    val shown by animateFloatAsState(v, transition(700, Ease.Out))
    var bursts by remember { mutableIntStateOf(0) }
    val last = remember { floatArrayOf(v) }
    LaunchedEffect(v) {
        if (last[0] < 1f && v == 1f) bursts++
        last[0] = v
    }
    Box(
        modifier
            .size(size)
            .semantics {
                contentDescription = label
                progressBarRangeInfo = ProgressBarRangeInfo((v * 100).roundToInt().toFloat(), 0f..100f)
            },
        contentAlignment = Alignment.Center,
    ) {
        val track = t.tint.color(0.07f)
        val arc = t.primary.color()
        Canvas(Modifier.fillMaxSize()) { ring(stroke.toPx()) { inset, d, s -> drawArc(track, 0f, 360f, false, inset, d, style = s) } }
        // The <svg> clips its overflow: the glow stops at the ring's box.
        Canvas(Modifier.fillMaxSize().clipToBounds().filterDropShadow(Shadow(blur = 6f, color = t.glow.color(0.45f * t.glowK)))) {
            ring(stroke.toPx()) { inset, d, s ->
                if (shown > 0f) drawArc(arc, -90f, 360f * shown, false, inset, d, style = Stroke(s.width, cap = StrokeCap.Round))
            }
        }
        // Keyed so a second goal reached plays it again.
        if (bursts > 0) key(bursts) { Burst(stroke) }
        if (content != null) content()
    }
}

private inline fun DrawScope.ring(w: Float, draw: (Offset, Size, Stroke) -> Unit) {
    val inset = Offset(w / 2, w / 2)
    draw(inset, Size(size.width - w, size.height - w), Stroke(w))
}

/** .zen__ring-burst: a ring of glow going out from the arc as it closes, after a beat. */
@Composable
private fun Burst(stroke: Dp) {
    val t = Zen.tokens
    val progress = remember { Animatable(0f) }
    val reduced = reducedMotion()
    // `both` holds the start through the delay; with reduced motion it ends there, as theme.css ends zen__ animations.
    LaunchedEffect(Unit) { progress.animateTo(1f, tween(if (reduced) 0 else 900, 500, Ease.OutSoft)) }
    val p = progress.value
    Box(
        Modifier
            .fillMaxSize()
            .graphicsLayer {
                alpha = 0.9f * (1 - p)
                scaleX = 1 + 0.45f * p
                scaleY = scaleX
            }
            .box(CircleShape, border = SolidColor(t.primary.color()), sides = Sides(stroke, stroke, stroke, stroke), shadows = listOf(Shadow(blur = 18f, color = t.glow.color(0.6f * t.glowK)))),
    )
}
