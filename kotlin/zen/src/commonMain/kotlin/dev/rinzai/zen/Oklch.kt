package dev.rinzai.zen

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin

/**
 * An OKLCH colour as the tokens hold them: CSS's "L C H" triplet, which the web library uses as
 * oklch(var(--x) / alpha). `x.color(alpha)` is that colour; out-of-gamut colours clip per channel, as browsers draw them.
 */
@Immutable
data class Oklch(val l: Float, val c: Float, val h: Float) {
    private val srgb: Color = toSrgb(l, c, h)

    fun color(alpha: Float = 1f): Color = srgb.copy(alpha = alpha.coerceIn(0f, 1f))

    /** The same hue and chroma at another lightness (as `oklch(L c h)` with the token's c and h). */
    fun withL(l: Float) = Oklch(l, c, h)

    /**
     * CSS's `color-mix(in oklch, this, other t)`: each of L, C and H `t` of the way to `other`'s, the
     * hue the shorter way round. A grey's hue is powerless, so the other colour's is kept (white
     * lightens a colour without turning it).
     */
    fun mix(other: Oklch, t: Float): Oklch {
        val h = if (c < ACHROMATIC) other.h else h
        val oh = if (other.c < ACHROMATIC) h else other.h
        var dh = oh - h
        if (dh > 180) dh -= 360 else if (dh < -180) dh += 360
        return Oklch(l + (other.l - l) * t, c + (other.c - c) * t, ((h + dh * t) % 360 + 360) % 360)
    }

    private companion object {
        // Below it, float noise from an sRGB grey's conversion, not a hue.
        const val ACHROMATIC = 1e-4f
    }

    /** The linear-light sRGB channels, unclipped (for shaders that light in linear space). */
    fun linear(): FloatArray = oklchToLinear(l, c, h)
}

private fun oklchToLinear(l: Float, c: Float, h: Float): FloatArray {
    val hr = h * PI.toFloat() / 180f
    val a = c * cos(hr)
    val b = c * sin(hr)
    val l_ = l + 0.3963377774f * a + 0.2158037573f * b
    val m_ = l - 0.1055613458f * a - 0.0638541728f * b
    val s_ = l - 0.0894841775f * a - 1.2914855480f * b
    val ll = l_ * l_ * l_
    val mm = m_ * m_ * m_
    val ss = s_ * s_ * s_
    return floatArrayOf(
        4.0767416621f * ll - 3.3077115913f * mm + 0.2309699292f * ss,
        -1.2684380046f * ll + 2.6097574011f * mm - 0.3413193965f * ss,
        -0.0041960863f * ll - 0.7034186147f * mm + 1.7076147010f * ss,
    )
}

/** Linear light → the sRGB transfer curve, 0–1. */
internal fun linearToSrgb(x: Float): Float {
    val v = x.coerceIn(0f, 1f)
    return if (v <= 0.0031308f) 12.92f * v else 1.055f * v.toDouble().pow(1 / 2.4).toFloat() - 0.055f
}

private fun toSrgb(l: Float, c: Float, h: Float): Color {
    val (r, g, b) = oklchToLinear(l, c, h)
    return Color(linearToSrgb(r), linearToSrgb(g), linearToSrgb(b))
}
