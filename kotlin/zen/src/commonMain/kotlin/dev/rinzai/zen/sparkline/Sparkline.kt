package dev.rinzai.zen.sparkline

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Zen
import dev.rinzai.zen.rememberSeen
import dev.rinzai.zen.seen
import dev.rinzai.zen.transition
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/** The accent (`Default`), red (`Negative`), or grey (`Muted`). */
enum class SparklineTone { Default, Negative, Muted }

private val Draw = CubicBezierEasing(0.3f, 0.7f, 0.2f, 1f)

/**
 * A small line of how a number has moved (a balance over a month, spending by week), with no
 * axes: for beside a figure in a Stat or a table row. 96×32 unless `modifier` sizes it; it draws
 * itself in once it's first on screen. `area` is a soft fill under the line.
 */
@Composable
fun Sparkline(values: List<Double>, modifier: Modifier = Modifier, area: Boolean = true, tone: SparklineTone = SparklineTone.Default) {
    if (values.size < 2) return
    val t = Zen.tokens
    val m = LocalMessages.current
    val color = when (tone) {
        SparklineTone.Default -> t.primary.color()
        SparklineTone.Negative -> t.destructive.color()
        SparklineTone.Muted -> t.mutedForeground.color()
    }
    val seen = rememberSeen()
    val fade = remember { Animatable(0f) }
    val draw = remember { Animatable(0f) }
    // Held at their start until it's first on screen, so they're seen.
    val fadeSpec = transition<Float>(800, Ease.CssOut)
    val drawSpec = transition<Float>(900, Draw)
    LaunchedEffect(seen.seen) {
        if (seen.seen) coroutineScope {
            launch { fade.animateTo(1f, fadeSpec) }
            draw.animateTo(1f, drawSpec)
        }
    }
    val min = values.min()
    val span = (values.max() - min).takeIf { it != 0.0 } ?: 1.0
    Canvas(
        modifier
            .size(96.dp, 32.dp)
            .seen(seen)
            .semantics {
                role = Role.Image
                contentDescription = m.fromTo(values.first().toPlain(), values.last().toPlain())
            },
    ) {
        // A 100×40 box stretched to fit, inset so the 2px line isn't cut at the top and bottom.
        val sx = size.width / 100f
        val sy = size.height / 40f
        val points = values.mapIndexed { i, v -> Offset(i * 100f / (values.size - 1) * sx, (38 - ((v - min) / span * 36)).toFloat() * sy) }
        val line = Path().apply {
            moveTo(points[0].x, points[0].y)
            for (p in points.drop(1)) lineTo(p.x, p.y)
        }
        if (area) {
            val fill = Path().apply {
                addPath(line)
                lineTo(size.width, size.height)
                lineTo(0f, size.height)
                close()
            }
            // The gradient spans the fill's own box, from its highest point down.
            val top = points.minOf { it.y }
            drawPath(fill, Brush.verticalGradient(listOf(color.copy(alpha = 0.25f), color.copy(alpha = 0f)), top, size.height), alpha = fade.value)
        }
        // Revealed from the left, as if drawn: its points only go rightwards.
        val w = 2.dp.toPx()
        clipRect(left = -w, top = -w, right = -w + (size.width + 2 * w) * draw.value, bottom = size.height + w) {
            drawPath(line, color, style = Stroke(w, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
    }
}

/** As JS's String(number): no ".0" on a whole number. */
private fun Double.toPlain() = if (this == kotlin.math.floor(this) && !isInfinite()) toLong().toString() else toString()
