package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.yield

/**
 * A popup shown while its trigger is pointed at or has keyboard focus (Tooltip's, HoverCard's):
 * after `openDelay` for a mouse, hidden `closeDelay` after it leaves (so it can move onto the
 * popup), when focus leaves for anywhere but the popup, and on Escape.
 */
@Stable
internal class HoverPopup(val popup: PopupState, private val scope: CoroutineScope, val openDelay: Long, val closeDelay: Long) {
    private var timer: Job? = null

    /** Focus is in the popup (a link in a hover card): the trigger losing it then keeps it open. */
    var focusInside = false

    fun show() = after(true, 0)
    fun hide() = after(false, 0)
    fun hideSoon() = after(false, closeDelay)

    fun after(open: Boolean, delay: Long) {
        timer?.cancel()
        timer = null
        if (delay == 0L) popup.set(open)
        else timer = scope.launch {
            delay(delay)
            popup.set(open)
        }
    }

    fun cancel() = timer?.cancel()
}

@Composable
internal fun rememberHoverPopup(openDelay: Long, closeDelay: Long): HoverPopup {
    val popup = rememberPopupState()
    // Manual: it doesn't close other popups, and the trigger decides when it shows.
    popup.lightDismiss = false
    val scope = rememberCoroutineScope()
    val hover = remember(popup, openDelay, closeDelay) { HoverPopup(popup, scope, openDelay, closeDelay) }
    DisposableEffect(hover) { onDispose { hover.cancel() } }
    return hover
}

/** The trigger: anchors the popup, and shows and hides it as it's pointed at and focused. */
@Composable
internal fun Modifier.hoverPopupTrigger(hover: HoverPopup): Modifier {
    val page = LocalPage.current
    val scope = rememberCoroutineScope()
    return this
        .popupAnchor(hover.popup)
        .pointerInput(hover) {
            awaitPointerEventScope {
                while (true) {
                    val e = awaitPointerEvent()
                    val mouse = e.changes.firstOrNull()?.type == PointerType.Mouse
                    when (e.type) {
                        PointerEventType.Enter -> if (mouse) hover.after(true, hover.openDelay)
                        PointerEventType.Exit -> hover.hideSoon()
                    }
                }
            }
        }
        .onFocusChanged {
            // Keyboard focus only: a click focusing the trigger shouldn't pop it open.
            if (it.isFocused) {
                if (page.keyboard) hover.show()
            } else scope.launch {
                // Focus may be on its way into the popup: wait for it to land.
                yield()
                if (!hover.focusInside) hover.hide()
            }
        }
        .onKeyEvent { e -> hover.escape(e) }
}

/** The popup itself: pointed at it stays; left, it goes as from the trigger; Escape or focus leaving hides it. */
internal fun Modifier.hoverPopupContent(hover: HoverPopup): Modifier = this
    .pointerInput(hover) {
        awaitPointerEventScope {
            while (true) {
                when (awaitPointerEvent().type) {
                    PointerEventType.Enter -> hover.show()
                    PointerEventType.Exit -> hover.hideSoon()
                }
            }
        }
    }
    .onFocusChanged {
        val left = hover.focusInside && !it.hasFocus
        hover.focusInside = it.hasFocus
        if (left) hover.hide()
    }
    .onKeyEvent { e -> hover.escape(e) }

private fun HoverPopup.escape(e: androidx.compose.ui.input.key.KeyEvent): Boolean =
    if (e.type == KeyEventType.KeyDown && e.key == Key.Escape && popup.open) {
        hide()
        true
    } else false
