package dev.rinzai.zen.showcase.examples.trend

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.trend.Trend
import dev.rinzai.zen.trend.TrendGood

/** Spending going up is bad news (good = Down); savings going up is good. */
@Composable
fun Default() {
    StatRow(
        Modifier.widthIn(max = 576.dp).fillMaxWidth(),
        listOf(
            { Stat("Spent", "$1,845", it, hint = { Trend(0.12, good = TrendGood.Down) { Text("vs last month") } }) },
            { Stat("Saved", "$640", it, hint = { Trend(0.084) { Text("vs last month") } }) },
            { Stat("Bills", "$1,210", it, hint = { Trend(0.0) { Text("vs last month") } }) },
        ),
    )
}
