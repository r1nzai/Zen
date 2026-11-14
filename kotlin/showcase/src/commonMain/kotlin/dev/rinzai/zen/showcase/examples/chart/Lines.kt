package dev.rinzai.zen.showcase.examples.chart

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.chart.Chart

private class Day(val day: String, val web: Int, val ios: Int, val android: Int)

private val DATA = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun").mapIndexed { i, d ->
    Day(d, listOf(420, 480, 510, 470, 560, 690, 640)[i], listOf(310, 330, 360, 390, 380, 450, 470)[i], listOf(220, 260, 250, 300, 330, 310, 360)[i])
}

/** Several series in the chart palette, in the order they're written; the legend appears for two or more. */
@Composable
fun Lines() {
    Chart(DATA, x = { it.day }, label = "Sessions by platform", height = 220.dp, modifier = Modifier.widthIn(max = 672.dp).fillMaxWidth()) {
        line("Web") { it.web }
        line("iOS") { it.ios }
        line("Android") { it.android }
    }
}
