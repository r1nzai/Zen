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
import dev.rinzai.zen.datepicker.DateRangePicker

/** A trip: the start, then the end, across two months. Closes once both are picked. */
@Composable
fun Range() {
    var trip by remember { mutableStateOf<DateRange?>(null) }
    DateRangePicker(trip, { trip = it }, Modifier.width(256.dp), clearable = true, months = 2, locale = "en-US", label = "Trip dates")
}
