package dev.rinzai.zen.confirmdialog

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.dialog.DialogClose
import dev.rinzai.zen.dialog.DialogFooter

/**
 * Confirmation for destructive or irreversible actions. Cancel has focus, so Enter is the safe
 * choice. `tone = Negative` for a destructive action: the confirm button is red.
 */
@Composable
fun ConfirmDialog(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    title: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    cancelLabel: String? = null,
    tone: ButtonTone = ButtonTone.Default,
) {
    val cancel = remember { FocusRequester() }
    Dialog(open, onOpenChange, title, modifier.width(416.dp), description, initialFocus = cancel) {
        DialogFooter {
            DialogClose(variant = ButtonVariant.Outline, focus = cancel) { Text(cancelLabel ?: LocalMessages.current.cancel) }
            DialogClose(tone = tone, onClick = onConfirm) { Text(confirmLabel) }
        }
    }
}
