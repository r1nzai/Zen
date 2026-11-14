package dev.rinzai.zen.showcase.examples.chart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.chart.ChartPalette
import dev.rinzai.zen.chart.DonutChart
import dev.rinzai.zen.chart.DonutItem
import dev.rinzai.zen.chart.paletteColor
import dev.rinzai.zen.formatNumber

private val SPENDING = listOf(
    DonutItem("home", "Home", 28000.0),
    DonutItem("food", "Food", 14500.0),
    DonutItem("travel", "Travel", 9200.0),
    DonutItem("fun", "Fun", 6100.0),
    DonutItem("other", "Other", 3400.0),
)
private val total = SPENDING.sumOf { it.value }

private fun inr(v: Double) = formatNumber(v, "en-IN", NumberOptions(NumberStyle.Currency, "INR", maximumFractionDigits = 0))

/** Parts of a whole with the total in the middle, and a legend of your own beside it, in the chart's colours (paletteColor). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Donut() {
    val t = Zen.tokens
    FlowRow(horizontalArrangement = Arrangement.spacedBy(32.dp), verticalArrangement = Arrangement.spacedBy(32.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        DonutChart(SPENDING, "Spending by category", formatValue = ::inr) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                ProvideText(transform = TextTransform.Uppercase) {
                    Text("Spent", style = TextStyles.xs.copy(fontSize = 10.88.sp, lineHeight = 1.5.em, letterSpacing = 0.1.em), color = t.mutedForeground.color())
                }
                Text(inr(total), style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight))
            }
        }
        ProvideText(style = TextStyles.sm) {
            Column(Modifier.widthIn(min = 192.dp).width(IntrinsicSize.Max), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                for ((i, s) in SPENDING.withIndex()) Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(10.dp).box(RoundedCornerShape(3.dp), fill = SolidColor(paletteColor(ChartPalette.Chart, i, SPENDING.size))))
                    Text(s.label, Modifier.weight(1f))
                    Text(inr(s.value), style = TextStyles.medium.merge(TextStyles.tabular))
                }
            }
        }
    }
}
