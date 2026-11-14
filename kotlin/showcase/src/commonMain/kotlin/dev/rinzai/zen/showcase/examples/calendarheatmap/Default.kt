package dev.rinzai.zen.showcase.examples.calendarheatmap

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateString
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.calendarheatmap.CalendarHeatmap
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatMoney

private val SPENT = mapOf(
    "2026-09-01" to 185000L, "2026-09-03" to 3840L, "2026-09-05" to 2500L, "2026-09-06" to 7800L, "2026-09-08" to 1460L,
    "2026-09-12" to 16450L, "2026-09-13" to 9150L, "2026-09-15" to 4200L, "2026-09-19" to 3180L, "2026-09-20" to 41200L,
    "2026-09-22" to 1199L, "2026-09-26" to 6420L, "2026-09-27" to 2210L,
)
private fun money(cents: Long) = formatMoney(cents, "USD", "en-US", showDecimals = false)

/** What was spent each day of a month: pick a day to see it. */
@Composable
fun Default() {
    var day by remember { mutableStateOf<DateString?>("2026-09-12") }
    Column(Modifier.widthIn(max = 320.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        CalendarHeatmap("2026-09", SPENT, locale = "en-US", format = { money(it.toLong()) }, onSelectedChange = { day = it }, selected = day)
        Text(
            day?.let { "${formatDate(it, "en-US", DateStyle.Long)}: ${money(SPENT[it] ?: 0)} spent" } ?: "Pick a day",
            style = TextStyles.sm,
            color = Zen.tokens.mutedForeground.color(),
        )
    }
}
