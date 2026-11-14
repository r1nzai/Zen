package dev.rinzai.zen.showcase.examples.progressring

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.progressring.ProgressRing

/** Reaching the goal sends out a ring of glow. */
@Composable
fun Goal() {
    var saved by remember { mutableIntStateOf(120) }
    val goal = 200
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.CenterVertically) {
        ProgressRing(saved / goal.toFloat(), "Holiday fund") {
            Text("$$saved", style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular))
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Button({ saved = minOf(saved + 40, goal) }, variant = ButtonVariant.Outline) { Text("Save $40") }
            Button({ saved = 120 }, variant = ButtonVariant.Ghost) { Text("Reset") }
        }
    }
}
