package dev.rinzai.zen.showcase.examples.calendar

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.addDays
import dev.rinzai.zen.calendar.Calendar
import dev.rinzai.zen.dayOfWeek
import dev.rinzai.zen.today

/** Only the next 60 days, and no weekends: min, max and isDisabled. Weeks start on Monday here, whatever the locale. */
@Composable
fun Limits() {
    val start = remember { today() }
    var date by remember { mutableStateOf<String?>(null) }
    Calendar(
        date,
        { date = it },
        locale = "en-US",
        weekStartsOn = 1,
        min = start,
        max = addDays(start, 60),
        isDisabled = { dayOfWeek(it) == 0 || dayOfWeek(it) == 6 },
    )
}
