package dev.rinzai.zen.showcase.examples.colorpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.colorpicker.ColorPanel

/** ColorPanel is the picker's panel on its own, for a sidebar or an inspector. `onValueCommit` fires once a change is made, the moment to save. */
@Composable
fun Inline() {
    var color by remember { mutableStateOf("#ef5a7a") }
    var saved by remember { mutableStateOf(color) }
    val t = Zen.tokens
    Card(padding = PaddingValues(16.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ColorPanel(color, { color = it }, onValueCommit = { saved = it })
            Text(
                buildAnnotatedString {
                    append("Saved: ")
                    withStyle(TextStyles.mono.toSpanStyle().merge(SpanStyle(color = t.foreground.color()))) { append(saved) }
                },
                style = TextStyles.xs,
                color = t.mutedForeground.color(),
            )
        }
    }
}
