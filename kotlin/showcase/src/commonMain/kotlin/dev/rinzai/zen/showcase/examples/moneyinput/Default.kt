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
import dev.rinzai.zen.Money
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.moneyinput.MoneyInput

/** Try 1.5L, 2cr, 10k or 1,52,000. Commits on leaving it or Enter; Escape reverts. */
@Composable
fun Default() {
    var amount by remember { mutableStateOf<Money?>(15200000) }
    Column(Modifier.width(256.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        MoneyInput(amount, { amount = it }, "INR", locale = "en-IN", label = "Amount")
        Text(
            "Value: " + (amount?.let { "$it paise (${formatMoney(it, "INR", "en-IN")})" } ?: "empty"),
            style = TextStyles.xs,
            color = Zen.tokens.mutedForeground.color(),
        )
    }
}
