package dev.rinzai.zen.showcase.examples.timefield

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.datepicker.DatePicker
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.timefield.TimeField

/** A date and a time side by side: a DatePicker for the day, a TimeField for the time. */
@Composable
fun WithDate() {
    var date by remember { mutableStateOf<String?>("2026-10-06") }
    var time by remember { mutableStateOf<String?>("18:45") }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
        Field("Date", Modifier.width(176.dp)) {
            DatePicker(date, { date = it })
        }
        Field("Time") {
            TimeField(time, { time = it }, step = 15, locale = "en-US")
        }
    }
}
