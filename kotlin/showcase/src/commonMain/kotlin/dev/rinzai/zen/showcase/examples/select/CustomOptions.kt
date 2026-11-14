package dev.rinzai.zen.showcase.examples.select

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
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
import dev.rinzai.zen.Zen
import dev.rinzai.zen.currencySymbol
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectItem

private class Currency(val value: String, val label: String, val enabled: Boolean = true)

private val Currencies = listOf(
    Currency("INR", "Indian rupee"),
    Currency("USD", "US dollar"),
    Currency("EUR", "Euro"),
    Currency("JPY", "Japanese yen", enabled = false),
)

/** An item can show anything; its `label` is what the field shows and typing matches. Disabled items are skipped by the keyboard. */
@Composable
fun CustomOptions() {
    var currency by remember { mutableStateOf<String?>(null) }
    Select(currency, { currency = it }, Modifier.width(256.dp), placeholder = "Choose a currency", label = "Currency") {
        for (c in Currencies) {
            SelectItem(c.value, c.label, enabled = c.enabled) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(c.label, Modifier.weight(1f))
                    Text("${c.value} ${currencySymbol(c.value, "en")}", style = TextStyles.tabular, color = Zen.tokens.mutedForeground.color())
                }
            }
        }
    }
}
