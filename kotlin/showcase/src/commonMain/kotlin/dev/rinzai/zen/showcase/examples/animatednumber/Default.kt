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
import dev.rinzai.zen.animatednumber.AnimatedNumber
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.card.StatTone
import kotlin.math.roundToLong
import kotlin.random.Random

/** Numbers count to each new value (and up from zero when first shown). */
@Composable
fun Default() {
    var net by remember { mutableLongStateOf(625400) }
    var entries by remember { mutableLongStateOf(42) }
    Column(Modifier.widthIn(max = 512.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        StatRow(stats = listOf(
            { m -> Stat("Net this month", { AnimatedMoney(net, "USD", locale = "en-US") }, m, tone = StatTone.Positive) },
            { m -> Stat("Entries", { AnimatedNumber(entries) }, m) },
        ), columns = 2)
        Button(
            {
                net += ((Random.nextDouble() - 0.4) * 300000).roundToLong()
                entries += 1
            },
            variant = ButtonVariant.Outline,
        ) { Text("Add an entry") }
    }
}
