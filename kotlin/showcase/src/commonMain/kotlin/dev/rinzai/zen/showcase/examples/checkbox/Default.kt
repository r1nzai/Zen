package dev.rinzai.zen.showcase.examples.checkbox

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.checkbox.Checkbox

/** With a label and a description; the tick draws itself in. */
@Composable
fun Default() {
    var remind by remember { mutableStateOf(true) }
    var share by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Checkbox(remind, { remind = it }, description = { Text("A nudge on the 1st of each month.") }) { Text("Remind me to log spending") }
        Checkbox(share, { share = it }) { Text("Share anonymous usage data") }
        Checkbox(false, {}, enabled = false) { Text("Sync to the cloud (coming soon)") }
    }
}
