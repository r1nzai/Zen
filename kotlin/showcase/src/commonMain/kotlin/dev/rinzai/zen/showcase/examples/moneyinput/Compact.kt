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

/** `compact`: shorter and right-aligned, for editing inside table rows. */
@Composable
fun Compact() {
    var amount by remember { mutableStateOf<Money?>(1640000) }
    MoneyInput(amount, { amount = it }, "INR", Modifier.width(144.dp), locale = "en-IN", compact = true, label = "Groceries")
}
