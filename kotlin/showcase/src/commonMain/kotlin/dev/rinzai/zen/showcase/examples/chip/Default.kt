package dev.rinzai.zen.showcase.examples.chip

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.chip.Chip
import dev.rinzai.zen.input.Input

private val YEARS = listOf(5, 10, 15, 20, 30)

/** Quick picks beside a field: the chip matching the field's value shows pressed. */
@Composable
fun Default() {
    var years by remember { mutableStateOf("20") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Input(years, { years = it }, Modifier.width(96.dp), label = "Tenure in years")
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            YEARS.forEach { y -> Chip({ years = y.toString() }, pressed = years == y.toString()) { Text("$y yrs") } }
        }
    }
}
