package dev.rinzai.zen.marquee

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.Zen
import dev.rinzai.zen.reducedMotion
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

private const val SPEED = 40f // dp per second, whatever the length
private const val PAUSE = 1200f // ms at each end
private const val FADE = 16f // dp, the edges' fade; the end scrolls clear of it
private val EaseInOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

/** Hover (the default): moves while it, or its host, is hovered or has keyboard focus. Always: keeps moving, e.g. for what's playing. */
enum class MarqueeTrigger { Hover, Always }

/**
 * One line of text that's cut off with an ellipsis, and scrolls to show the rest: to the end, a
 * pause, and back. Only text that doesn't fit moves. With the Hover trigger it moves while it, or
 * `host` (the interactions of the row, tile or button it's in), is hovered or holds keyboard focus.
 * Stays an ellipsis for reduced motion. As wide as its text, up to the room it's given.
 */
@Composable
fun Marquee(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle? = null,
    color: Color = Color.Unspecified,
    trigger: MarqueeTrigger = MarqueeTrigger.Hover,
    host: InteractionSource? = null,
) {
    val own = remember { MutableInteractionSource() }
    val source = host ?: own
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    val keyboard = Zen.page.keyboard
    // How far the text runs past the box (0 when it fits).
    var hidden by remember { mutableIntStateOf(0) }
    var offset by remember { mutableFloatStateOf(0f) }
    var fadeStart by remember { mutableFloatStateOf(0f) }
    val reduced = reducedMotion()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val moving = hidden > 1 && (trigger == MarqueeTrigger.Always || hovered || (focused && keyboard)) && !reduced

    val density = LocalDensity.current
    val fadePx = with(density) { FADE.dp.toPx() }
    val speedPx = with(density) { SPEED.dp.toPx() }

    if (moving) {
        LaunchedEffect(hidden, rtl, fadePx, speedPx) {
            val start = withFrameMillis { it }
            while (true) {
                withFrameMillis { now ->
                    val distance = hidden + fadePx
                    val move = distance / speedPx * 1000f
                    val total = 2 * (PAUSE + move)
                    val ms = ((now - start) % total.toLong()).toFloat()
                    // The whole run is eased, then its keyframes followed (the timing's easing, as the web animation's).
                    val p = EaseInOut.transform(ms / total) * total
                    val at = when {
                        p < PAUSE -> 0f
                        p < PAUSE + move -> (p - PAUSE) / move
                        p < 2 * PAUSE + move -> 1f
                        else -> 1f - (p - 2 * PAUSE - move) / move
                    }
                    offset = (if (rtl) 1f else -1f) * distance * at
                    // The start's fade only shows once the text has moved off it (linear, not eased).
                    val ramp = min(move, 400f)
                    fadeStart = fadePx * when {
                        ms < PAUSE -> 0f
                        ms < PAUSE + ramp -> (ms - PAUSE) / ramp
                        ms < 2 * PAUSE + 2 * move - ramp -> 1f
                        else -> 1f - (ms - (2 * PAUSE + 2 * move - ramp)) / ramp
                    }
                }
            }
        }
    } else {
        offset = 0f
        fadeStart = 0f
    }

    Layout(
        content = {
            Text(
                text,
                style = style,
                color = color,
                maxLines = 1,
                softWrap = false,
                overflow = if (moving) TextOverflow.Clip else TextOverflow.Ellipsis,
            )
        },
        modifier = modifier
            .then(if (host == null) Modifier.hoverable(own) else Modifier)
            .then(
                if (moving) {
                    Modifier
                        .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
                        .drawWithContent {
                            drawContent()
                            val w = size.width
                            val fade = fadePx
                            val a = (fadeStart / w).coerceIn(0f, 1f)
                            val b = ((w - fade) / w).coerceIn(a, 1f)
                            val stops = arrayOf(0f to Color.Transparent, a to Color.Black, b to Color.Black, 1f to Color.Transparent)
                            val mask = if (rtl) Brush.horizontalGradient(*stops, startX = w, endX = 0f) else Brush.horizontalGradient(*stops)
                            drawRect(mask, blendMode = BlendMode.DstIn)
                        }
                } else Modifier,
            ),
    ) { measurables, c ->
        val m = measurables.first()
        val full = m.maxIntrinsicWidth(c.maxHeight)
        val box = if (c.hasBoundedWidth) min(full, c.maxWidth).coerceAtLeast(c.minWidth) else full
        hidden = max(0, full - box)
        val placeable = m.measure(if (moving) Constraints(maxHeight = c.maxHeight) else Constraints(maxWidth = box, maxHeight = c.maxHeight))
        layout(box, placeable.height) {
            if (moving) placeable.placeRelativeWithLayer(0, 0) { translationX = offset } else placeable.placeRelative(0, 0)
        }
    }
}
