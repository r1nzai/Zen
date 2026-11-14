package dev.rinzai.zen.showcase.examples.slider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.slider.SliderSize

/** SliderSize.Sm: a thin track and a small thumb, for a compact control like a player's volume. Still 20dp tall to grab. */
@Composable
fun Small() {
    var volume by remember { mutableFloatStateOf(70f) }
    var muted by remember { mutableStateOf(false) }
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Button({ muted = !muted }, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = if (muted) "Unmute" else "Mute") {
            Icon(if (muted) Icons.SpeakerXMark else Icons.SpeakerWave, size = 16.dp)
        }
        Slider(
            if (muted) 0f else volume,
            {
                volume = it
                muted = it == 0f
            },
            Modifier.width(112.dp),
            size = SliderSize.Sm,
            label = "Volume",
            valueText = { "${it.toInt()} percent" },
        )
    }
}
