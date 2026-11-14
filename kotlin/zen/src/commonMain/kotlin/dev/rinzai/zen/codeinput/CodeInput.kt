package dev.rinzai.zen.codeinput

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.fieldInvalid
import dev.rinzai.zen.monospace
import dev.rinzai.zen.reducedMotion
import kotlinx.coroutines.delay

/**
 * A one-time code (sign-in, verification): a box per character. It's one real field under the
 * boxes, so typing, pasting, deleting and the phone's autofill from a text message all work as in
 * any field. `onComplete` gets the code once every box is filled. `allowed` says which characters
 * count (digits by default); others typed or pasted are dropped.
 */
@Composable
fun CodeInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    /** How many characters (boxes). */
    length: Int = 6,
    /** Called with the code when the last box is filled. */
    onComplete: ((String) -> Unit)? = null,
    allowed: (Char) -> Boolean = { it in '0'..'9' },
    invalid: Boolean = false,
    enabled: Boolean = true,
    label: String? = null,
    /** Digits by default; say false for codes with letters, for a full keyboard. */
    numeric: Boolean = true,
) {
    val t = Zen.tokens
    val bad = fieldInvalid(invalid)
    val current by rememberUpdatedState(value)
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    // Typing goes on from the end, wherever the box was pressed.
    var field by remember { mutableStateOf(TextFieldValue(value, TextRange(value.length))) }
    if (field.text != value || field.selection != TextRange(value.length)) field = TextFieldValue(value, TextRange(value.length))

    BasicTextField(
        field,
        { next ->
            val code = next.text.filter(allowed).take(length)
            field = TextFieldValue(code, TextRange(code.length))
            if (code != current) {
                val was = current.length
                onValueChange(code)
                if (code.length == length && was != length) onComplete?.invoke(code)
            }
        },
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .pointerHoverIcon(PointerIcon.Text)
            .semantics { contentType = ContentType.SmsOtpCode }
            .fieldControl(label),
        enabled = enabled,
        singleLine = true,
        textStyle = TextStyle(color = Color.Transparent),
        cursorBrush = SolidColor(Color.Transparent),
        interactionSource = source,
        keyboardOptions = KeyboardOptions(keyboardType = if (numeric) KeyboardType.NumberPassword else KeyboardType.Ascii, autoCorrectEnabled = false),
        decorationBox = { inner ->
            Box {
                // The field itself, unseen, under the boxes.
                Box(Modifier.size(0.dp)) { inner() }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (i in 0 until length) {
                        val active = focused && (i == value.length || (i == length - 1 && value.length == length))
                        Box(
                            Modifier
                                .width(40.dp)
                                .fieldBox(FieldSize.Default, false, active, bad, height = 48.dp, padding = PaddingValues()),
                            contentAlignment = Alignment.Center,
                        ) {
                            value.getOrNull(i)?.let {
                                Text(it.toString(), style = TextStyle(fontFamily = monospace, fontSize = 18.sp, lineHeight = 28.sp).merge(TextStyles.tabular), color = t.foreground.color())
                            }
                            if (active && i == value.length) Caret()
                        }
                    }
                }
            }
        },
    )
}

/** The caret in the box typing goes into, blinking each second. */
@Composable
private fun Caret() {
    val reduced = reducedMotion()
    var on by remember { mutableStateOf(true) }
    if (!reduced) LaunchedEffect(Unit) {
        while (true) {
            delay(500)
            on = !on
        }
    }
    Box(
        Modifier
            .size(1.dp, 20.dp)
            .alpha(if (on || reduced) 1f else 0f)
            .box(RectangleShape, fill = SolidColor(Zen.tokens.foreground.color())),
    )
}
