package dev.rinzai.zen

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection

/** One control in a Roving group. */
internal class RovingItem {
    val focus = FocusRequester()
    var enabled by mutableStateOf(true)
    var preferred by mutableStateOf(false)
    var at by mutableStateOf(Offset.Zero)
    var select: () -> Unit = {}
}

/**
 * A group Tab enters once (a Toolbar, a ToggleGroup): its stop is the control last focused, else
 * the `preferred` one (e.g. the pressed one), else the first. The arrow keys move through it in
 * reading order (←→, or ↑↓ for a column), Home and End jump to the ends, wrapping round.
 * Where `selects` (a tab list), the stop is always the preferred (selected) one, and moving to
 * one selects it.
 */
@Stable
internal class Roving(val orientation: Orientation, val selects: Boolean = false) {
    val items = mutableStateListOf<RovingItem>()
    var last by mutableStateOf<RovingItem?>(null)

    /** Where `selects`, moved to and not yet selected by the owner: it's the stop meanwhile. */
    var pending by mutableStateOf<RovingItem?>(null)
    var rtl = false

    private val ordered: List<RovingItem>
        get() = items.filter { it.enabled }.sortedWith(
            if (orientation == Orientation.Horizontal) compareBy({ if (rtl) -it.at.x else it.at.x }, { it.at.y })
            else compareBy({ it.at.y }, { it.at.x }),
        )

    fun isStop(item: RovingItem): Boolean {
        val o = ordered
        if (selects) return item == (pending ?: o.firstOrNull { it.preferred })
        return item == (o.firstOrNull { it == last } ?: o.firstOrNull { it.preferred } ?: o.firstOrNull())
    }

    fun key(from: RovingItem, key: Key): Boolean {
        val o = ordered
        val i = o.indexOf(from).takeIf { it >= 0 } ?: return false
        val (back, forward) = if (orientation == Orientation.Horizontal) {
            // In reading order: ← is forward in a right-to-left row.
            if (rtl) Key.DirectionRight to Key.DirectionLeft else Key.DirectionLeft to Key.DirectionRight
        } else Key.DirectionUp to Key.DirectionDown
        val to = when (key) {
            forward -> i + 1
            back -> i - 1
            Key.MoveHome -> 0
            Key.MoveEnd -> o.size - 1
            else -> return false
        }
        val next = o[(to + o.size) % o.size]
        last = next
        if (selects) {
            pending = next
            next.select()
        }
        next.focus.requestFocus()
        return true
    }
}

internal val LocalRoving = staticCompositionLocalOf<Roving?> { null }

/** A Roving group for the content composed with it; one inside another's leaves its controls to that one. */
@Composable
internal fun rememberRoving(orientation: Orientation, selects: Boolean = false): Roving {
    val roving = remember(orientation, selects) { Roving(orientation, selects) }
    roving.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    return roving
}

/**
 * Makes this control one of the enclosing Roving group's, if it's in one; `preferred` makes it the
 * stop until one's focused; `select` is what moving to it does in a group that `selects`.
 */
@Composable
internal fun Modifier.rovingItem(enabled: Boolean = true, preferred: Boolean = false, select: () -> Unit = {}): Modifier {
    val roving = LocalRoving.current ?: return this
    val item = remember { RovingItem() }
    item.enabled = enabled
    item.preferred = preferred
    item.select = select
    LaunchedEffect(preferred) { if (preferred && roving.pending === item) roving.pending = null }
    DisposableEffect(roving, item) {
        roving.items += item
        onDispose {
            roving.items -= item
            if (roving.last === item) roving.last = null
            if (roving.pending === item) roving.pending = null
        }
    }
    return this
        .onGloballyPositioned { item.at = it.positionInRoot() }
        .focusRequester(item.focus)
        .focusProperties { canFocus = roving.isStop(item) }
        .onFocusChanged { if (it.isFocused) roving.last = item }
        .onKeyEvent { it.type == KeyEventType.KeyDown && roving.key(item, it.key) }
}
