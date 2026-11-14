package dev.rinzai.zen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.unit.dp

/** A native checkbox or radio answers Space, not Enter (that submits the form it's in). */
internal fun Modifier.spaceOnly(): Modifier = onPreviewKeyEvent { it.key == Key.Enter || it.key == Key.NumPadEnter }

/**
 * A checkbox's or radio's label around it: the box (a hair down, to sit on the first line), then
 * the label and a muted description under it. Dimmed while disabled.
 */
@Composable
internal fun ChoiceLabel(
    modifier: Modifier,
    enabled: Boolean,
    description: (@Composable () -> Unit)?,
    box: @Composable () -> Unit,
    content: @Composable () -> Unit,
) {
    ProvideText(style = TextStyles.sm) {
        Row(modifier.alpha(if (enabled) 1f else 0.6f), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
            Box(Modifier.padding(top = 1.dp)) { box() }
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                content()
                if (description != null) ProvideText(Zen.tokens.mutedForeground.color(), TextStyles.xs) { description() }
            }
        }
    }
}

/** The options of a radio group, as a native one sees them: in reading order, one tab stop. */
@Stable
internal class Radios<V> {
    var value by mutableStateOf<V?>(null)
    var select: (V) -> Unit = {}
    var enabled by mutableStateOf(true)
    var rtl = false
    val entries = mutableStateListOf<Entry<V>>()

    /** Arrowed to and not yet chosen by the owner: it keeps the tab stop meanwhile. */
    var pending by mutableStateOf<V?>(null)

    class Entry<V>(val value: V) {
        val focus = FocusRequester()
        var enabled by mutableStateOf(true)
        var at by mutableStateOf(Offset.Zero)
    }

    private val ordered get() = entries.sortedWith(compareBy({ it.at.y }, { if (rtl) -it.at.x else it.at.x }))

    /** Tabbing stops at the chosen option, or the first that can be chosen while none is. */
    fun isStop(e: Entry<V>): Boolean {
        val usable = ordered.filter { it.enabled && enabled }
        val chosen = usable.firstOrNull { it.value == (pending ?: value) }
        return e == (chosen ?: usable.firstOrNull())
    }

    /** Arrow keys move to the next option that can be chosen, round from either end, and choose it. */
    fun step(from: Entry<V>, forward: Boolean): Boolean {
        val usable = ordered.filter { it.enabled }
        if (usable.size < 2) return false
        val i = usable.indexOf(from).takeIf { it >= 0 } ?: return false
        val to = usable[(i + if (forward) 1 else usable.size - 1) % usable.size]
        pending = to.value
        select(to.value)
        to.focus.requestFocus()
        return true
    }
}

/** One option of `radios`: its place in the reading order, the tab stop, and the arrow keys. */
@Composable
internal fun <V> Modifier.radio(radios: Radios<V>, value: V, enabled: Boolean): Modifier {
    val entry = remember(value) { Radios.Entry(value) }
    entry.enabled = enabled
    DisposableEffect(entry) {
        radios.entries += entry
        onDispose { radios.entries -= entry }
    }
    return this
        .onGloballyPositioned { entry.at = it.positionInRoot() }
        .focusRequester(entry.focus)
        .focusProperties { canFocus = radios.isStop(entry) }
        .onKeyEvent { e ->
            if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
            when (e.key) {
                Key.DirectionDown -> radios.step(entry, true)
                Key.DirectionUp -> radios.step(entry, false)
                Key.DirectionRight -> radios.step(entry, !radios.rtl)
                Key.DirectionLeft -> radios.step(entry, radios.rtl)
                else -> false
            }
        }
        .spaceOnly()
}

/** A radio group's options, choosing `value` and telling `onValueChange`. */
@Composable
internal fun <V> rememberRadios(value: V?, onValueChange: (V) -> Unit, enabled: Boolean): Radios<V> {
    val radios = remember { Radios<V>() }
    radios.value = value
    radios.select = onValueChange
    radios.enabled = enabled
    radios.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    LaunchedEffect(value) { radios.pending = null }
    return radios
}
