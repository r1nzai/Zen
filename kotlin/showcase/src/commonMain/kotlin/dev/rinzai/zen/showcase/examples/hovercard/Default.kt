package dev.rinzai.zen.showcase.examples.hovercard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.avatar.Avatar
import dev.rinzai.zen.hovercard.HoverCardContent
import dev.rinzai.zen.hovercard.HoverCardTrigger
import dev.rinzai.zen.hovercard.rememberHoverCardState

/** Rest the pointer on the name, or tab to it: a preview of who it is. */
@Composable
fun Default() {
    val t = Zen.tokens
    val card = rememberHoverCardState()
    ProvideText(style = TextStyles.sm) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Paid to ")
            HoverCardTrigger(card, "Priya Sharma", onClick = {})
            Text(" on 3 October.")
        }
        HoverCardContent(card) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Avatar("Priya Sharma", Modifier.popupRow())
                Column(Modifier.popupRow(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Priya Sharma", style = TextStyles.medium)
                    Text("Flatmate · shares rent and bills", style = TextStyles.xs, color = t.mutedForeground.color())
                    Text(
                        "12 payments this year, $4,210 in all",
                        Modifier.padding(top = 4.dp),
                        style = TextStyles.xs.merge(TextStyles.tabular),
                        color = t.mutedForeground.color(),
                    )
                }
            }
        }
    }
}
