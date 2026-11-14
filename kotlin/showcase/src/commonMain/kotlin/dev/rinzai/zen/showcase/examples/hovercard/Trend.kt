package dev.rinzai.zen.showcase.examples.hovercard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.hovercard.HoverCardContent
import dev.rinzai.zen.hovercard.HoverCardTrigger
import dev.rinzai.zen.hovercard.rememberHoverCardState
import dev.rinzai.zen.sparkline.Sparkline

private val MERCHANTS = listOf(
    Triple("Corner Market", listOf(120.0, 96.0, 140.0, 118.0, 152.0, 131.0), "$757"),
    Triple("City Transit", listOf(64.0, 70.0, 58.0, 66.0, 61.0, 72.0), "$391"),
)

/** More than a name: each merchant's spending over six months, a glance away. */
@Composable
fun Trend() {
    val t = Zen.tokens
    ProvideText(style = TextStyles.sm) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            for ((name, spent, total) in MERCHANTS) {
                val card = rememberHoverCardState()
                HoverCardTrigger(card, name, onClick = {})
                HoverCardContent(card, Modifier.width(224.dp)) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(Modifier.popupRow().fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                            Text(name, style = TextStyles.medium)
                            Text(total, style = TextStyles.xs.merge(TextStyles.tabular), color = t.mutedForeground.color())
                        }
                        Sparkline(spent, Modifier.popupRow().fillMaxWidth().height(40.dp).semantics { contentDescription = "$name, last six months" })
                        Text("Last six months", Modifier.popupRow(), style = TextStyles.xs, color = t.mutedForeground.color())
                    }
                }
            }
        }
    }
}
