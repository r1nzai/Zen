package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.fromKeyword
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.platform.Font
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.await
import kotlinx.coroutines.launch
import org.khronos.webgl.ArrayBuffer
import org.khronos.webgl.Int8Array
import org.khronos.webgl.toByteArray
import kotlin.js.Promise

private fun matches(query: String): Boolean = js("window.matchMedia(query).matches")

internal actual val coarsePointer: Boolean = matches("(pointer: coarse)")

@Composable
internal actual fun systemReducedMotion(): Boolean = remember { matches("(prefers-reduced-motion: reduce)") }

private fun colorScheme(scheme: String): Unit = js("document.documentElement.style.colorScheme = scheme")

// The page's own scheme, as the web library's stylesheet sets it: scrollbars and controls follow.
@Composable
internal actual fun ColorScheme(appearance: Appearance) {
    SideEffect { colorScheme(if (appearance == Appearance.Light) "light" else "dark") }
}

private fun vibrate(ms: Int): Unit = js("navigator.vibrate?.(ms)")

// As the web library taps: 5ms as a dragged item takes a new place, 8ms as a swipe crosses where letting go acts.
internal actual val platformHaptics: androidx.compose.ui.hapticfeedback.HapticFeedback? = object : androidx.compose.ui.hapticfeedback.HapticFeedback {
    override fun performHapticFeedback(hapticFeedbackType: androidx.compose.ui.hapticfeedback.HapticFeedbackType) {
        when (hapticFeedbackType) {
            androidx.compose.ui.hapticfeedback.HapticFeedbackType.SegmentFrequentTick -> vibrate(5)
            androidx.compose.ui.hapticfeedback.HapticFeedbackType.SegmentTick -> vibrate(8)
        }
    }
}

@OptIn(ExperimentalComposeUiApi::class)
internal actual fun grabCursor(grabbing: Boolean) = PointerIcon.fromKeyword(if (grabbing) "grabbing" else "grab")

@OptIn(ExperimentalComposeUiApi::class)
internal actual fun cssCursor(cursor: CssCursor) = PointerIcon.fromKeyword(
    when (cursor) {
        CssCursor.Move -> "move"
        CssCursor.NsResize -> "ns-resize"
        CssCursor.EwResize -> "ew-resize"
        CssCursor.NwseResize -> "nwse-resize"
        CssCursor.NeswResize -> "nesw-resize"
        CssCursor.NotAllowed -> "not-allowed"
    },
)

private fun fetchBytes(url: String): Promise<ArrayBuffer> = js("fetch(url).then((r) => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))")

// Noto Sans Mono's Latin, variable from 400 to 700: other scripts come with Compose's own Noto fallbacks.
private const val NOTO_SANS_MONO = "https://fonts.gstatic.com/s/notosansmono/v37/BngcUXNETWXI6LwhGYvaxZikqZqK6fBq6kPvUce2oAZ2evCj.woff2"

private val mono = mutableStateOf<FontFamily?>(null)
private var fetching = false

/**
 * A page's Compose sees no system fonts, so ui-monospace (the OS's) can't be had: this is Noto Sans
 * Mono, fetched from Google Fonts as Compose fetches its fallbacks, and Monospace until it comes.
 */
@OptIn(ExperimentalTextApi::class)
internal actual val monospace: FontFamily
    get() {
        mono.value?.let { return it }
        if (!fetching) {
            fetching = true
            MainScope().launch {
                val bytes = runCatching { Int8Array(fetchBytes(NOTO_SANS_MONO).await<ArrayBuffer>()).toByteArray() }.getOrNull() ?: return@launch
                mono.value = FontFamily(
                    listOf(400, 500, 600, 700).map { w ->
                        Font("Noto Sans Mono $w", bytes, FontWeight(w), variationSettings = FontVariation.Settings(FontVariation.weight(w)))
                    },
                )
            }
        }
        return FontFamily.Monospace
    }
