package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

private fun trackPointer(): Unit = js(
    """{
    if (globalThis.zenPointer) return;
    globalThis.zenPointer = { x: 0, y: 0, titled: null };
    addEventListener('pointermove', (e) => { globalThis.zenPointer.x = e.clientX; globalThis.zenPointer.y = e.clientY; }, { capture: true, passive: true });
}""",
)

private fun showTitle(text: String?): Unit = js(
    """{
    const p = globalThis.zenPointer;
    p.titled?.removeAttribute('title');
    p.titled = null;
    if (text == null) return;
    const el = document.elementFromPoint(p.x, p.y);
    if (!el) return;
    el.setAttribute('title', text);
    p.titled = el;
}""",
)

// The browser's own title tooltip, on the element the pointer is over (the page's Compose surface).
@Composable
internal actual fun rememberPlatformTitle(): (String?) -> Unit = remember {
    trackPointer()
    ::showTitle
}
