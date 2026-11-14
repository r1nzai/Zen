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
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.monthIndex
import dev.rinzai.zen.monthNames

private val MONTHS = listOf("2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03")
private val BALANCE = listOf(4.2, 5.1, 3.8, 4.6, 6.2, 7.1, 6.4, 7.9, 8.8, 7.6, 9.4, 10.2).map { it * 100000 }
private const val TODAY = "2026-09"

private class Point(val month: String, val balance: Double?, val projected: Double?)

// One series split in two at today: solid where it happened, dashed where it's projected.
private val DATA = MONTHS.mapIndexed { i, m -> Point(m, BALANCE[i].takeIf { m <= TODAY }, BALANCE[i].takeIf { m >= TODAY }) }

private fun money(v: Double) = formatNumber(v, "en-IN", NumberOptions(NumberStyle.Currency, "INR", maximumFractionDigits = 1, notation = Notation.Compact))

/** An area in the theme's glow: solid up to today, dashed ahead, with a "Today" marker. Point at it, or focus it and use the arrow keys. */
@Composable
fun Balance() {
    val t = Zen.tokens
    val names = monthNames("en-IN")
    Chart(
        DATA,
        x = { it.month },
        label = "Balance over time",
        summary = "Balance grows from ₹4.2L in April to a projected ₹10.2L next March.",
        formatX = { names[monthIndex(it).mod(12)] },
        formatY = ::money,
        modifier = Modifier.widthIn(max = 672.dp).fillMaxWidth(),
    ) {
        area("Balance", color = t.glow.color()) { it.balance }
        area("Projected", color = t.glow2.color(), dashed = true) { it.projected }
        referenceAt(TODAY, label = "Today")
    }
}
