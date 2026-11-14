package dev.rinzai.zen.showcase.examples.datepicker

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.datepicker.DatePicker

/** Opens on the chosen date, ready for the keyboard; picking a day closes it. With onClear, it can be emptied. */
@Composable
fun Default() {
    var date by remember { mutableStateOf<String?>("2026-09-30") }
    DatePicker(date, { date = it }, Modifier.width(224.dp), clearable = true, locale = "en-IN", label = "Due date")
}
