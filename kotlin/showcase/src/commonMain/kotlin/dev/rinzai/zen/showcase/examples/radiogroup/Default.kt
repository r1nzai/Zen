package dev.rinzai.zen.showcase.examples.radiogroup

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Text
import dev.rinzai.zen.radiogroup.RadioGroup

/** Arrow keys move between options and pick them, as for any radio group. */
@Composable
fun Default() {
    var repay by remember { mutableStateOf("emi") }
    RadioGroup(repay, { repay = it }, label = "After a prepayment") {
        Radio("emi", description = { Text("Keep the end date; pay less each month.") }) { Text("Lower the EMI") }
        Radio("tenure", description = { Text("Keep the EMI; finish sooner and save more interest.") }) { Text("Shorten the tenure") }
    }
}
