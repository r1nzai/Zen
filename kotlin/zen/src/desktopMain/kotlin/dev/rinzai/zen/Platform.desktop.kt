package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.platform.SystemFont
import org.jetbrains.skia.FontMgr

internal actual val coarsePointer = false

@Composable
internal actual fun systemReducedMotion() = osReducedMotion

/**
 * The OS's reduce-motion setting, as browsers read it: Windows' "Animation effects", macOS's
 * "Reduce motion", GNOME's animations switch. `-Dzen.reducedMotion=true|false` sets it instead, as
 * a browser's emulation does (snapshots for the parity check use it).
 */
private val osReducedMotion: Boolean by lazy {
    System.getProperty("zen.reducedMotion")?.let { return@lazy it.toBoolean() }
    val os = System.getProperty("os.name").lowercase()
    runCatching {
        when {
            os.startsWith("windows") ->
                read("reg", "query", "HKCU\\Control Panel\\Desktop\\WindowMetrics", "/v", "MinAnimate").contains(Regex("""MinAnimate\s+REG_SZ\s+0"""))
            os.startsWith("mac") -> read("defaults", "read", "com.apple.universalaccess", "reduceMotion").trim() == "1"
            else -> read("gsettings", "get", "org.gnome.desktop.interface", "enable-animations").trim() == "false"
        }
    }.getOrDefault(false)
}

private fun read(vararg command: String): String {
    val process = ProcessBuilder(*command).redirectErrorStream(true).start()
    return process.inputStream.bufferedReader().readText().also { process.waitFor() }
}

// A desktop window's title bar is the OS's to draw; the JVM has no say in its scheme.
@Composable
internal actual fun ColorScheme(appearance: Appearance) {}

// AWT has no grab cursors, so these are Chrome's own (ui/resources/cursors, BSD), as it shows them on Windows.
private val grab by lazy { handCursor("hand_grab") }
private val grabbing by lazy { handCursor("hand_grabbing") }

private fun handCursor(name: String): androidx.compose.ui.input.pointer.PointerIcon {
    // With no display there's no pointer to show.
    if (java.awt.GraphicsEnvironment.isHeadless()) return androidx.compose.ui.input.pointer.PointerIcon.Default
    val image = javax.imageio.ImageIO.read(object {}.javaClass.getResource("/dev/rinzai/zen/$name.png"))
    return androidx.compose.ui.input.pointer.PointerIcon(java.awt.Toolkit.getDefaultToolkit().createCustomCursor(image, java.awt.Point(13, 13), name))
}

// AWT has none: the system's circle with a bar through it (IDC_NO), drawn black on a white outline.
private val notAllowed by lazy {
    if (java.awt.GraphicsEnvironment.isHeadless()) return@lazy androidx.compose.ui.input.pointer.PointerIcon.Default
    val image = java.awt.image.BufferedImage(32, 32, java.awt.image.BufferedImage.TYPE_INT_ARGB)
    with(image.createGraphics()) {
        setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON)
        val ring = java.awt.geom.Ellipse2D.Float(6f, 6f, 20f, 20f)
        val bar = java.awt.geom.Line2D.Float(9f, 23f, 23f, 9f)
        for ((paint, width) in listOf(java.awt.Color.WHITE to 6f, java.awt.Color.BLACK to 3f)) {
            color = paint
            stroke = java.awt.BasicStroke(width)
            draw(ring)
            draw(bar)
        }
        dispose()
    }
    androidx.compose.ui.input.pointer.PointerIcon(java.awt.Toolkit.getDefaultToolkit().createCustomCursor(image, java.awt.Point(16, 16), "not-allowed"))
}

internal actual val platformHaptics: androidx.compose.ui.hapticfeedback.HapticFeedback? = null

internal actual fun grabCursor(grabbing: Boolean) = if (grabbing) dev.rinzai.zen.grabbing else grab

internal actual fun cssCursor(cursor: CssCursor) = if (cursor == CssCursor.NotAllowed) notAllowed else androidx.compose.ui.input.pointer.PointerIcon(
    java.awt.Cursor(
        when (cursor) {
            CssCursor.Move -> java.awt.Cursor.MOVE_CURSOR
            CssCursor.NsResize -> java.awt.Cursor.N_RESIZE_CURSOR
            CssCursor.EwResize -> java.awt.Cursor.E_RESIZE_CURSOR
            CssCursor.NwseResize -> java.awt.Cursor.NW_RESIZE_CURSOR
            CssCursor.NeswResize -> java.awt.Cursor.NE_RESIZE_CURSOR
            CssCursor.NotAllowed -> error("drawn")
        },
    ),
)

// ui-monospace is SF Mono on a Mac, which CoreText names .AppleSystemUIFontMonospaced.
@OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)
internal actual val monospace: FontFamily by lazy {
    val stack = listOf(".AppleSystemUIFontMonospaced", "SF Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace")
    stack.firstOrNull { FontMgr.default.matchFamily(it).count() > 0 }?.let { FontFamily(SystemFont(it)) } ?: FontFamily.Monospace
}
