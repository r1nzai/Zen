package dev.rinzai.zen.chart

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii

/** How a series is drawn: a line with a soft fill under it, a line, or bars. */
enum class ChartKind { Area, Line, Bar }

/** One row of a tooltip card: the series' name and value, keyed by a short stroke of `color` (dashed if the series is). */
@Immutable
data class ChartTooltipRow(val label: String, val value: String, val color: Color? = null, val dashed: Boolean = false)

/**
 * The tooltip's card: a title and one row per series, the value first and the series keyed by a
 * short stroke of its colour. Use it in a chart's `tooltip` to show your own rows.
 */
@Composable
fun ChartTooltipCard(title: String, rows: List<ChartTooltipRow>, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    ProvideText(style = TextStyles.xs) {
        Column(
            modifier
                .glass(Zen.radii.xl, blur = true)
                .padding(horizontal = 12.dp, vertical = 10.dp)
                .widthIn(min = 136.dp)
                .width(IntrinsicSize.Max),
        ) {
            Text(title, color = t.foreground.color(), style = TextStyles.medium, softWrap = false)
            Spacer(Modifier.size(6.dp))
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                for (r in rows) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            if (r.color != null) Key(r.color, dashed = r.dashed)
                            Text(r.label, color = t.mutedForeground.color(), softWrap = false)
                        }
                        Spacer(Modifier.weight(1f).widthIn(min = 16.dp))
                        Text(r.value, color = t.foreground.color(), style = TextStyles.medium.merge(TextStyles.tabular), softWrap = false)
                    }
                }
            }
        }
    }
}

/** A series' key: a short line for lines (dashed if the series is), a rounded swatch for bars and areas; `faded` as a bar's dimmed rows are drawn. */
@Composable
internal fun Key(color: Color, dashed: Boolean = false, kind: ChartKind = ChartKind.Line, faded: Boolean = false) {
    if (kind == ChartKind.Line || dashed) {
        Canvas(Modifier.size(12.dp, 4.dp)) {
            val k = size.width / 12f
            drawLine(
                color,
                Offset(0.5f * k, size.height / 2),
                Offset(11.5f * k, size.height / 2),
                strokeWidth = 2 * k,
                cap = StrokeCap.Round,
                pathEffect = if (dashed) PathEffect.dashPathEffect(floatArrayOf(3 * k, 3 * k)) else null,
            )
        }
        return
    }
    Box(Modifier.size(10.dp).box(RoundedCornerShape(3.dp), fill = SolidColor(if (faded) color.copy(alpha = color.alpha * 0.4f) else color)))
}
