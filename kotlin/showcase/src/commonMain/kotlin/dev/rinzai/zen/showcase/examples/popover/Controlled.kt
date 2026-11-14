package dev.rinzai.zen.showcase.examples.popover

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberPopupState

/** Follow the state's `open` (or hear every open and close, outside clicks and Escape too, with `onOpenChange`). */
@Composable
fun Controlled() {
    val popover = rememberPopupState()
    Button(popover::toggle, Modifier.popupAnchor(popover), popupOpen = popover.open) { Text("${if (popover.open) "Hide" else "Show"} popover") }
    PopoverContent(popover, label = "Controlled") {
        Column(Modifier.width(IntrinsicSize.Max).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Manually controlled", Modifier.popupRow(), style = TextStyles.sm.merge(TextStyles.medium))
            Button(popover::hide, Modifier.popupRow().fillMaxWidth(), variant = ButtonVariant.Secondary, size = ButtonSize.Sm) { Text("Close") }
        }
    }
}
