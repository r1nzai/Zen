package dev.rinzai.zen.showcase.examples.radiocards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radiocards.RadioCards

private class Palette(val id: String, val label: String, val hue: Float)

private val Palettes = listOf(Palette("violet", "Violet", 295f), Palette("ocean", "Ocean", 250f), Palette("teal", "Teal", 195f), Palette("amber", "Amber", 75f))

/** Each card shows what it picks; the whole card is the click target, and arrow keys move the choice. */
@Composable
fun Default() {
    var palette by remember { mutableStateOf("violet") }
    // grid-cols-2, sm:grid-cols-4, gap-2.
    val columns = if (Zen.page.atLeast(Breakpoint.Sm)) 4 else 2
    RadioCards(palette, { palette = it }, Modifier.width(IntrinsicSize.Max), label = "Palette") {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            for (row in Palettes.chunked(columns)) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (p in row) RadioCard(p.id, Modifier.weight(1f)) {
                    Box(
                        Modifier.size(28.dp).box(
                            CircleShape,
                            fill = SolidColor(Oklch(0.72f, 0.13f, p.hue).color()),
                            shadows = listOf(Shadow(blur = 14f, spread = -2f, color = Oklch(0.7f, 0.13f, p.hue).color())),
                        ),
                    )
                    Text(p.label, style = TextStyles.medium)
                }
            }
        }
    }
}
