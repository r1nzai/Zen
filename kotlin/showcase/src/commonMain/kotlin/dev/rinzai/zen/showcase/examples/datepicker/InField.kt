package dev.rinzai.zen.showcase.examples.datepicker

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.addDays
import dev.rinzai.zen.datepicker.DatePicker
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.today

/** In a Field: the label, hint and error are wired to the picker. Only dates from today on. */
@Composable
fun InField() {
    var date by remember { mutableStateOf<String?>(null) }
    var focused by remember { mutableStateOf(false) }
    var touched by remember { mutableStateOf(false) }
    Field(
        "Start date",
        Modifier.width(256.dp),
        hint = "When the plan begins.",
        error = if (touched && date == null) "Pick a start date." else null,
    ) {
        DatePicker(
            date,
            { date = it },
            Modifier.onFocusChanged {
                if (focused && !it.isFocused) touched = true
                focused = it.isFocused
            },
            locale = "en-US",
            min = today(),
            max = addDays(today(), 365),
        )
    }
}
