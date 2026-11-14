package dev.rinzai.zen.showcase.examples.numberfield

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.numberfield.NumberField

/** Type, use − and +, or ↑↓: kept between 1 and 12. */
@Composable
fun Default() {
    var people by remember { mutableStateOf<Double?>(2.0) }
    Field("Split between", Modifier.width(224.dp), hint = "People sharing the bill") {
        NumberField(people, { n, _ -> people = n }, min = 1.0, max = 12.0)
    }
}
