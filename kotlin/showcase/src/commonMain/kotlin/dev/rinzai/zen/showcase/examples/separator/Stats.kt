package dev.rinzai.zen.showcase.examples.separator

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.separator.Separator

/** Upright between figures in a card: it takes the row's height, so it spans each label and value. */
@Composable
fun Stats() {
    val side = if (Zen.page.atLeast(Breakpoint.Md)) 20.dp else 16.dp
    Card(Modifier.widthIn(max = 448.dp).fillMaxWidth(), padding = PaddingValues(horizontal = side, vertical = 16.dp)) {
        Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            listOf("Income" to "$6,200", "Spent" to "$4,180", "Saved" to "$2,020").forEachIndexed { i, (label, value) ->
                if (i > 0) Separator(orientation = Orientation.Vertical)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(label, style = TextStyles.xs, color = Zen.tokens.mutedForeground.color())
                    Text(value, style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tabular))
                }
            }
        }
    }
}
