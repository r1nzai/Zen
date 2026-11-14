package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ClipEntry
import androidx.compose.ui.platform.Clipboard
import androidx.compose.ui.platform.LocalClipboard
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Plain text as the platform's clipboard holds it. */
internal expect fun plainText(text: String): ClipEntry

/** Copies text to the system clipboard; `copied` says one just worked. See rememberCopyToClipboard. */
@Stable
class CopyToClipboard internal constructor(private val clipboard: Clipboard, private val scope: CoroutineScope) {
    // A new object per copy, so copying again restarts the countdown.
    internal var last by mutableStateOf<Any?>(null)
    private var latest = 0

    /** True for a while (`resetAfter`) after a copy that worked. */
    val copied: Boolean get() = last != null

    /** Copies `text`; false when nothing was copied (the platform refused). */
    suspend fun copy(text: String): Boolean {
        val id = ++latest
        val ok = runCatching { clipboard.setClipEntry(plainText(text)) }.isSuccess
        // A copy that settles after a newer one doesn't override it.
        if (id == latest) last = if (ok) Any() else null
        return ok
    }

    /** Copies `text` without waiting for the result. */
    fun copyNow(text: String) {
        scope.launch { copy(text) }
    }
}

/** Copies text to the clipboard. `copied` is true for `resetAfter` ms after a copy that worked. */
@Composable
fun rememberCopyToClipboard(resetAfter: Long = 1500): CopyToClipboard {
    val clipboard = LocalClipboard.current
    val scope = rememberCoroutineScope()
    val state = remember(clipboard) { CopyToClipboard(clipboard, scope) }
    LaunchedEffect(state.last) {
        if (state.last == null) return@LaunchedEffect
        delay(resetAfter)
        state.last = null
    }
    return state
}
