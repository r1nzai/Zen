package dev.rinzai.zen.showcase.examples.numberfield

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.numberfield.NumberField
import dev.rinzai.zen.numberfield.NumberFieldChange

private fun clamp(n: Double) = n.coerceIn(0.0, 10.0)

/**
 * A count kept somewhere else, such as a server another device also changes. `onValueCommit` says
 * how each change came about: − + and ↑↓ send their step (`delta`), added to whatever the count is
 * by then; a typed number is sent once, on Enter or on leaving the field.
 */
@Composable
fun Steps() {
    var count by remember { mutableStateOf(3.0) }
    var sent by remember { mutableStateOf<String?>(null) }
    Field("Episodes watched", Modifier.width(224.dp), hint = sent?.let { "Sent $it" } ?: "Out of 10") {
        NumberField(
            count,
            { _, _ -> },
            min = 0.0,
            max = 10.0,
            size = FieldSize.Sm,
            onValueCommit = { n, change ->
                if (change is NumberFieldChange.Step) {
                    count = clamp(count + change.delta)
                    sent = if (change.delta > 0) "+${change.delta.toInt()}" else "−${(-change.delta).toInt()}"
                } else {
                    count = n ?: 0.0
                    sent = (n ?: 0.0).toInt().toString()
                }
            },
        )
    }
}
