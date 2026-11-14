package dev.rinzai.zen

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ThemeTest {
    @Test
    fun defaultIsTheTokens() {
        for (a in Appearance.entries) assertEquals(a.tokens, a.tokens.themed(ThemeSettings.Default, a))
    }

    @Test
    fun customizingMakesItCustom() {
        val t = ThemeSettings.Default.customize(hue = 195)
        assertNull(t.preset)
        assertEquals(Oklch(0.72f, 0.13f, 195f), Tokens.Dark.themed(t, Appearance.Dark).primary)
        assertEquals(ThemePreset.Amber.hue, ThemeSettings.Default.applyPreset(ThemePreset.Amber).hue)
    }

    @Test
    fun hexRoundTrips() {
        assertEquals("#2bb3a3cc", hsvToHex(hexToHsv("#2BB3A3CC")!!))
        assertEquals("#ffaa00", hsvToHex(hexToHsv("#fa0")!!))
        assertNull(hexToHsv("#12"))
        assertEquals(Hsv(0f, 0f, 0f, 1f), hexToHsv("#000000"))
        assertEquals(0f, hexToOklch("#808080")!!.h)
        assertEquals("#7c5cff", oklchToHex(hexToOklch("#7c5cff")!!))
    }
}
