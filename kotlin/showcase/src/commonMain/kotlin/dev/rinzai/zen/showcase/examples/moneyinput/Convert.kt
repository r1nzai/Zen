package dev.rinzai.zen.showcase.examples.moneyinput

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ForeignAmount
import dev.rinzai.zen.Money
import dev.rinzai.zen.RateTable
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.moneyinput.CurrencyConversion
import dev.rinzai.zen.moneyinput.MoneyInput
import kotlinx.coroutines.delay

// Your app fetches these (e.g. the ECB's daily rates, from your server); here, a fixed sample.
private val SAMPLE = RateTable(
    base = "EUR",
    date = "2026-09-29",
    rates = mapOf("INR" to 98.4, "USD" to 1.17, "GBP" to 0.87, "AED" to 4.3, "SGD" to 1.5, "JPY" to 172.6),
)

/** Pick another currency from the symbol and type in it: it's converted into rupees at the loaded rate, and the original is kept. */
@Composable
fun Convert() {
    var amount by remember { mutableStateOf<Money?>(3274000) }
    var original by remember { mutableStateOf<ForeignAmount?>(null) }
    val convert = remember {
        CurrencyConversion(
            currencies = listOf("USD", "EUR", "GBP", "AED", "SGD", "JPY"),
            loadRates = {
                delay(600)
                SAMPLE
            },
            source = "ECB",
            onForeign = { original = it },
        )
    }
    Column(Modifier.width(288.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        MoneyInput(amount, { amount = it }, "INR", locale = "en-IN", convert = convert, label = "Amount")
        Text(
            "Saved: " + (amount?.let { formatMoney(it, "INR", "en-IN") } ?: "empty") +
                (original?.let { ", typed as ${formatMoney(it.amount, it.currency, "en-IN")}" } ?: ""),
            style = TextStyles.xs,
            color = Zen.tokens.mutedForeground.color(),
        )
    }
}
