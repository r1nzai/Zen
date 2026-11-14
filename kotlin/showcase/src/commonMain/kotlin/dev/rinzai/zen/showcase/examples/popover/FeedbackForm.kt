package dev.rinzai.zen.showcase.examples.popover

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.textarea.Textarea

@Composable
fun FeedbackForm() {
    val popover = rememberPopupState()
    var subject by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    Button(popover::toggle, Modifier.popupAnchor(popover), variant = ButtonVariant.Outline, popupOpen = popover.open) { Text("Give feedback") }
    PopoverContent(popover, label = "Send feedback") {
        Column(Modifier.width(288.dp).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Send feedback", Modifier.popupRow(), style = TextStyles.sm.merge(TextStyles.semibold))
            Input(subject, { subject = it }, Modifier.popupRow().fillMaxWidth(), placeholder = "Subject")
            Textarea(body, { body = it }, Modifier.popupRow().fillMaxWidth(), placeholder = "Describe your feedback…")
            Row(Modifier.popupRow().fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, androidx.compose.ui.Alignment.End)) {
                Button(popover::hide, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text("Cancel") }
                Button({}, size = ButtonSize.Sm) { Text("Submit") }
            }
        }
    }
}
