package dev.rinzai.zen.showcase.examples.meter

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
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.meter.MeterTone

private fun money(cents: Long) = formatMoney(cents, "USD", "en-US", showDecimals = false)

/** A savings goal with milestones at each quarter: the ones passed are notched into the fill. */
@Composable
fun Milestones() {
    var saved by remember { mutableLongStateOf(420000) }
    val goal = 1000000L
    Column(Modifier.widthIn(max = 384.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Meter(
            saved.toDouble(),
            label = "Emergency fund",
            max = goal.toDouble(),
            marks = listOf(goal / 4.0, goal / 2.0, goal * 3 / 4.0),
            tone = MeterTone.Default,
            detail = "${money(saved)} / ${money(goal)}",
            hint = "${saved * 4 / goal} of 4 milestones",
            valueText = "${money(saved)} of ${money(goal)}",
        )
        Button({ saved = minOf(goal, saved + 100000) }, variant = ButtonVariant.Outline) { Text("Add $1,000") }
    }
}
