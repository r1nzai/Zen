package dev.rinzai.zen.web

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.ComposeViewport
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Embed
import dev.rinzai.zen.HostWindow
import dev.rinzai.zen.showcase.MusicShowcase
import dev.rinzai.zen.showcase.budget.BudgetShowcase
import dev.rinzai.zen.showcase.Story
import dev.rinzai.zen.showcase.StoryLayout
import kotlinx.browser.document

private fun param(name: String): String? = js("new URLSearchParams(location.search).get(name)")

// To the page this is framed in, so it can make the frame as tall as the example.
private fun tellHeight(height: Double): Unit = js("parent !== window && parent.postMessage({ zenHeight: height, story: new URLSearchParams(location.search).get('story') }, '*')")

// The framing page's theme switch: { zenTheme: 'light' | 'dark' }.
private fun onTheme(set: (String) -> Unit): Unit = js("addEventListener('message', (e) => { if (e.source === parent && typeof e.data?.zenTheme === 'string') set(e.data.zenTheme); })")

// The framing page's viewport width and the padding it frames the example with, as it resizes: { zenViewport, zenPad } in px.
private fun onViewport(set: (Double, Double) -> Unit): Unit = js("addEventListener('message', (e) => { if (e.source === parent && typeof e.data?.zenViewport === 'number') set(e.data.zenViewport, e.data.zenPad); })")

// Where the frame is in the framing page's window, as it scrolls and resizes, and its backdrop's aurora clock:
// { zenHost: { x, y, width, height, aurora } } in px and ms.
// Asked for once listening: the page may have told it before this ran.
private fun onHost(set: (Double, Double, Double, Double, Double) -> Unit): Unit = js("(addEventListener('message', (e) => { const h = e.source === parent && e.data?.zenHost; if (h) set(h.x, h.y, h.width, h.height, h.aurora); }), parent !== window && parent.postMessage({ zenAskHost: true }, '*'))")

private fun appearanceOf(name: String?) = if (name == "light") Appearance.Light else Appearance.Dark

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    val story = param("story")
    var appearance by mutableStateOf(appearanceOf(param("theme")))
    onTheme { appearance = appearanceOf(it) }
    var embed by mutableStateOf(param("vw")?.toDoubleOrNull()?.let { Embed(it.dp) })
    var padding by mutableStateOf(param("pad")?.toIntOrNull()?.dp ?: 16.dp)
    onViewport { width, pad -> embed = Embed(width.dp); padding = pad.dp }
    var host by mutableStateOf<HostWindow?>(null)
    onHost { x, y, w, h, aurora -> host = HostWindow(DpOffset(x.dp, y.dp), DpSize(w.dp, h.dp), aurora.toLong()) }
    val layout = StoryLayout.entries.firstOrNull { it.name.equals(param("layout"), ignoreCase = true) } ?: StoryLayout.Centered
    ComposeViewport(document.body!!) {
        val nav = param("nav") != "0"
        if (story == null) {
            if (param("app") == "budget") BudgetShowcase(appearance, nav, host) else MusicShowcase(appearance, nav, host)
        } else Story(story, appearance, layout, padding, embed, host, onHeight = { tellHeight(it.value.toDouble()) })
    }
}
