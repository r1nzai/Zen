package dev.rinzai.zen.showcase.examples.slider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.slider.Slider

private val HUES = Brush.horizontalGradient(List(13) { Oklch(0.72f, 0.13f, it * 30f).color() })

/** A custom track (every hue) and thumb (the chosen colour); onValueCommit fires once, when you let go. */
@Composable
fun Hue() {
    var hue by remember { mutableFloatStateOf(295f) }
    var saved by remember { mutableFloatStateOf(295f) }
    Column(Modifier.width(288.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Slider(
            hue,
            { hue = it },
            min = 0f,
            max = 359f,
            onValueCommit = { saved = it },
            track = { HUES },
            thumbColor = Oklch(0.72f, 0.13f, hue).color(),
            label = "Accent hue",
            valueText = { "Hue ${it.toInt()} degrees" },
        )
        Text("Saved: ${saved.toInt()}°", style = TextStyles.xs, color = Zen.tokens.mutedForeground.color())
    }
}
