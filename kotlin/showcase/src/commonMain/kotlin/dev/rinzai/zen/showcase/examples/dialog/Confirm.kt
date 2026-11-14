package dev.rinzai.zen.showcase.examples.dialog

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.confirmdialog.ConfirmDialog

@Composable
fun Confirm() {
    var open by remember { mutableStateOf(false) }
    Button({ open = true }, tone = ButtonTone.Negative) { Text("Delete goal") }
    ConfirmDialog(
        open,
        { open = it },
        title = "Delete this goal?",
        description = "Its progress history is removed too. This can't be undone.",
        confirmLabel = "Delete",
        tone = ButtonTone.Negative,
        onConfirm = {},
    )
}
