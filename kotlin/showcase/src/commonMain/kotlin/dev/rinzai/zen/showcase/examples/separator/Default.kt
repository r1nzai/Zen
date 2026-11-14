package dev.rinzai.zen.showcase.examples.separator

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.separator.Separator

/** Across between sections, and upright between items in a row. */
@Composable
fun Default() {
    val muted = Zen.tokens.mutedForeground.color()
    ProvideText(style = TextStyles.sm) {
        Column(Modifier.widthIn(max = 320.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column {
                Text("September 2026", style = TextStyles.medium)
                Text("Budgets, entries and goals", color = muted)
            }
            Separator()
            ProvideText(muted) {
                Row(Modifier.height(20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Spent $2,742")
                    Separator(orientation = Orientation.Vertical)
                    Text("Left $1,258")
                    Separator(orientation = Orientation.Vertical)
                    Text("12 entries")
                }
            }
        }
    }
}
