package dev.rinzai.zen.skeleton

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Zen
import dev.rinzai.zen.linearGradientShader
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import androidx.compose.ui.unit.dp

/** Shimmering placeholder in the shape of content that's on its way; size it with `modifier`. */
@Composable
fun Skeleton(modifier: Modifier = Modifier) {
    val t = Zen.tokens
    val stops = listOf(0.3f to t.tint.color(0.04f), 0.5f to t.tint.color(0.09f), 0.7f to t.tint.color(0.04f))
    // zen-shimmer: a band three times as wide slides across, 1.6s ease-in-out; with reduced motion it rests where it starts.
    val shift = if (reducedMotion()) {
        null
    } else {
        rememberInfiniteTransition().animateFloat(
            0f,
            1f,
            infiniteRepeatable(tween(1600, easing = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)), RepeatMode.Restart),
        )
    }
    Box(
        modifier
            .semantics { hideFromAccessibility() }
            .clip(Zen.radii.md)
            .drawBehind {
                val band = size.width * 3
                val x = -2 * size.width * (1 - (shift?.value ?: 1f))
                val rect = Rect(Offset(x, 0f), androidx.compose.ui.geometry.Size(band, size.height))
                drawRect(ShaderBrush(linearGradientShader(100f, rect, stops)), rect.topLeft, rect.size)
            },
    )
}

/**
 * The placeholder while `loading`, then `content` fading in where it was (only once it has
 * loaded: content there from the start shows as it is). `modifier` sizes the placeholder.
 */
@Composable
fun Skeleton(loading: Boolean, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    var waited by remember { mutableStateOf(loading) }
    if (loading && !waited) waited = true
    if (loading) return Skeleton(modifier)
    if (!waited) return content()
    val reduced = reducedMotion()
    // zen__reveal: 0.45s, rising 4px as it fades in.
    val shown = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(Unit) { shown.animateTo(1f, tween(450, easing = Ease.OutSoft)) }
    Box(Modifier.graphicsLayer { alpha = shown.value; translationY = (1 - shown.value) * 4.dp.toPx() }) { content() }
}
