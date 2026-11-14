package dev.rinzai.zen.showcase.examples.accordion

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.accordion.Accordion
import dev.rinzai.zen.accordion.AccordionContent
import dev.rinzai.zen.accordion.AccordionItem
import dev.rinzai.zen.accordion.AccordionTrigger
import dev.rinzai.zen.accordion.rememberAccordionState
import dev.rinzai.zen.toggle.Toggle

/** `multiple`: each section opens and closes on its own. */
@Composable
fun Multiple() {
    Accordion(Modifier.widthIn(max = 384.dp).fillMaxWidth(), rememberAccordionState("alerts", multiple = true)) {
        AccordionItem("alerts") {
            AccordionTrigger { Text("Alerts") }
            AccordionContent(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Setting("Over budget", true)
                Setting("Large payments", false)
            }
        }
        AccordionItem("export") {
            AccordionTrigger { Text("Export") }
            AccordionContent { Text("Download every entry as a CSV file, one row each.") }
        }
        AccordionItem("danger") {
            AccordionTrigger { Text("Delete data") }
            AccordionContent { Text("Removes every entry and budget. This can’t be undone.") }
        }
    }
}

@Composable
private fun Setting(label: String, initially: Boolean) {
    var on by remember { mutableStateOf(initially) }
    // A label: pressing it flips the switch it names.
    Row(Modifier.fillMaxWidth().pointerInput(Unit) { detectTapGestures { on = !on } }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label)
        Toggle(on, { on = it }, label = label)
    }
}
