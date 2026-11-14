package dev.rinzai.zen.showcase.examples.alert

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.alert.Alert
import dev.rinzai.zen.alert.AlertTone

/** A tinted box per tone; a `title` leads, and the text under it is quieter. */
@Composable
fun Default() {
    Column(Modifier.widthIn(max = 448.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Alert(Modifier.fillMaxWidth()) { Text("Changes to this item apply from next month.") }
        Alert(Modifier.fillMaxWidth(), tone = AlertTone.Positive) { Text("Your data is up to date on every device.") }
        Alert(Modifier.fillMaxWidth(), tone = AlertTone.Negative, title = { Text("Your data will be deleted for good.") }) {
            Text("Without your password or recovery key, nobody can open it. Starting over gives you a new, empty vault.")
        }
    }
}
