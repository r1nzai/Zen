package dev.rinzai.zen.desktop

import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.MenuBar
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import dev.rinzai.zen.showcase.MusicShowcase
import dev.rinzai.zen.showcase.Story
import dev.rinzai.zen.showcase.StoryLayout

/**
 * The docs' component pages in a window (View switches to the music and budget showcases), or
 * with `-Pstory=a,b` those component stories, picked from the Stories menu (one window: WSL's OpenGL stalls with several). `-Pat=x,y` opens it there.
 */
fun main() = application {
    val at = System.getProperty("zen.at")?.takeIf { it.isNotEmpty() }?.split(",")?.map { it.trim().toFloat() }
    val stories = System.getProperty("zen.story")?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }.orEmpty()
    val position = at?.let { WindowPosition(it[0].dp, it[1].dp) } ?: WindowPosition.PlatformDefault
    if (stories.isEmpty()) {
        var view by remember { mutableStateOf("Docs") }
        // -Dzen.page=<title> opens that page.
        var page by remember { mutableStateOf(DocPages.indexOfFirst { it.title == System.getProperty("zen.page") }.coerceAtLeast(0)) }
        val state = rememberWindowState(position = position, size = DpSize(1280.dp, 800.dp))
        Window(onCloseRequest = ::exitApplication, state = state, title = if (view == "Docs") "Zen · ${DocPages[page].title}" else "Zen $view") {
            MenuBar {
                Menu("View") {
                    for (v in listOf("Docs", "Music", "Budget")) RadioButtonItem(v, selected = v == view, onClick = { view = v })
                }
            }
            when (view) {
                "Docs" -> Docs(page) { page = it }
                "Music" -> MusicShowcase()
                else -> Story("showcase--budget", layout = StoryLayout.Fullscreen)
            }
        }
    } else {
        var shown by remember { mutableStateOf(stories.first()) }
        val state = rememberWindowState(position = position, size = DpSize(760.dp, 460.dp))
        Window(onCloseRequest = ::exitApplication, state = state, title = shown) {
            MenuBar {
                Menu("Stories") {
                    stories.forEach { id -> RadioButtonItem(id, selected = id == shown, onClick = { shown = id }) }
                }
            }
            key(shown) { Story(shown) }
        }
    }
}
