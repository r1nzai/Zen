package dev.rinzai.zen.showcase.examples.repeatpicker

import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Repeat
import dev.rinzai.zen.RepeatUnit
import dev.rinzai.zen.repeatpicker.RepeatPicker

/** Rent: monthly on the 1st, from November. */
@Composable
fun Default() {
    var repeat by remember { mutableStateOf(Repeat(1, RepeatUnit.Month, day = 1)) }
    RepeatPicker(repeat, { repeat = it }, Modifier.widthIn(max = 384.dp), locale = "en-US", start = "2026-11-01")
}
