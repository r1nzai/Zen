package dev.rinzai.zen.showcase.examples.keypad

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.Text
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.keypad.Keypad

/** Entering an amount on a phone: the figure above, the pad below. */
@Composable
fun Default() {
    var typed by remember { mutableStateOf("") }
    val amount = typed.toDoubleOrNull() ?: 0.0
    Column(Modifier.widthIn(max = 288.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            "$${typed.ifEmpty { "0" }}",
            Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
            style = TextStyles.xl4.merge(TextStyles.semibold).merge(TextStyles.tight).merge(TextStyles.tabular),
            align = TextAlign.Center,
        )
        Keypad(typed, { typed = it })
        Button({ typed = "" }, Modifier.fillMaxWidth(), enabled = amount > 0) { Text("Add $${formatNumber(amount, "en-US", NumberOptions(minimumFractionDigits = 2, maximumFractionDigits = 2, useGrouping = false))}") }
    }
}
