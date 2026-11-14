package dev.rinzai.zen.showcase.examples.spinner

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.spinner.Spinner

/** Sized and coloured as you like; it follows the text colour. */
@Composable
fun Default() {
    val t = Zen.tokens
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.CenterVertically) {
        Spinner()
        Spinner(size = 24.dp)
        Spinner(size = 32.dp, stroke = 3.dp, color = t.primary.color())
        Spinner(size = 20.dp, color = t.mutedForeground.color())
    }
}
