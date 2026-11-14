package dev.rinzai.zen.showcase.examples.monthpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.addMonths
import dev.rinzai.zen.monthpicker.MonthPicker

/** A start and an optional end: the end can't come before the start, and can be cleared. */
@Composable
fun Range() {
    var start by remember { mutableStateOf<String?>("2026-10") }
    var end by remember { mutableStateOf<String?>("2027-09") }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Starts", style = TextStyles.sm.merge(TextStyles.medium))
            MonthPicker(start, { start = it }, Modifier.width(160.dp), locale = "en-US", label = "Starts")
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Ends", style = TextStyles.sm.merge(TextStyles.medium))
            MonthPicker(
                end,
                { end = it },
                Modifier.width(160.dp),
                locale = "en-US",
                min = start?.let { addMonths(it, 1) },
                placeholder = "No end",
                clearable = true,
                clearLabel = "No end",
                label = "Ends",
            )
        }
    }
}
