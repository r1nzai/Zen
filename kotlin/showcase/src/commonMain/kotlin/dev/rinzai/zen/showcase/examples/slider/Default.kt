package dev.rinzai.zen.showcase.examples.slider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.slider.Slider

/** Filled up to the value; arrow keys and Home/End work as on any range input. */
@Composable
fun Default() {
    var savings by remember { mutableFloatStateOf(30f) }
    Column(Modifier.width(288.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Save each month", style = TextStyles.sm.merge(TextStyles.medium))
            Text("${savings.toInt()}%", style = TextStyles.sm.merge(TextStyles.tabular), color = Zen.tokens.mutedForeground.color())
        }
        Slider(savings, { savings = it }, label = "Save each month", valueText = { "${it.toInt()} percent" })
    }
}
