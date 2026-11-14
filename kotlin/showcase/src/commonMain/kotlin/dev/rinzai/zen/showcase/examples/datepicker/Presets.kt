package dev.rinzai.zen.showcase.examples.datepicker

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateRange
import dev.rinzai.zen.commonRanges
import dev.rinzai.zen.datepicker.DateRangePicker
import dev.rinzai.zen.datepicker.DateRangePreset
import dev.rinzai.zen.today

/** The ranges people pick most, one tap each, beside the calendar. */
@Composable
fun Presets() {
    val r = remember { commonRanges(today()) }
    var range by remember { mutableStateOf<DateRange?>(r.thisMonth) }
    DateRangePicker(
        range,
        { range = it },
        Modifier.width(256.dp),
        locale = "en-US",
        label = "Entries between",
        presets = listOf(
            DateRangePreset("This week", r.thisWeek),
            DateRangePreset("Last 7 days", r.last7Days),
            DateRangePreset("Last 30 days", r.last30Days),
            DateRangePreset("This month", r.thisMonth),
            DateRangePreset("Last month", r.lastMonth),
            DateRangePreset("This year", r.thisYear),
        ),
    )
}
