package dev.rinzai.zen

import androidx.compose.runtime.Composable
import java.awt.MouseInfo
import java.awt.Window
import javax.swing.JComponent
import javax.swing.SwingUtilities

// Swing's tooltip, on the component the pointer is over (the window's Compose surface): it shows after the
// platform's delay and follows its look, as a browser's title tooltip does.
@Composable
internal actual fun rememberPlatformTitle(): (String?) -> Unit = ::swingTitle

private var titled: JComponent? = null

private fun swingTitle(text: String?) {
    if (text == null) {
        titled?.toolTipText = null
        titled = null
        return
    }
    val at = runCatching { MouseInfo.getPointerInfo()?.location }.getOrNull() ?: return
    val window = Window.getWindows().firstOrNull { it.isShowing && it.bounds.contains(at) } ?: return
    val local = java.awt.Point(at).also { SwingUtilities.convertPointFromScreen(it, window) }
    val component = SwingUtilities.getDeepestComponentAt(window, local.x, local.y) as? JComponent ?: return
    titled = component
    component.toolTipText = text
}
