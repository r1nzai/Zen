package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.drawscope.CanvasDrawScope
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import dev.rinzai.zen.box
import dev.rinzai.zen.farthestCorner
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.radialGradient

/** Cover art: two colours, drawn the same in the page and for the lock screen. */
@Immutable
data class Colors(val from: Color, val to: Color)

private fun colors(from: Long, to: Long) = Colors(Color(from or 0xFF000000), Color(to or 0xFF000000))

@Immutable
data class Album(val id: String, val title: String, val artist: String, val year: Int, val colors: Colors)

@Immutable
data class Track(val id: String, val title: String, val album: Album, val sound: DemoTrack)

val AURORA = Album("aurora", "Aurora", "Halcyon Drift", 2026, colors(0x7c3aed, 0xe879f9))
val TRANSIT = Album("transit", "Night Transit", "Mira Vale", 2025, colors(0x1e3a8a, 0x38bdf8))
val TIDE = Album("tide", "Low Tide", "The Quiet Hours", 2024, colors(0x115e59, 0xa7f3d0))
val BLOOM = Album("bloom", "Slow Bloom", "Ostra", 2026, colors(0x9f1239, 0xfdba74))

private fun sound(chords: List<List<Int>>, chordSeconds: Double, rounds: Int) = DemoTrack(chords, chordSeconds, rounds)

val TRACKS = listOf(
    Track("glass-aurora", "Glass Aurora", AURORA, GLASS_AURORA),
    Track("afterglow", "Afterglow", AURORA, sound(listOf(listOf(55, 59, 62), listOf(52, 55, 59), listOf(48, 52, 55), listOf(50, 54, 57)), 2.4, 3)),
    Track("night-transit", "Night Transit", TRANSIT, sound(listOf(listOf(62, 65, 69), listOf(58, 62, 65), listOf(53, 57, 60), listOf(60, 64, 67)), 2.0, 3)),
    Track("paper-moons", "Paper Moons", TRANSIT, sound(listOf(listOf(64, 67, 71), listOf(60, 64, 67), listOf(55, 59, 62), listOf(62, 66, 69)), 2.2, 3)),
    Track("low-tide", "Low Tide", TIDE, sound(listOf(listOf(60, 64, 67), listOf(57, 60, 64), listOf(53, 57, 60), listOf(55, 59, 62)), 3.0, 2)),
    Track("harbour-lights", "Harbour Lights", TIDE, sound(listOf(listOf(57, 61, 64), listOf(54, 57, 61), listOf(50, 54, 57), listOf(52, 56, 59)), 2.6, 3)),
    Track("slow-bloom", "Slow Bloom", BLOOM, sound(listOf(listOf(53, 57, 60), listOf(50, 53, 57), listOf(46, 50, 53), listOf(48, 52, 55)), 3.2, 2)),
    Track("first-light", "First Light", BLOOM, sound(listOf(listOf(59, 63, 66), listOf(56, 59, 63), listOf(52, 56, 59), listOf(54, 58, 61)), 2.8, 2)),
)

fun byId(id: String) = TRACKS.first { it.id == id }

@Immutable
data class Mix(val title: String, val lead: String, val colors: Colors, val tracks: List<String>)

val MIXES = listOf(
    Mix("Evening calm", "Soft pads to wind down", colors(0x4c1d95, 0xf0abfc), listOf("low-tide", "slow-bloom", "glass-aurora")),
    Mix("Night drive", "City lights, open road", colors(0x0f172a, 0x6366f1), listOf("night-transit", "paper-moons", "afterglow")),
    Mix("Deep focus", "Nothing to pull you away", colors(0x134e4a, 0x5eead4), listOf("harbour-lights", "low-tide", "first-light")),
    Mix("Morning light", "A gentle start", colors(0x9a3412, 0xfde68a), listOf("first-light", "glass-aurora", "slow-bloom")),
    Mix("Slow Sunday", "No plans, no hurry", colors(0x701a75, 0xfda4af), listOf("slow-bloom", "harbour-lights", "afterglow")),
    Mix("Afterhours", "Late, low and warm", colors(0x1e1b4b, 0xc084fc), listOf("afterglow", "night-transit", "paper-moons")),
)

/** radial-gradient(circle at 28% 22%, white/.28, transparent 55%) over linear-gradient(135deg, from, to). */
@Composable
fun Cover(colors: Colors, shape: Shape, modifier: Modifier = Modifier, shadows: List<dev.rinzai.zen.Shadow> = emptyList()) {
    val at = { s: Size -> Offset(s.width * 0.28f, s.height * 0.22f) }
    Box(
        modifier
            .box(shape, fill = linearGradient(135f, 0f to colors.from, 1f to colors.to), shadows = shadows)
            .box(shape, fill = radialGradient(at, { farthestCorner(at(it), it) }, 0f to Color.White.copy(alpha = 0.28f), 0.55f to Color.White.copy(alpha = 0f))),
    )
}

private val art = mutableMapOf<Colors, ImageBitmap>()

/** The same cover as a 512px image, for the lock screen and the OS media controls. */
fun coverArt(colors: Colors): ImageBitmap = art.getOrPut(colors) {
    val image = ImageBitmap(512, 512)
    CanvasDrawScope().draw(Density(1f), LayoutDirection.Ltr, Canvas(image), Size(512f, 512f)) {
        drawRect(Brush.linearGradient(listOf(colors.from, colors.to), Offset.Zero, Offset(512f, 512f)))
        drawRect(Brush.radialGradient(0f to Color.White.copy(alpha = 0.28f), 0.55f to Color.White.copy(alpha = 0f), center = Offset(143f, 113f), radius = 400f))
    }
    image
}
