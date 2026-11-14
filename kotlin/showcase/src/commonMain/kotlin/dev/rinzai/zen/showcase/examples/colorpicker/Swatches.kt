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
import dev.rinzai.zen.colorpicker.ColorSwatch
import dev.rinzai.zen.field.Field

private val SWATCHES = listOf(
    ColorSwatch("Violet", "#7c5cff"),
    ColorSwatch("Teal", "#2bb3a3"),
    ColorSwatch("Amber", "#f0a83a"),
    ColorSwatch("Rose", "#ef5a7a"),
    ColorSwatch("White", "#ffffff"),
    ColorSwatch("Black", "#000000"),
)

/** With `alpha`, an opacity slider, and values like "#7c5cff99". Swatches are yours, such as your brand's colours. */
@Composable
fun Swatches() {
    var color by remember { mutableStateOf("#2bb3a3cc") }
    Field("Card background", Modifier.width(256.dp)) {
        ColorPicker(color, { color = it }, alpha = true, swatches = SWATCHES)
    }
}
