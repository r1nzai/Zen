package dev.rinzai.zen.showcase.examples.themetoggle

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.themetoggle.ThemeToggle

/** Flips the whole app between dark and light. */
@Composable
fun Default() {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        ThemeToggle()
        Text("Switch the theme", style = TextStyles.sm, color = Zen.tokens.mutedForeground.color())
    }
}
