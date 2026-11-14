package dev.rinzai.zen.showcase.examples.button

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons

@Composable
fun Tones() {
    ProvideText(style = TextStyles.sm) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Saved. ")
                Button({}, variant = ButtonVariant.Link) { Text("Undo") }
                Text(" or ")
                Button({}, variant = ButtonVariant.Link, tone = ButtonTone.Muted) { Text("see history") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Button({}, variant = ButtonVariant.Link, tone = ButtonTone.Negative) { Text("Delete account") }
                Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.Icon, tone = ButtonTone.Negative, label = "Remove") { Icon(Icons.XMark) }
            }
        }
    }
}
