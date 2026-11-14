package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToLong

enum class Intensity { Mono, Muted, Balanced, Vivid }

/** Neutral greys, or greys faintly tinted with the accent hue. */
enum class ThemeTint { Neutral, Tinted }

enum class ThemeContrast { Standard, High }

enum class ThemeGlow { Off, Soft, Bright }

/** Strength of the Backdrop's pattern (contours or dots). */
enum class Topography { Off, Subtle, Visible }

enum class ThemePreset(val label: String, val hue: Int, val intensity: Intensity, val tint: ThemeTint) {
    Violet("Violet", 295, Intensity.Balanced, ThemeTint.Tinted),
    Ocean("Ocean", 250, Intensity.Balanced, ThemeTint.Tinted),
    Teal("Teal", 195, Intensity.Balanced, ThemeTint.Tinted),
    Forest("Forest", 150, Intensity.Muted, ThemeTint.Tinted),
    Amber("Amber", 75, Intensity.Balanced, ThemeTint.Neutral),
    Rose("Rose", 15, Intensity.Muted, ThemeTint.Neutral),
    Graphite("Graphite", 270, Intensity.Mono, ThemeTint.Neutral),
}

/**
 * A few inputs that make every colour token, as the web library's theme engine has them.
 * Lightness is fixed per UI role and the inputs only move hue and chroma, so contrast holds for
 * any colour. `preset` is null for a custom theme; `hue` is an OKLCH angle, 0–359.
 */
@Immutable
data class ThemeSettings(
    val preset: ThemePreset? = ThemePreset.Violet,
    val hue: Int = 295,
    val intensity: Intensity = Intensity.Balanced,
    val tint: ThemeTint = ThemeTint.Tinted,
    val contrast: ThemeContrast = ThemeContrast.Standard,
    val glow: ThemeGlow = ThemeGlow.Soft,
    val topography: Topography = Topography.Subtle,
) {
    /** A preset's colour inputs, keeping the other settings. */
    fun applyPreset(p: ThemePreset) = copy(preset = p, hue = p.hue, intensity = p.intensity, tint = p.tint)

    /** Any edit to the colour inputs makes it a custom theme. */
    fun customize(hue: Int = this.hue, intensity: Intensity = this.intensity, tint: ThemeTint = this.tint) =
        copy(preset = null, hue = hue, intensity = intensity, tint = tint)

    companion object {
        /** Zen's default: violet, balanced, tinted greys, soft glow. */
        val Default = ThemeSettings()
    }
}

private fun round(n: Double, d: Int): Float {
    val k = 10.0.pow(d)
    return ((n * k).roundToLong() / k).toFloat()
}

private fun o(l: Number, c: Number, h: Number) = Oklch(round(l.toDouble(), 3), round(c.toDouble(), 3), round(((h.toDouble() % 360) + 360) % 360, 1))

/** These tokens with `theme`'s colours, for `appearance`: what the web library's applyTheme sets. */
fun Tokens.themed(theme: ThemeSettings, appearance: Appearance): Tokens {
    val h = theme.hue.toDouble()
    val c = when (theme.intensity) {
        Intensity.Mono -> 0.012
        Intensity.Muted -> 0.07
        Intensity.Balanced -> 0.13
        Intensity.Vivid -> 0.19
    }
    val hi = theme.contrast == ThemeContrast.High
    val tintC = if (theme.tint == ThemeTint.Tinted) min(0.014, c * 0.12) else 0.003
    val mono = theme.intensity == Intensity.Mono
    fun n(l: Double, extra: Double = 1.0) = o(l, tintC * extra, h)
    val topo = when (theme.topography) {
        Topography.Off -> 0f
        Topography.Subtle -> 0.55f
        Topography.Visible -> 1f
    }
    fun glow(off: Float, soft: Float, bright: Float) = when (theme.glow) {
        ThemeGlow.Off -> off
        ThemeGlow.Soft -> soft
        ThemeGlow.Bright -> bright
    } to soft

    if (appearance == Appearance.Light) {
        val fg = o(if (hi) 0.16 else 0.21, 0.02, h)
        val primary = o(if (mono) 0.3 else 0.48, if (mono) 0.02 else min(0.22, c * 1.5), h)
        val (strength, tuned) = glow(0f, 0.4f, 0.8f)
        return copy(
            background = n(if (hi) 0.995 else 0.985, 0.4),
            foreground = fg,
            card = o(1.0, 0.0, 0.0),
            cardForeground = fg,
            popover = o(1.0, 0.0, 0.0),
            popoverForeground = fg,
            secondary = n(0.955, 0.6),
            secondaryForeground = o(0.21, 0.02, h),
            muted = n(0.96, 0.5),
            mutedForeground = n(if (hi) 0.42 else 0.5, 1.5),
            border = n(if (hi) 0.78 else 0.91, 0.8),
            input = n(if (hi) 0.78 else 0.91, 0.8),
            primary = primary,
            primaryForeground = o(0.985, 0, 0),
            accent = o(0.95, if (mono) 0.005 else c * 0.25, h),
            accentForeground = o(0.42, if (mono) 0.02 else min(0.16, c * 0.9), h),
            ring = primary,
            destructive = o(0.55, 0.22, 25),
            destructiveForeground = o(0.985, 0, 0),
            glow = o(0.62, if (mono) 0.02 else min(0.2, c * 1.4), h),
            glow2 = o(0.65, if (mono) 0.02 else c * 1.05, h + 30),
            tint = o(0.21, 0.02, h),
            glowStrength = strength,
            glowTunedAt = tuned,
            topoStrength = topo,
        )
    }
    val fg = o(0.97, 0.004, h)
    val (strength, tuned) = glow(0f, 0.55f, 1f)
    return copy(
        background = n(if (hi) 0.13 else 0.155),
        foreground = fg,
        card = n(if (hi) 0.17 else 0.195),
        cardForeground = fg,
        popover = n(if (hi) 0.18 else 0.21),
        popoverForeground = fg,
        secondary = n(0.25),
        secondaryForeground = fg,
        muted = n(0.235),
        mutedForeground = n(if (hi) 0.84 else 0.72, 1.5),
        border = n(if (hi) 0.4 else 0.28, 1.5),
        input = n(if (hi) 0.4 else 0.28, 1.5),
        primary = o(if (mono) 0.88 else 0.72, c, h),
        primaryForeground = o(if (mono) 0.2 else 0.17, if (mono) 0.01 else 0.03, h),
        accent = o(0.3, c * 0.35, h),
        accentForeground = o(0.88, c * 0.5, h),
        ring = o(0.72, c, h),
        destructive = o(0.64, 0.2, 25),
        destructiveForeground = o(0.13, 0.02, 25),
        glow = o(0.7, if (mono) 0.02 else c, h),
        // Analogous second light (a little further round the wheel), not a contrasting colour.
        glow2 = o(0.72, if (mono) 0.02 else c * 0.75, h + 30),
        tint = o(1.0, 0.0, 0.0),
        glowStrength = strength,
        glowTunedAt = tuned,
        topoStrength = topo,
    )
}

/**
 * Gives what's inside `theme`'s colours, in the page's appearance, as the web library's applyTheme
 * does with a target: a preview, or a part of the app in its own colours.
 */
@Composable
fun ProvideTheme(theme: ThemeSettings, content: @Composable () -> Unit) {
    val appearance = Zen.page.appearance
    val base = LocalTokens.current
    val tokens = remember(base, theme, appearance) { base.themed(theme, appearance) }
    CompositionLocalProvider(LocalTokens provides tokens, content = content)
}
