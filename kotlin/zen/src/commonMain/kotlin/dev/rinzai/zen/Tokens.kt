// Generated from tokens/ by scripts/generate.mjs; don't edit.
package dev.rinzai.zen

import androidx.compose.ui.graphics.Color

/** Zen's design tokens (tokens/zen.tokens.json): one field per token, as web/packages/variables.css has one custom property. */
data class Tokens(
    /** --radius (px) */
    val radius: Float,
    /** --background */
    val background: Oklch,
    /** --foreground */
    val foreground: Oklch,
    /** --card */
    val card: Oklch,
    /** --card-foreground */
    val cardForeground: Oklch,
    /** --popover */
    val popover: Oklch,
    /** --popover-foreground */
    val popoverForeground: Oklch,
    /** --primary: violet */
    val primary: Oklch,
    /** --primary-foreground */
    val primaryForeground: Oklch,
    /** --secondary */
    val secondary: Oklch,
    /** --secondary-foreground */
    val secondaryForeground: Oklch,
    /** --muted */
    val muted: Oklch,
    /** --muted-foreground */
    val mutedForeground: Oklch,
    /** --accent */
    val accent: Oklch,
    /** --accent-foreground */
    val accentForeground: Oklch,
    /** --destructive */
    val destructive: Oklch,
    /** --destructive-foreground */
    val destructiveForeground: Oklch,
    /** --border */
    val border: Oklch,
    /** --input */
    val input: Oklch,
    /** --ring */
    val ring: Oklch,
    /** --glow */
    val glow: Oklch,
    /** --glow-2: analogous, a little further round the wheel */
    val glow2: Oklch,
    /** --glow-strength: 0 turns every glow off */
    val glowStrength: Float,
    /** --glow-trail (ms): How far the pointer light trails the pointer, as one light for every glow Backdrop drives; 0ms (the default) follows exactly. */
    val glowTrail: Float,
    /** --glow-k: The glow strength the component halos were tuned at: --glow-k is glow-strength over this. */
    val glowTunedAt: Float,
    /** --tint: Ink for translucent overlays (hairlines, glass fills, hover tints), used with an alpha: white on dark, deep violet-grey on light. */
    val tint: Oklch,
    /** --zen-control-edge */
    val zenControlEdge: Float,
    /** --zen-control-edge-hover */
    val zenControlEdgeHover: Float,
    /** --zen-placeholder */
    val zenPlaceholder: Float,
    /** --zen-thumb-off */
    val zenThumbOff: Color,
    /** --glass-shadow */
    val glassShadow: Shadow,
    /** --popup-shadow */
    val popupShadow: Shadow,
    /** --toast-shadow */
    val toastShadow: Shadow,
    /** --backdrop-scrim */
    val backdropScrim: Color,
    /** --topo-strength */
    val topoStrength: Float,
    /** --chart-1 */
    val chart1: Color,
    /** --chart-2 */
    val chart2: Color,
    /** --chart-3 */
    val chart3: Color,
    /** --chart-4 */
    val chart4: Color,
    /** --chart-5 */
    val chart5: Color,
    /** --chart-6 */
    val chart6: Color,
    /** --chart-7 */
    val chart7: Color,
    /** --chart-8 */
    val chart8: Color,
) {
    /** --glow-k: halos tuned at the default strength scale with glow-strength, so 0 turns them off too. */
    val glowK: Float get() = glowStrength / glowTunedAt

    companion object {
        val Dark = Tokens(
            radius = 10f,
            background = Oklch(0.155f, 0.014f, 295f),
            foreground = Oklch(0.97f, 0.004f, 295f),
            card = Oklch(0.195f, 0.014f, 295f),
            cardForeground = Oklch(0.97f, 0.004f, 295f),
            popover = Oklch(0.21f, 0.014f, 295f),
            popoverForeground = Oklch(0.97f, 0.004f, 295f),
            primary = Oklch(0.72f, 0.13f, 295f),
            primaryForeground = Oklch(0.17f, 0.03f, 295f),
            secondary = Oklch(0.25f, 0.014f, 295f),
            secondaryForeground = Oklch(0.97f, 0.004f, 295f),
            muted = Oklch(0.235f, 0.014f, 295f),
            mutedForeground = Oklch(0.72f, 0.021f, 295f),
            accent = Oklch(0.3f, 0.046f, 295f),
            accentForeground = Oklch(0.88f, 0.065f, 295f),
            destructive = Oklch(0.64f, 0.2f, 25f),
            destructiveForeground = Oklch(0.13f, 0.02f, 25f),
            border = Oklch(0.28f, 0.021f, 295f),
            input = Oklch(0.28f, 0.021f, 295f),
            ring = Oklch(0.72f, 0.13f, 295f),
            glow = Oklch(0.7f, 0.13f, 295f),
            glow2 = Oklch(0.72f, 0.098f, 325f),
            glowStrength = 0.55f,
            glowTrail = 0f,
            glowTunedAt = 0.55f,
            tint = Oklch(1f, 0f, 0f),
            zenControlEdge = 0.35f,
            zenControlEdgeHover = 0.5f,
            zenPlaceholder = 0.8f,
            zenThumbOff = Oklch(1f, 0f, 0f).color(0.7f),
            glassShadow = Shadow(x = 0f, y = 10f, blur = 40f, spread = -12f, color = Color.hsl(0f, 0f, 0f, 0.6f)),
            popupShadow = Shadow(x = 0f, y = 20f, blur = 60f, spread = -20f, color = Color.hsl(0f, 0f, 0f, 0.8f)),
            toastShadow = Shadow(x = 0f, y = 18f, blur = 50f, spread = -20f, color = Oklch(0f, 0f, 0f).color(0.8f)),
            backdropScrim = Oklch(0f, 0f, 0f).color(0.5f),
            topoStrength = 0.55f,
            chart1 = Color(0xFF3987E5),
            chart2 = Color(0xFFD95926),
            chart3 = Color(0xFF199E70),
            chart4 = Color(0xFFC98500),
            chart5 = Color(0xFFD55181),
            chart6 = Color(0xFF008300),
            chart7 = Color(0xFF9085E9),
            chart8 = Color(0xFFE66767),
        )
        val Light = Tokens(
            radius = 10f,
            background = Oklch(0.985f, 0.006f, 295f),
            foreground = Oklch(0.21f, 0.02f, 295f),
            card = Oklch(1f, 0f, 0f),
            cardForeground = Oklch(0.21f, 0.02f, 295f),
            popover = Oklch(1f, 0f, 0f),
            popoverForeground = Oklch(0.21f, 0.02f, 295f),
            primary = Oklch(0.48f, 0.195f, 295f),
            primaryForeground = Oklch(0.985f, 0f, 0f),
            secondary = Oklch(0.955f, 0.008f, 295f),
            secondaryForeground = Oklch(0.21f, 0.02f, 295f),
            muted = Oklch(0.96f, 0.007f, 295f),
            mutedForeground = Oklch(0.5f, 0.021f, 295f),
            accent = Oklch(0.95f, 0.033f, 295f),
            accentForeground = Oklch(0.42f, 0.117f, 295f),
            destructive = Oklch(0.55f, 0.22f, 25f),
            destructiveForeground = Oklch(0.985f, 0f, 0f),
            border = Oklch(0.91f, 0.011f, 295f),
            input = Oklch(0.91f, 0.011f, 295f),
            ring = Oklch(0.48f, 0.195f, 295f),
            glow = Oklch(0.62f, 0.182f, 295f),
            glow2 = Oklch(0.65f, 0.137f, 325f),
            glowStrength = 0.4f,
            glowTrail = 0f,
            glowTunedAt = 0.4f,
            tint = Oklch(0.21f, 0.02f, 295f),
            zenControlEdge = 0.5f,
            zenControlEdgeHover = 0.65f,
            zenPlaceholder = 1f,
            zenThumbOff = Oklch(0.21f, 0.02f, 295f).color(0.5f),
            glassShadow = Shadow(x = 0f, y = 10f, blur = 30f, spread = -14f, color = Oklch(0.3f, 0.05f, 295f).color(0.25f)),
            popupShadow = Shadow(x = 0f, y = 20f, blur = 50f, spread = -20f, color = Oklch(0.3f, 0.05f, 295f).color(0.35f)),
            toastShadow = Shadow(x = 0f, y = 18f, blur = 50f, spread = -20f, color = Oklch(0.3f, 0.05f, 295f).color(0.35f)),
            backdropScrim = Oklch(0.21f, 0.02f, 295f).color(0.3f),
            topoStrength = 0.55f,
            chart1 = Color(0xFF2A78D6),
            chart2 = Color(0xFFEB6834),
            chart3 = Color(0xFF1BAF7A),
            chart4 = Color(0xFFEDA100),
            chart5 = Color(0xFFE87BA4),
            chart6 = Color(0xFF008300),
            chart7 = Color(0xFF4A3AA7),
            chart8 = Color(0xFFE34948),
        )
    }
}
