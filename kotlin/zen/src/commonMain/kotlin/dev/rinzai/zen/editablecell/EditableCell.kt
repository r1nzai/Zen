package dev.rinzai.zen.editablecell

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/**
 * A value edited in place, e.g. in a table cell: shows `text` as a button, and on click (or
 * Enter) swaps in your `editor`, focused. Call `close()` from the editor when it's done
 * (committed or cancelled). Works with any editor: a compact MoneyInput, an Input, a Select. A
 * value changed by an edit glows briefly when the editor closes. `content` draws the value your
 * own way (the text is still what's compared).
 */
@Composable
fun EditableCell(
    text: String,
    editor: @Composable (close: () -> Unit) -> Unit,
    modifier: Modifier = Modifier,
    /** Accessible name of the value, e.g. "Rent, Oct 2026: ₹18,500"; ". Edit" is added for the button. */
    label: String? = null,
    /** Show the value without making it editable. */
    readOnly: Boolean = false,
    /** Control the editing state yourself (with onEditingChange). */
    editing: Boolean? = null,
    onEditingChange: ((Boolean) -> Unit)? = null,
    textAlign: TextAlign = TextAlign.End,
    content: (@Composable () -> Unit)? = null,
) {
    val t = Zen.tokens
    var own by remember { mutableStateOf(false) }
    val open = editing ?: own
    fun set(to: Boolean) {
        if (editing == null) own = to
        onEditingChange?.invoke(to)
    }
    var before by remember { mutableStateOf<String?>(null) }
    // The glow of a changed value: from primary/22% and a soft glow to nothing, over 1s.
    val changed = remember { Animatable(0f) }
    LaunchedEffect(open) {
        if (!open && before != null && before != text) {
            changed.snapTo(1f)
            changed.animateTo(0f, tween(1000, easing = Ease.OutSoft))
        }
    }
    val shown = @Composable {
        if (content != null) content() else Text(text, Modifier.fillMaxWidth(), style = TextStyles.sm.merge(TextStyles.tabular).copy(textAlign = textAlign))
    }
    if (readOnly) return Box(modifier.padding(horizontal = 4.dp)) { shown() }
    if (open) {
        val focus = remember { FocusRequester() }
        // autofocus: the editor takes focus as it appears.
        LaunchedEffect(Unit) {
            withFrameNanos {}
            runCatching { focus.requestFocus() }
        }
        return Box(modifier.focusRequester(focus).focusGroup()) { editor { set(false) } }
    }
    val state = rememberControlState()
    val hover by animateColorAsState(t.primary.color(if (state.hovered) 0.1f else 0f), transition(150, Ease.Css))
    val glow = changed.value
    Box(
        modifier
            .fillMaxWidth()
            .box(
                Zen.radii.md,
                fill = SolidColor(t.primary.color(0.22f * glow).compositeOver(hover)),
                shadows = focusRing(state.focusVisible) + if (glow > 0f) listOf(Shadow(blur = 14f, color = t.glow.color(0.45f * t.glowK * glow))) else emptyList(),
            )
            .control(state) {
                before = text
                set(true)
            }
            .then(if (label != null) Modifier.semantics { contentDescription = "$label. Edit" } else Modifier)
            .padding(horizontal = 6.dp, vertical = 2.dp),
    ) { shown() }
}
