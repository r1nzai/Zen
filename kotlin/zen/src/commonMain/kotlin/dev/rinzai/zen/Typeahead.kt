package dev.rinzai.zen

import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.utf16CodePoint
import kotlin.time.TimeMark
import kotlin.time.TimeSource

/** Type to jump, as in a native list: keys typed within 700ms of each other search together. */
internal class Typeahead {
    private var text = ""
    private var at: TimeMark? = null

    /** What's been typed so far, lower case, when `e` is a letter, digit or sign; else null. */
    fun typed(e: KeyEvent): String? {
        val ch = e.utf16CodePoint
        if (ch <= 32 || e.isCtrlPressed || e.isMetaPressed || e.isAltPressed) return null
        val recent = at?.let { it.elapsedNow().inWholeMilliseconds < 700 } ?: false
        text = (if (recent) text else "") + ch.toChar().lowercaseChar()
        at = TimeSource.Monotonic.markNow()
        return text
    }
}
