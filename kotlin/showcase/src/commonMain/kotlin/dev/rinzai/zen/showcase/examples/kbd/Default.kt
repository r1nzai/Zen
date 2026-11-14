package dev.rinzai.zen.showcase.examples.kbd

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.kbd.Kbd

/** Shortcuts in a sentence: each key its own Kbd. */
@Composable
fun Default() {
    ProvideText(Zen.tokens.mutedForeground.color(), TextStyles.sm) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp), itemVerticalAlignment = Alignment.CenterVertically) {
            Text("Search with")
            Kbd("⌘")
            Kbd("K")
            Text("on a Mac,")
            Kbd("Ctrl")
            Kbd("K")
            Text("elsewhere; close with")
            Kbd("Esc")
            Text(".")
        }
    }
}
