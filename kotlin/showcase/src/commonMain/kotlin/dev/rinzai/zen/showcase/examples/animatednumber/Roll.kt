package dev.rinzai.zen.showcase.examples.animatednumber

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.animatednumber.AnimatedMoney
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Stat
import kotlin.math.roundToLong
import kotlin.random.Random

/** With `roll`, each digit rolls to its new one, like an odometer. */
@Composable
fun Roll() {
    var total by remember { mutableLongStateOf(184250) }
    Column(Modifier.widthIn(max = 320.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Stat("Spent this month", { AnimatedMoney(total, "USD", locale = "en-US", showDecimals = true, roll = true) })
        Button({ total += (Random.nextDouble() * 40000).roundToLong() }, variant = ButtonVariant.Outline) { Text("Add a purchase") }
    }
}
