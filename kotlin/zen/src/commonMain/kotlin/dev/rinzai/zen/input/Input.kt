package dev.rinzai.zen.input

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.ui.text.TextRange

import androidx.compose.ui.text.input.TextFieldValue

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalContentColor
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.inputIntrinsicWidth
import dev.rinzai.zen.control
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.selection
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor

/** What an input is for, where it changes how it behaves: a search field clears with Escape or its ✕. */
/** What a field takes: text, a search (cleared with Escape or its button), or an amount (a decimal keypad on a phone, as inputMode="decimal"). */
enum class InputType {
    Text, Search, Decimal,

    /** Whole numbers (inputmode=numeric): a digits keyboard. */
    Numeric,

    /**
     * A number (type=number): only a number's characters go in, and the up and down arrows step it
     * by 1 within the field's `min` and `max`.
     */
    Number,
}

private val NumberChars = Regex("[0-9eE+\\-.]*")

/** type=number's stepUp/stepDown: to the next whole step from `min` (else 0) in that direction, kept within min and max. */
internal fun stepNumber(value: String, up: Boolean, min: Double?, max: Double?): String? {
    val v = value.toDoubleOrNull() ?: 0.0
    if (up && max != null && v >= max || !up && min != null && v <= min) return null
    val base = min ?: 0.0
    val n = v - base
    var next = base + if (up) floor(n) + 1 else ceil(n) - 1
    if (min != null) next = maxOf(min, next)
    if (max != null) next = minOf(max, next)
    return if (next == floor(next) && abs(next) < 1e15) next.toLong().toString() else next.toString()
}

/**
 * The text in a field: the value, a placeholder while it's empty, and (a search) a clear button.
 * Shared by Input and InputGroupInput, which draw the box around it. With `padding` (an Input's),
 * the padding and clear button are inside the text field, as an <input>'s are: a press anywhere in
 * the box focuses it and places the caret.
 */
@Composable
private fun RowScope.FieldText(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier,
    placeholder: String?,
    label: String?,
    type: InputType,
    enabled: Boolean,
    source: MutableInteractionSource,
    focus: FocusRequester,
    own: TextStyle? = null,
    padding: PaddingValues? = null,
    min: Double? = null,
    max: Double? = null,
) {
    val t = Zen.tokens
    val style = LocalTextStyle.current.merge(TextStyles.sm).merge(own).copy(color = if (enabled) t.foreground.color() else LocalContentColor.current)
    // A value set from outside (a formatted amount, a reset) puts the caret at its end, as setting
    // an input's value does; what's typed keeps it where it is.
    var field by remember { mutableStateOf(TextFieldValue(value, TextRange(value.length))) }
    if (field.text != value) field = TextFieldValue(value, TextRange(value.length))
    CompositionLocalProvider(LocalTextSelectionColors provides t.selection) {
        BasicTextField(
            field,
            { next ->
                if (type == InputType.Number && !NumberChars.matches(next.text)) return@BasicTextField
                field = next
                if (next.text != value) onValueChange(next.text)
            },
            modifier
                .weight(1f)
                .then(if (padding != null) Modifier.fillMaxHeight() else Modifier)
                .inputIntrinsicWidth(style.fontSize, padding)
                .focusRequester(focus)
                .pointerHoverIcon(PointerIcon.Text)
                // A search clears with Escape, as browsers' search fields do.
                .onPreviewKeyEvent { e ->
                    if (e.type != KeyEventType.KeyDown) false
                    else if (type == InputType.Search && e.key == Key.Escape && value.isNotEmpty()) {
                        onValueChange("")
                        true
                    } else if (type == InputType.Number && (e.key == Key.DirectionUp || e.key == Key.DirectionDown)) {
                        stepNumber(value, e.key == Key.DirectionUp, min, max)?.let(onValueChange)
                        true
                    } else false
                }
                .fieldControl(label),
            enabled = enabled,
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(t.foreground.color()),
            interactionSource = source,
            keyboardOptions = KeyboardOptions(
                keyboardType = when (type) {
                    InputType.Decimal -> KeyboardType.Decimal
                    InputType.Numeric -> KeyboardType.Number
                    InputType.Number -> KeyboardType.Decimal
                    else -> KeyboardType.Unspecified
                },
                imeAction = if (type == InputType.Search) ImeAction.Search else ImeAction.Default,
                autoCorrectEnabled = type == InputType.Text,
            ),
            decorationBox = { inner ->
                val text = @Composable {
                    // The text spans the field, so its textAlign places it in the whole width.
                    Box(if (padding != null) Modifier.weight(1f) else Modifier, contentAlignment = Alignment.CenterStart, propagateMinConstraints = true) {
                        if (value.isEmpty() && placeholder != null) {
                            Text(placeholder, Modifier.fillMaxWidth(), style = style.copy(color = t.placeholder), maxLines = 1)
                        }
                        inner()
                    }
                }
                if (padding == null) text()
                else Row(Modifier.padding(padding), verticalAlignment = Alignment.CenterVertically) {
                    text()
                    ClearButton(value, onValueChange, type, enabled, focus)
                }
            },
        )
    }
    if (padding == null) ClearButton(value, onValueChange, type, enabled, focus)
}

/** A search's ×, while there's something to clear: for a pointer only, as a browser's is; the keyboard clears with Escape. */
@Composable
private fun ClearButton(value: String, onValueChange: (String) -> Unit, type: InputType, enabled: Boolean, focus: FocusRequester) {
    if (type != InputType.Search || value.isEmpty() || !enabled) return
    val t = Zen.tokens
    val clear = rememberControlState()
    Box(
        Modifier
            .size(16.dp)
            .pointerHoverIcon(PointerIcon.Default)
            .focusProperties { canFocus = false }
            .clearAndSetSemantics {}
            .control(clear) {
                onValueChange("")
                focus.requestFocus()
            },
        contentAlignment = Alignment.Center,
    ) { Icon(Icons.XMarkMicro, size = 14.dp, color = if (clear.hovered) t.foreground.color() else t.mutedForeground.color()) }
}

/**
 * A single-line text field; `label` names it where nothing on screen does. `type = Search` gives
 * it a clear button and lets Escape clear it; `type = Number` steps within `min` and `max`.
 * `style` merges over its text's (TextStyles.tabular and a centred textAlign for
 * `text-center tabular-nums`).
 */
@Composable
fun Input(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    label: String? = null,
    type: InputType = InputType.Text,
    size: FieldSize = FieldSize.Default,
    enabled: Boolean = true,
    style: TextStyle? = null,
    min: Double? = null,
    max: Double? = null,
) {
    val source = remember { MutableInteractionSource() }
    val focus = remember { FocusRequester() }
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    Row(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .fillMaxWidth()
            .hoverable(source, enabled)
            .fieldBox(size, hovered && !coarsePointer, focused, padding = PaddingValues()),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        FieldText(value, onValueChange, Modifier, placeholder, label, type, enabled, source, focus, style, PaddingValues(horizontal = size.padding), min, max)
    }
}

private class GroupState {
    val focus = FocusRequester()
    var enabled by mutableStateOf(true)
}

private val LocalGroup = staticCompositionLocalOf<GroupState?> { null }

/**
 * A field with things inside it, before or after the input: a search icon, a unit, a button.
 * Put an InputGroupInput between InputGroupAddons. It glows as one field while the input has
 * focus; pressing its shell or an addon's text focuses the input (controls in addons keep theirs).
 * `contentPadding` replaces the space at its ends (the size's, px-3 by default); `border` colours
 * its border, focused or not (red, when invalid, still wins).
 */
@Composable
fun InputGroup(
    modifier: Modifier = Modifier,
    size: FieldSize = FieldSize.Default,
    invalid: Boolean = false,
    contentPadding: PaddingValues = PaddingValues(horizontal = size.padding),
    border: Color? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val t = Zen.tokens
    val group = remember { GroupState() }
    val hover = remember { MutableInteractionSource() }
    val hovered by hover.collectIsHoveredAsState()
    var within by remember { mutableStateOf(false) }
    Row(
        modifier
            .fillMaxWidth()
            .hoverable(hover)
            .onFocusChanged { within = it.hasFocus }
            .pointerHoverIcon(PointerIcon.Text)
            .pointerInput(group) {
                awaitEachGesture {
                    awaitFirstDown(pass = PointerEventPass.Final)
                    // Whatever took the press (the input, a control) keeps it; the shell focuses the input.
                    val up = waitForUpOrCancellation(PointerEventPass.Final) ?: return@awaitEachGesture
                    if (!up.isConsumed && group.enabled) group.focus.requestFocus()
                }
            }
            .fieldBox(size, hovered && !coarsePointer, within, invalid, background = if (group.enabled) null else t.muted.color(), padding = contentPadding, border = border),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = if (group.enabled) LocalContentColor.current else t.mutedForeground.color(), style = TextStyles.sm) {
            CompositionLocalProvider(LocalGroup provides group) { content() }
        }
    }
}

/**
 * The input inside an InputGroup: borderless, filling the space between the addons. `style` merges
 * over its text's (TextStyles.tabular and a centred textAlign for `text-center tabular-nums`). It
 * works outside one too, where the surface around it is the field (a Combobox's search).
 */
@Composable
fun RowScope.InputGroupInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    label: String? = null,
    type: InputType = InputType.Text,
    enabled: Boolean = true,
    style: TextStyle? = null,
    min: Double? = null,
    max: Double? = null,
) {
    val group = LocalGroup.current
    group?.enabled = enabled
    val source = remember { MutableInteractionSource() }
    val focus = group?.focus ?: remember { FocusRequester() }
    FieldText(value, onValueChange, modifier, placeholder, label, type, enabled, source, focus, style, min = min, max = max)
}

/** Content before or after the input: text, an icon, a button or a menu trigger. */
@Composable
fun InputGroupAddon(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) {
    ProvideText(color = Zen.tokens.mutedForeground.color(), style = TextStyles.sm) {
        Row(modifier, horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically, content = content)
    }
}
