package dev.rinzai.zen.showcase.examples.statuspill

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.spinner.Spinner
import dev.rinzai.zen.statuspill.StatusPill
import dev.rinzai.zen.statuspill.StatusPillAction
import dev.rinzai.zen.statuspill.StatusTone
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private enum class SaveState { Saving, Saved, Error }

/** A save indicator: saving spins, saved checks and then quietens, a failure is red and offers a retry. */
@Composable
fun Save() {
    var state by remember { mutableStateOf(SaveState.Saved) }
    var quiet by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(state) {
        quiet = false
        if (state != SaveState.Saved) return@LaunchedEffect
        delay(2500)
        quiet = true
    }
    val save = { ok: Boolean ->
        state = SaveState.Saving
        scope.launch {
            delay(1200)
            state = if (ok) SaveState.Saved else SaveState.Error
        }
        Unit
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        if (state == SaveState.Error) {
            StatusPill(tone = StatusTone.Negative) {
                Icon(Icons.ExclamationTriangleMicro)
                Text("Not saved")
                StatusPillAction("Retry", { save(true) })
            }
        } else {
            StatusPill(tone = if (state == SaveState.Saved) StatusTone.Positive else StatusTone.Default, quiet = state == SaveState.Saved && quiet) {
                if (state == SaveState.Saving) Spinner() else Icon(Icons.CheckMicro)
                Text(if (state == SaveState.Saving) "Saving…" else "Saved")
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button({ save(true) }, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text("Save") }
            Button({ save(false) }, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text("Save and fail") }
        }
    }
}
