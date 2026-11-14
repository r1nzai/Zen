package dev.rinzai.zen.showcase.examples.rangeslider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.rangeslider.RangeSlider

/** Entries between two amounts. */
@Composable
fun Default() {
    var span by remember { mutableStateOf(50f..500f) }
    Column(Modifier.widthIn(max = 384.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Amount", style = TextStyles.sm.merge(TextStyles.medium))
            Text("$${span.start.toInt()} – $${span.endInclusive.toInt()}", style = TextStyles.sm.merge(TextStyles.tabular), color = Zen.tokens.mutedForeground.color())
        }
        RangeSlider(span, { span = it }, "Amount", min = 0f, max = 1000f, step = 10f, valueText = { "$${it.toInt()}" })
    }
}
