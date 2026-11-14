package dev.rinzai.zen

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cbrt
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

/** Hue in degrees, saturation and value 0–1, alpha 0–1. */
@Immutable
data class Hsv(val h: Float, val s: Float, val v: Float, val a: Float = 1f)

private val HEX = Regex("^#?([\\da-fA-F]{3,4}|[\\da-fA-F]{6}|[\\da-fA-F]{8})$")

/** "#rgb", "#rgba", "#rrggbb" or "#rrggbbaa" → sRGB and alpha, 0–1; null if it isn't one. */
fun parseHex(hex: String): FloatArray? {
    var digits = HEX.find(hex.trim())?.groupValues?.get(1) ?: return null
    if (digits.length <= 4) digits = digits.map { "$it$it" }.joinToString("")
    if (digits.length == 6) digits += "ff"
    return FloatArray(4) { digits.substring(it * 2, it * 2 + 2).toInt(16) / 255f }
}

/** sRGB and alpha, 0–1 → "#rrggbb", or "#rrggbbaa" when not opaque. */
fun formatHex(r: Float, g: Float, b: Float, a: Float = 1f): String {
    fun byte(x: Float) = (x.coerceIn(0f, 1f) * 255f).roundToInt().toString(16).padStart(2, '0')
    return "#${byte(r)}${byte(g)}${byte(b)}${if (a < 1f) byte(a) else ""}"
}

/** A hex colour as a Color; null if it isn't one. */
fun hexColor(hex: String): Color? = parseHex(hex)?.let { (r, g, b, a) -> Color(r, g, b, a) }

fun hexToHsv(hex: String): Hsv? {
    val (r, g, b, a) = parseHex(hex) ?: return null
    val mx = max(r, max(g, b))
    val d = mx - min(r, min(g, b))
    var h = 0f
    if (d != 0f) h = when (mx) {
        r -> ((g - b) / d) % 6f
        g -> (b - r) / d + 2f
        else -> (r - g) / d + 4f
    }
    return Hsv((h * 60f + 360f) % 360f, if (mx != 0f) d / mx else 0f, mx, a)
}

fun hsvToHex(hsv: Hsv): String {
    val (h, s, v, a) = hsv
    fun f(n: Float): Float {
        val k = (n + h / 60f) % 6f
        return v - v * s * max(0f, min(min(k, 4f - k), 1f))
    }
    return formatHex(f(5f), f(3f), f(1f), a)
}

private fun srgbToLinear(c: Float) = if (c <= 0.04045f) c / 12.92f else ((c + 0.055f) / 1.055f).toDouble().pow(2.4).toFloat()

/** A hex colour in OKLCH, e.g. to give its hue to ThemeSettings.customize; null if it isn't one. */
fun hexToOklch(hex: String): Oklch? {
    val rgba = parseHex(hex) ?: return null
    return srgbToOklch(rgba[0], rgba[1], rgba[2])
}

/** This colour in OKLCH (its alpha aside), e.g. to mix it as CSS's color-mix(in oklch, …) does with Oklch.mix. */
fun Color.toOklch(): Oklch = srgbToOklch(red, green, blue)

private fun srgbToOklch(red: Float, green: Float, blue: Float): Oklch {
    val (r, g, b) = listOf(red, green, blue).map(::srgbToLinear)
    val l_ = cbrt(0.4122214708f * r + 0.5363325363f * g + 0.0514459929f * b)
    val m_ = cbrt(0.2119034982f * r + 0.6806995451f * g + 0.1073969566f * b)
    val s_ = cbrt(0.0883024619f * r + 0.2817188376f * g + 0.6299787005f * b)
    val l = 0.2104542553f * l_ + 0.793617785f * m_ - 0.0040720468f * s_
    val aa = 1.9779984951f * l_ - 2.428592205f * m_ + 0.4505937099f * s_
    val bb = 0.0259040371f * l_ + 0.7827717662f * m_ - 0.808675766f * s_
    val c = hypot(aa, bb)
    // Greys have no hue; 0 rather than float noise.
    val h = if (c < 1e-4f) 0f else ((atan2(bb, aa) * 180f / PI.toFloat()) + 360f) % 360f
    return Oklch(l, c, h)
}

/** OKLCH as hex; colours outside sRGB are clamped to it. */
fun oklchToHex(color: Oklch, alpha: Float = 1f): String {
    val (r, g, b) = color.linear().map(::linearToSrgb)
    return formatHex(r, g, b, alpha)
}
