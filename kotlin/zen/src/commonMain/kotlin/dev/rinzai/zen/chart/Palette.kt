package dev.rinzai.zen.chart

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Zen
import kotlin.math.roundToInt

/**
 * Where a chart's colours come from when a series or item doesn't give its own: `Chart`, the
 * categorical palette (chart1…8, distinct hues); `Glow`, shades of the theme's two glow colours,
 * from the first to the second and deepening towards the background, for a chart in the theme's
 * own colours (e.g. parts of one whole).
 */
enum class ChartPalette { Chart, Glow }

/** The i-th (0-based) of n colours in the palette: what a chart draws its i-th series or item in, for a legend of your own beside it. */
@Composable
fun paletteColor(palette: ChartPalette, i: Int, n: Int): Color {
    val t = Zen.tokens
    if (palette == ChartPalette.Chart) {
        return listOf(t.chart1, t.chart2, t.chart3, t.chart4, t.chart5, t.chart6, t.chart7, t.chart8)[minOf(i, 7)]
    }
    val k = if (n <= 1) 0f else i.toFloat() / (n - 1)
    val hue = t.glow.mix(t.glow2, (k * 100).roundToInt() / 100f)
    return hue.mix(t.background, (k * 45).roundToInt() / 100f).color()
}
