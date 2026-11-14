package dev.rinzai.zen.showcase.examples.marquee

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.marquee.Marquee
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState

private val TRACKS = listOf(
    "Glass Aurora" to "Halcyon Drift",
    "The Long Way Home Through the Harbour Lights (Extended Night Mix)" to "Mira Vale and the Quiet Hours Orchestra",
    "Paper Moons" to "Mira Vale",
)

/** Hover a row, or Tab to it: names too long for it scroll, the rest stay put. `host` makes the whole row the trigger. */
@Composable
fun Default() {
    val t = Zen.tokens
    Column(Modifier.width(288.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        for ((title, artist) in TRACKS) {
            val state = rememberControlState()
            Column(
                Modifier
                    .fillMaxWidth()
                    .box(Zen.radii.lg, fill = SolidColor(t.tint.color(if (state.hovered) 0.06f else 0f)), shadows = focusRing(state.focusVisible))
                    .control(state, role = null) {}
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            ) {
                Marquee(title, style = TextStyles.sm.merge(TextStyles.medium), host = state.source)
                Marquee(artist, style = TextStyles.xs, color = t.mutedForeground.color(), host = state.source)
            }
        }
    }
}
