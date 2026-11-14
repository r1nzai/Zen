package dev.rinzai.zen.showcase.examples.card

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.card.StatTone

@Composable
fun Stats() {
    StatRow(
        Modifier.widthIn(max = 768.dp).fillMaxWidth(),
        listOf(
            { Stat("Income", "$8,450", it, hint = { Text("+4% on last month") }) },
            { Stat("Spent", "$5,120", it, tone = StatTone.Negative) },
            { Stat("Net this month", "$3,330", it, tone = StatTone.Positive) },
        ),
    )
}
