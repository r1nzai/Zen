package dev.rinzai.zen.showcase.examples.button

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Variants() {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        Button({}) { Text("Save changes") }
        Button({}, variant = ButtonVariant.Secondary) { Text("Export") }
        Button({}, variant = ButtonVariant.Outline) { Text("Cancel") }
        Button({}, variant = ButtonVariant.Ghost) { Text("Skip") }
        Button({}, tone = ButtonTone.Negative) { Text("Delete") }
        Button({}, variant = ButtonVariant.Link) { Text("Learn more") }
    }
}
