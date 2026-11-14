package dev.rinzai.zen.showcase.examples.pageheader

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.pageheader.PageHeader

@Composable
fun Default() {
    PageHeader("Month overview", eyebrow = "Budget", lead = "Where your money went in September, and what's left.") {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button({}) { Text("Add entry") }
            Button({}, variant = ButtonVariant.Outline) { Text("Export") }
        }
    }
}
