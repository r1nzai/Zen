package dev.rinzai.zen.showcase.examples.dialog

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.dialog.DialogClose
import dev.rinzai.zen.dialog.DialogFooter
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.input.Input

@Composable
fun Form() {
    var open by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("Groceries") }
    Button({ open = true }) { Text("Rename") }
    Dialog(open, { open = it }, title = "Rename category", description = "Entries in this category keep their history.") {
        Field("Name") { Input(name, { name = it }, Modifier.fillMaxWidth()) }
        DialogFooter {
            DialogClose(variant = ButtonVariant.Outline) { Text("Cancel") }
            DialogClose { Text("Save") }
        }
    }
}
