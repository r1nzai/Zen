package dev.rinzai.zen.showcase.examples.monthpicker

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.monthpicker.MonthPicker

@Composable
fun Default() {
    var month by remember { mutableStateOf<String?>("2026-09") }
    MonthPicker(month, { month = it }, Modifier.width(192.dp), locale = "en-IN", label = "Month")
}
