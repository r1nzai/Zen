package dev.rinzai.zen.desktop

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.tooling.ComposeToolingApi
import androidx.compose.ui.InternalComposeUiApi
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.showcase.MusicShowcase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.awt.Robot
import java.awt.event.KeyEvent

/**
 * The showcase in a real window (on the second display), driven by the OS's own key presses: what
 * has focus after each, where it is, as the off-screen snapshot reports it but with a window's frames.
 * Args: width height [dark|light] tabs [back], back being Shift+Tabs after the tabs
 */
@OptIn(InternalComposeUiApi::class, ComposeToolingApi::class)
fun main(args: Array<String>) {
    val (w, h) = args[0].toInt() to args[1].toInt()
    val appearance = if (args.getOrNull(2) == "light") Appearance.Light else Appearance.Dark
    val tabs = args.getOrNull(3)?.toInt() ?: 0
    val back = args.getOrNull(4)?.toInt() ?: 0
    application {
        val state = rememberWindowState(position = WindowPosition(2600.dp, 40.dp), size = DpSize(w.dp, h.dp))
        Window(onCloseRequest = ::exitApplication, state = state, undecorated = true, title = "Zen window shot") {
            MusicShowcase(appearance)
            LaunchedEffect(Unit) {
                delay(3000)
                val robot = Robot()
                repeat(tabs + back) { i ->
                    val shift = i >= tabs
                    withContext(Dispatchers.IO) {
                        if (shift) robot.keyPress(KeyEvent.VK_SHIFT)
                        robot.keyPress(KeyEvent.VK_TAB)
                        robot.keyRelease(KeyEvent.VK_TAB)
                        if (shift) robot.keyRelease(KeyEvent.VK_SHIFT)
                    }
                    delay(400)
                    println("focus ${if (shift) "Shift+Tab" else "Tab"}: ${focused(window.semanticsOwners)}")
                }
                exitApplication()
            }
        }
    }
}
