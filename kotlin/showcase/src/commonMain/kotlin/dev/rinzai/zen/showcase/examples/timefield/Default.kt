package dev.rinzai.zen.showcase.examples.timefield

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.timefield.TimeField

/** Type the digits, or ↑↓ each part; minutes step by 5 here. */
@Composable
fun Default() {
    var time by remember { mutableStateOf<String?>("09:30") }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Field("Reminder at") {
            TimeField(time, { time = it }, step = 5)
        }
        Text("Value: ${time ?: "null"}", style = TextStyles.sm.merge(TextStyles.tabular), color = Zen.tokens.mutedForeground.color())
    }
}
