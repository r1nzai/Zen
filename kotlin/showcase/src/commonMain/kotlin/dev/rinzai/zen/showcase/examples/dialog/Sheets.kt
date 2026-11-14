package dev.rinzai.zen.showcase.examples.dialog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.checkbox.Checkbox
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.dialog.DialogClose
import dev.rinzai.zen.dialog.DialogFooter
import dev.rinzai.zen.dialog.DialogSide

/** With side, a dialog slides in from an edge: a bottom sheet (phones) or a side panel (filters, details). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Sheets() {
    var open by remember { mutableStateOf(false) }
    var side by remember { mutableStateOf(DialogSide.Bottom) }
    var income by remember { mutableStateOf(true) }
    var spending by remember { mutableStateOf(true) }
    var transfers by remember { mutableStateOf(false) }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Button({ side = DialogSide.Bottom; open = true }, variant = ButtonVariant.Outline) { Text("Bottom sheet") }
        Button({ side = DialogSide.Right; open = true }, variant = ButtonVariant.Outline) { Text("Side panel") }
    }
    Dialog(open, { open = it }, title = "Filters", description = "Show only what you need.", side = side) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Checkbox(income, { income = it }) { Text("Income") }
            Checkbox(spending, { spending = it }) { Text("Spending") }
            Checkbox(transfers, { transfers = it }) { Text("Transfers") }
        }
        // mt-auto: a side panel is full height, its footer at the bottom.
        DialogFooter(if (side == DialogSide.Bottom) Modifier else Modifier.weight(1f)) {
            DialogClose(variant = ButtonVariant.Ghost) { Text("Cancel") }
            DialogClose { Text("Apply") }
        }
    }
}
