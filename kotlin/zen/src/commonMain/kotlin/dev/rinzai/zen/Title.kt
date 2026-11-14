package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput

/** Shows (or, with null, hides) the platform's own tooltip, as a browser shows a `title`. */
@Composable
internal expect fun rememberPlatformTitle(): (String?) -> Unit

/**
 * The HTML title attribute: the platform's own tooltip with `text`, while a mouse rests on it (a
 * finger doesn't hover, so touch shows nothing, as in a browser).
 */
@Composable
fun Modifier.title(text: String?): Modifier {
    if (text == null) return this
    val show = rememberPlatformTitle()
    val current by rememberUpdatedState(text)
    return pointerInput(show) {
        awaitPointerEventScope {
            var over = false
            while (true) {
                val e = awaitPointerEvent()
                if (e.changes.firstOrNull()?.type != PointerType.Mouse) continue
                when (e.type) {
                    PointerEventType.Enter, PointerEventType.Move -> if (!over) { over = true; show(current) }
                    PointerEventType.Exit -> if (over) { over = false; show(null) }
                }
            }
        }
    }
}
