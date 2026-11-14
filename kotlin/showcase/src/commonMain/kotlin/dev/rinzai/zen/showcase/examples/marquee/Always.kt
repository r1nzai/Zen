package dev.rinzai.zen.showcase.examples.marquee

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.marquee.Marquee
import dev.rinzai.zen.marquee.MarqueeTrigger
import dev.rinzai.zen.radii

/** `MarqueeTrigger.Always` keeps it moving, for what's playing: to the end, a pause, and back. */
@Composable
fun Always() {
    val t = Zen.tokens
    Row(
        Modifier
            .width(224.dp)
            .box(Zen.radii.xl, border = SolidColor(t.tint.color(0.1f)))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // bg-linear-135 from-primary to-fuchsia-400
        Box(Modifier.size(40.dp).box(Zen.radii.md, fill = linearGradient(135f, 0f to t.primary.color(), 1f to Oklch(0.74f, 0.238f, 322.16f).color())))
        Column {
            Marquee("The Long Way Home Through the Harbour Lights", style = TextStyles.sm.merge(TextStyles.medium), trigger = MarqueeTrigger.Always)
            Marquee("Mira Vale", style = TextStyles.xs, color = t.mutedForeground.color(), trigger = MarqueeTrigger.Always)
        }
    }
}
