package dev.rinzai.zen.showcase.examples.popover

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.toggle.Toggle

@Composable
fun Settings() {
    val popover = rememberPopupState()
    val settings = remember { mutableStateMapOf("Notifications" to true, "Sounds" to false, "Auto-save" to true) }
    Button(popover::toggle, Modifier.popupAnchor(popover), variant = ButtonVariant.Outline, popupOpen = popover.open) { Text("Preferences") }
    PopoverContent(popover, label = "Preferences") {
        Column(Modifier.width(240.dp).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Preferences", Modifier.popupRow(), style = TextStyles.sm.merge(TextStyles.semibold))
            for (label in listOf("Notifications", "Sounds", "Auto-save")) {
                Row(Modifier.popupRow().fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(label, style = TextStyles.sm.copy(lineHeight = 1.em))
                    Toggle(settings.getValue(label), { settings[label] = it }, label = label)
                }
            }
        }
    }
}
