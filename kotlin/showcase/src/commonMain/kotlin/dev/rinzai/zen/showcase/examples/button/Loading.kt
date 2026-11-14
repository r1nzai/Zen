package dev.rinzai.zen.showcase.examples.button

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import kotlinx.coroutines.delay

@Composable
fun Loading() {
    var saving by remember { mutableStateOf(false) }
    if (saving) LaunchedEffect(Unit) {
        delay(1500)
        saving = false
    }
    Button({ saving = true }, loading = saving) { Text(if (saving) "Saving…" else "Save") }
}
