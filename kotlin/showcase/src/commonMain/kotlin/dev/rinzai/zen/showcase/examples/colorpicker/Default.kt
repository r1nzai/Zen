package dev.rinzai.zen.showcase.examples.colorpicker

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.colorpicker.ColorPicker
import dev.rinzai.zen.field.Field

@Composable
fun Default() {
    var color by remember { mutableStateOf("#7c5cff") }
    Field("Title colour", Modifier.width(256.dp)) {
        ColorPicker(color, { color = it })
    }
}
