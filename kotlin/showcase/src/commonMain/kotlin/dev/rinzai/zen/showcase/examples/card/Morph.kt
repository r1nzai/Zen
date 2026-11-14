package dev.rinzai.zen.showcase.examples.card

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.ViewTransitionStyle
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardDescription
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.control
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.sparkline.Sparkline
import dev.rinzai.zen.viewTransition

private class Account(val id: String, val name: String, val balance: String, val trend: List<Double>)

private val ACCOUNTS = listOf(
    Account("checking", "Checking", "$4,280.15", listOf(31.0, 34.0, 30.0, 38.0, 36.0, 42.0, 40.0, 45.0)),
    Account("savings", "Savings", "$12,940.00", listOf(80.0, 82.0, 83.0, 85.0, 86.0, 88.0, 91.0, 94.0)),
    Account("card", "Credit card", "−$612.40", listOf(12.0, 18.0, 15.0, 22.0, 27.0, 21.0, 30.0, 26.0)),
)

/** Open an account and its card grows into its page (a view transition, ViewTransitionStyle.Morph). */
@Composable
fun Morph() {
    var open by remember { mutableStateOf<String?>(null) }
    val transition = Zen.viewTransition
    val go = { id: String? -> transition.start { open = id } }
    val account = ACCOUNTS.firstOrNull { it.id == open }
    if (account != null) {
        Card(Modifier.widthIn(max = 448.dp).fillMaxWidth().viewTransition("account-${account.id}", ViewTransitionStyle.Morph)) {
            CardHeader {
                CardTitle(account.name)
                Button({ go(null) }, size = ButtonSize.Sm, variant = ButtonVariant.Ghost) { Text("Back") }
            }
            Text(account.balance, style = TextStyles.xl3.merge(TextStyles.semibold).merge(TextStyles.tabular))
            CardDescription("Last 8 weeks", Modifier.padding(top = 4.dp))
            Sparkline(account.trend, Modifier.padding(top = 16.dp).height(96.dp).fillMaxWidth())
        }
        return
    }
    Column(Modifier.widthIn(max = 448.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        for (a in ACCOUNTS) {
            Card(Modifier.viewTransition("account-${a.id}", ViewTransitionStyle.Morph), padding = PaddingValues(0.dp)) {
                val state = rememberControlState()
                Row(
                    Modifier.fillMaxWidth().control(state) { go(a.id) }.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(a.name, style = TextStyles.medium)
                    Text(a.balance, style = TextStyles.tabular)
                }
            }
        }
    }
}
