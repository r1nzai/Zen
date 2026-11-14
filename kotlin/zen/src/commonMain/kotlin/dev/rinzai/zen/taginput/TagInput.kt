package dev.rinzai.zen.taginput

import dev.rinzai.zen.ScrollArea
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.inputIntrinsicWidth
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.selection

/**
 * A field of short values (tags, emails, labels): typing one and pressing Enter or a comma adds
 * it, pasting a list adds each, Backspace in the empty field takes the last one back. Each is
 * removed with its ×. Values are trimmed and kept once. Past about three rows the tags scroll,
 * under a typing line that stays in view.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TagInput(
    value: List<String>,
    onValueChange: (List<String>) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    label: String? = null,
    /** Whether an entry may be added (e.g. looks like an email). */
    validate: ((String) -> Boolean)? = null,
    /** The × button's label, for screen readers. */
    removeLabel: ((String) -> String)? = null,
    enabled: Boolean = true,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val remove = removeLabel ?: m::remove
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    var field by remember { mutableStateOf(TextFieldValue()) }
    var within by remember { mutableStateOf(false) }
    val source = remember { MutableInteractionSource() }
    val focus = remember { FocusRequester() }
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    val scroll = rememberScrollState()

    fun add(entries: List<String>) {
        val next = current.toMutableList()
        for (entry in entries.map { it.trim() }) {
            if (entry.isNotEmpty() && entry !in next && validate?.invoke(entry) != false) next += entry
        }
        if (next.size != current.size) change(next)
    }
    fun commit(): Boolean {
        if (field.text.isBlank()) return false
        add(listOf(field.text))
        field = TextFieldValue()
        return true
    }

    // While typing them in, show the newest tags (once they're laid out).
    LaunchedEffect(value.size) {
        if (!within) return@LaunchedEffect
        withFrameNanos {}
        scroll.scrollTo(scroll.maxValue)
    }

    Column(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .fillMaxWidth()
            .heightIn(min = 40.dp, max = 144.dp)
            .onFocusChanged { within = it.hasFocus }
            .hoverable(source, enabled)
            .pointerHoverIcon(PointerIcon.Text)
            .pointerInput(enabled) { if (enabled) detectTapGestures { focus.requestFocus() } }
            .fieldBox(FieldSize.Default, hovered && !coarsePointer && enabled, focused, height = null)
            .padding(vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (value.isNotEmpty()) ScrollArea(Modifier.weight(1f, fill = false), vertical = scroll) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (tag in value) key(tag) { Tag(tag, remove(tag), enabled) { change(current - tag) } }
            }
        }
        val style = TextStyles.sm.copy(color = t.foreground.color())
        CompositionLocalProvider(LocalTextSelectionColors provides t.selection) {
            BasicTextField(
                field,
                { next ->
                    val old = field
                    // What this change put in place of the selection: one key's worth, or a paste.
                    val before = old.text.substring(0, old.selection.min)
                    val after = old.text.substring(old.selection.max)
                    val inserted = if (next.composition == null && next.text.length >= before.length + after.length && next.text.startsWith(before) && next.text.endsWith(after)) {
                        next.text.substring(before.length, next.text.length - after.length)
                    } else null
                    when {
                        inserted == "," && old.text.isNotBlank() -> {
                            add(listOf(old.text))
                            field = TextFieldValue()
                        }
                        inserted != null && inserted.length > 1 && inserted.any { it == ',' || it == '\n' } -> add(inserted.split(',', '\n'))
                        else -> field = next
                    }
                },
                Modifier
                    .inputIntrinsicWidth(style.fontSize)
                    .fillMaxWidth()
                    .height(28.dp)
                    .focusRequester(focus)
                    .onFocusChanged { if (!it.isFocused) commit() }
                    .onPreviewKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                        when {
                            e.key == Key.Enter || e.key == Key.NumPadEnter -> commit()
                            e.key == Key.Backspace && field.text.isEmpty() && current.isNotEmpty() -> {
                                val last = current.last()
                                field = TextFieldValue(last, TextRange(last.length))
                                change(current.dropLast(1))
                                true
                            }
                            else -> false
                        }
                    }
                    .fieldControl(label),
                enabled = enabled,
                singleLine = true,
                textStyle = style,
                cursorBrush = SolidColor(t.foreground.color()),
                interactionSource = source,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (!commit()) defaultKeyboardAction(ImeAction.Done) }),
                decorationBox = { inner ->
                    // The text spans the field, so its textAlign places it in the whole width.
                    Box(contentAlignment = Alignment.CenterStart, propagateMinConstraints = true) {
                        if (field.text.isEmpty() && placeholder != null) {
                            Text(placeholder, Modifier.fillMaxWidth(), style = style.copy(color = t.placeholder), maxLines = 1)
                        }
                        inner()
                    }
                },
            )
        }
    }
}

@Composable
private fun Tag(tag: String, removeLabel: String, enabled: Boolean, onRemove: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    Row(
        Modifier
            .box(Zen.radii.md, fill = SolidColor(t.primary.color(0.12f)), shadows = listOf(Shadow(spread = 1f, color = t.primary.color(0.25f), inset = true)))
            .padding(start = 8.dp, end = 4.dp, top = 2.dp, bottom = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(tag, style = TextStyles.xs, color = t.foreground.color())
        Box(
            Modifier
                .size(16.dp)
                .box(Zen.radii.sm, fill = if (state.hovered) SolidColor(t.tint.color(0.1f)) else null, shadows = focusRing(state.focusVisible))
                .control(state, enabled) { onRemove() }
                .semantics { contentDescription = removeLabel },
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.XMark, size = 12.dp, color = if (state.hovered) t.foreground.color() else t.mutedForeground.color())
        }
    }
}
