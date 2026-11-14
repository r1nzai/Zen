package dev.rinzai.zen.showcase.examples.colorpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import dev.rinzai.zen.ProvideTheme
import dev.rinzai.zen.Text
import dev.rinzai.zen.ThemeSettings
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.colorpicker.ColorPicker
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.hexToOklch
import kotlin.math.roundToInt

/** `hexToOklch` gives a picked colour's hue to the theme engine, which keeps it readable in dark and light. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Accent() {
    var color by remember { mutableStateOf("#2bb3a3") }
    val theme = hexToOklch(color)?.let { ThemeSettings.Default.customize(hue = it.h.roundToInt()) } ?: ThemeSettings.Default
    FlowRow(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp), itemVerticalAlignment = Alignment.Bottom) {
        Field("Accent", Modifier.width(224.dp)) {
            ColorPicker(color, { color = it })
        }
        ProvideTheme(theme) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Button({}) { Text("Save") }
                Badge { Text("New") }
            }
        }
    }
}
