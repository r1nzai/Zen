package dev.rinzai.zen.showcase.examples.chart

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.Notation
import dev.rinzai.zen.Zen
import dev.rinzai.zen.chart.Chart
import dev.rinzai.zen.chart.ChartTone
import dev.rinzai.zen.formatNumber

private class Month(val month: String, val income: Double, val spending: Double) {
    val net = income - spending
}

private val DATA = listOf(
    Month("Apr", 92000.0, 61000.0),
    Month("May", 92000.0, 74000.0),
    Month("Jun", 98000.0, 58000.0),
    Month("Jul", 98000.0, 103000.0),
    Month("Aug", 98000.0, 66000.0),
    Month("Sep", 112000.0, 71000.0),
    Month("Oct", 112000.0, 69000.0),
    Month("Nov", 112000.0, 80000.0),
)

private fun inr(v: Double) = formatNumber(v, "en-IN", NumberOptions(NumberStyle.Currency, "INR", maximumFractionDigits = 1, notation = Notation.Compact))

/** Bars grouped by month with a line on the same axis; months still to come are faded. */
@Composable
fun Cashflow() {
    val net = Zen.tokens.chart3
    Chart(DATA, x = { it.month }, label = "Income and spending by month", formatY = ::inr, modifier = Modifier.widthIn(max = 672.dp).fillMaxWidth()) {
        bar("Income", dim = { _, i -> i > 5 }) { it.income }
        bar("Spending", dim = { _, i -> i > 5 }) { it.spending }
        line("Net", color = net) { it.net }
        reference(0.0, tone = ChartTone.Negative)
    }
}
