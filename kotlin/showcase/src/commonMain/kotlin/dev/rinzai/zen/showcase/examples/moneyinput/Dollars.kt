package dev.rinzai.zen.showcase.examples.moneyinput

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Money
import dev.rinzai.zen.moneyinput.MoneyInput

/** Any currency and locale; `allowEmpty` makes an empty field mean null. */
@Composable
fun Dollars() {
    var amount by remember { mutableStateOf<Money?>(null) }
    MoneyInput(amount, { amount = it }, "USD", Modifier.width(256.dp), locale = "en-US", allowEmpty = true, label = "Budget")
}
