package dev.rinzai.zen.showcase.examples.calendar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateRange
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.calendar.RangeCalendar
import dev.rinzai.zen.daysBetween
import dev.rinzai.zen.formatDateRange

/** Two months side by side: pick a start, then an end. The days between are previewed as you point. */
@Composable
fun Range() {
    var range by remember { mutableStateOf<DateRange?>(DateRange("2026-10-05", "2026-10-12")) }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        RangeCalendar(range, { range = it }, months = 2, locale = "en-GB")
        val start = range?.start
        val end = range?.end
        Text(
            if (start != null && end != null) "${formatDateRange(start, end, "en-GB")} · ${daysBetween(start, end) + 1} days" else "Pick the last day",
            style = TextStyles.xs,
            color = Zen.tokens.mutedForeground.color(),
        )
    }
}
