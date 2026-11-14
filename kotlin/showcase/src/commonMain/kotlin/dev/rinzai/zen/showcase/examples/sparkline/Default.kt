package dev.rinzai.zen.showcase.examples.sparkline

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.card.StatTone
import dev.rinzai.zen.sparkline.Sparkline
import dev.rinzai.zen.sparkline.SparklineTone

/** Beside the figures they explain: a balance over the month, and spending by week. */
@Composable
fun Default() {
    StatRow(
        Modifier.widthIn(max = 512.dp).fillMaxWidth(),
        listOf(
            { Stat("Balance", { Figure("$6,908") { Sparkline(listOf(4100.0, 4300.0, 3900.0, 5200.0, 5600.0, 5400.0, 6100.0, 6908.0)) } }, it) },
            {
                Stat("Spent", { Figure("$2,742") { Sparkline(listOf(620.0, 540.0, 810.0, 772.0), tone = SparklineTone.Negative) } }, it, tone = StatTone.Negative)
            },
        ),
    )
}

@Composable
private fun Figure(value: String, line: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.Start), verticalAlignment = Alignment.CenterVertically) {
        Text(value, softWrap = false)
        Row(Modifier.weight(1f), horizontalArrangement = Arrangement.End) { line() }
    }
}
