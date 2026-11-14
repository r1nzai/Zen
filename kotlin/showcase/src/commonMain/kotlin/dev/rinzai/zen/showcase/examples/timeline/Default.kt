package dev.rinzai.zen.showcase.examples.timeline

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.timeline.Timeline

/** An entry's history, newest first; the latest is lit. */
@Composable
fun Default() {
    Timeline(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        item("Paid", "Today, 09:12", active = true) { Text("$1,850 to Northside Lettings.") }
        item("Amount changed", "3 Sep") { Text("From $1,800 to $1,850.") }
        item("Created", "1 Aug")
    }
}
