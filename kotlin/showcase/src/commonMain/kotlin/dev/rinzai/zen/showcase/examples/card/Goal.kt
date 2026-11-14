package dev.rinzai.zen.showcase.examples.card

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.progressring.ProgressRing

@Composable
fun Goal() {
    Card(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        CardHeader {
            CardTitle("Emergency fund")
            val menu = rememberMenuState()
            Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Goal actions", popupOpen = menu.open) {
                Icon(Icons.Ellipsis)
            }
            MenuContent(menu) { MenuItem({}) { Text("Edit") } }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            ProgressRing(0.64f, "Emergency fund") {
                Text("64%", style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular))
            }
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("$6,400 of $10,000", style = TextStyles.sm, color = Zen.tokens.mutedForeground.color())
                Button({}, size = ButtonSize.Sm, variant = ButtonVariant.Secondary) { Text("Add money") }
            }
        }
    }
}
