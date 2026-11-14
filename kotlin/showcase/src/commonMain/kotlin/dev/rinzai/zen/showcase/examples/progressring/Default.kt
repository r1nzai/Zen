package dev.rinzai.zen.showcase.examples.progressring

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.progressring.ProgressRing
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

@Composable
fun Primary() {
    ProgressRing(0.64f, "Savings goal") { Percent(0.64f) }
}

@Composable
fun Default() {
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.CenterVertically) {
        for (value in listOf(0.28f, 0.64f, 1f)) {
            ProgressRing(value, "${(value * 100).roundToInt()}% saved") { Percent(value) }
        }
    }
}

@Composable
private fun Percent(value: Float) =
    Text("${(value * 100).roundToInt()}%", style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular))
