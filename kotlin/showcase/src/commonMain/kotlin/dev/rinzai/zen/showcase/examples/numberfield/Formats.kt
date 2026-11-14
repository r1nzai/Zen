package dev.rinzai.zen.showcase.examples.numberfield

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
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.numberfield.NumberField

/** `format` shows it as a percentage, a unit or with set decimals, and reads it back typed that way. */
@Composable
fun Formats() {
    var rate by remember { mutableStateOf<Double?>(0.065) }
    var distance by remember { mutableStateOf<Double?>(12.5) }
    Column(Modifier.width(224.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Field("Interest rate") {
            NumberField(
                rate,
                { n, _ -> rate = n },
                step = 0.0025,
                min = 0.0,
                max = 0.3,
                format = NumberOptions(NumberStyle.Percent, minimumFractionDigits = 2),
            )
        }
        Field("Distance") {
            NumberField(
                distance,
                { n, _ -> distance = n },
                step = 0.5,
                min = 0.0,
                format = NumberOptions(NumberStyle.Unit, unit = "kilometer"),
            )
        }
    }
}
