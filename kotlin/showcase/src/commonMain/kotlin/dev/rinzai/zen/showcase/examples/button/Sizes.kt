package dev.rinzai.zen.showcase.examples.button

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Sizes() {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        Button({}, size = ButtonSize.Sm) { Text("Small") }
        Button({}) { Text("Default") }
        Button({}, size = ButtonSize.Lg) { Text("Large") }
    }
}
