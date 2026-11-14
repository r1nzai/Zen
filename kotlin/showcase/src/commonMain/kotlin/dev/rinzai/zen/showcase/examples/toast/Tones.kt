package dev.rinzai.zen.showcase.examples.toast

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastAction
import dev.rinzai.zen.toast.ToastTone

/** Needs a ToastProvider above it, once near the root of your app. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Tones() {
    val toast = LocalToaster.current
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Button({ toast("Saved", description = "Your changes are stored.", tone = ToastTone.Positive) }) { Text("Success") }
        Button({ toast("Entry deleted", action = ToastAction("Undo") {}) }, variant = ButtonVariant.Outline) { Text("With action") }
        Button({ toast("Couldn't save", description = "Check your connection.", tone = ToastTone.Negative) }, tone = ButtonTone.Negative) { Text("Error") }
    }
}
