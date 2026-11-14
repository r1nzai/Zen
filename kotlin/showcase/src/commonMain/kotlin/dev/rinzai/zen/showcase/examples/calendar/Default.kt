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
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.calendar.Calendar
import dev.rinzai.zen.formatDate

/** Click a day, or use the keyboard: arrows, Home/End, Page Up/Down (Shift for years). The title jumps to any month and year. */
@Composable
fun Default() {
    var date by remember { mutableStateOf<String?>("2026-09-30") }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Calendar(date, { date = it }, locale = "en-US")
        Text(date?.let { formatDate(it, "en-US", DateStyle.Full) } ?: "No date", style = TextStyles.xs, color = Zen.tokens.mutedForeground.color())
    }
}
