package dev.rinzai.zen

import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.runtime.remember
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import dev.rinzai.zen.icons.Icons
import androidx.compose.ui.draw.rotate
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.TextUnit
import kotlin.math.ceil
import kotlin.math.roundToInt

/**
 * What a Field tells the control in it: the label naming it, the error under it (it's invalid
 * while there is one), and the requester a press on the label focuses it through.
 */
class FieldControl internal constructor(val label: String, val error: String?, internal val focus: FocusRequester) {
    val invalid get() = error != null
}

/** The Field around a control (null outside one): Zen's controls read it; so can your own. */
val LocalField = compositionLocalOf<FieldControl?> { null }

/**
 * A control's name and error: its own `label`, else its Field's; focused from the Field's label,
 * and as a mouse presses it, as Chrome focuses a control on mousedown (before any drag in it).
 */
@Composable
internal fun Modifier.fieldControl(label: String?): Modifier {
    val field = LocalField.current
    val focus = remember { FocusRequester() }
    return (if (field != null) focusRequester(field.focus) else this)
        .focusRequester(focus)
        .pointerInput(focus) {
            awaitEachGesture {
                val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                if (down.type == PointerType.Mouse) focus.requestFocus()
            }
        }
        .activeElement().semantics {
        (label ?: field?.label)?.let { contentDescription = it }
        field?.error?.let { error(it) }
    }
}

/** Invalid itself, or in a Field showing an error. */
@Composable
internal fun fieldInvalid(invalid: Boolean) = invalid || LocalField.current?.invalid == true

/** A field's height, matching Button's: sm (32px), default (40px) or lg (44px). */
enum class FieldSize(internal val height: Dp, internal val padding: Dp) {
    Sm(32.dp, 10.dp),
    Default(40.dp, 12.dp),
    Lg(44.dp, 14.dp),
}

/**
 * A text field's box (FIELD in the web library): faintly tinted, with a border the pointer light
 * runs along, brighter on hover; focused, a glowing border and halo. `invalid` makes it red,
 * focused or not. A disabled field's look differs between an Input and an InputGroup, so each
 * sets its own.
 */
@Composable
internal fun Modifier.fieldBox(
    size: FieldSize,
    hovered: Boolean,
    focused: Boolean,
    invalid: Boolean = false,
    background: Color? = null,
    height: Dp? = size.height,
    padding: PaddingValues = PaddingValues(horizontal = size.padding),
    border: Color? = null,
): Modifier {
    val t = Zen.tokens
    val shape = Zen.radii.lg
    val bg by animateColorAsState(
        when {
            background != null -> background
            focused -> t.tint.color(0.05f)
            else -> t.tint.color(0.035f)
        },
        transition(200),
    )
    // The border colour beneath the light, and the border drawn over it (focus, error).
    val under by animateColorAsState(
        when {
            focused || invalid -> t.glow.color(0f)
            hovered -> t.glow.color(0.4f)
            else -> t.glow.color(0.22f)
        },
        transition(200),
    )
    val over by animateColorAsState(
        when {
            invalid -> t.destructive.color()
            border != null -> border
            focused -> t.glow.color(0.6f)
            else -> t.glow.color(0f)
        },
        transition(200),
    )
    // Not interpolable (an inset shadow and outer ones): it changes at once, as in CSS.
    val shadows = when {
        focused && invalid -> listOf(ring(t.destructive.color(0.16f), 3f))
        focused -> t.glowFocus
        else -> listOf(Shadow(y = 1f, color = Color.White.copy(alpha = 0.04f), inset = true))
    }
    return this
        .then(if (height != null) Modifier.height(height) else Modifier)
        .glowEdge(shape, cover = over)
        .box(shape, fill = SolidColor(bg), border = SolidColor(under), shadows = shadows)
        .padding(padding)
}

/**
 * The width an <input> keeps where nothing else sizes it (in a box as wide as its content): 20
 * average characters plus the widest less one average, as Chrome sizes one (size="20"). Geist's
 * average is 0.581em (OS/2 xAvgCharWidth) and its widest 2.538em (the bounding box), rounded;
 * plus `padding`, where that's inside the text field.
 */
internal fun Modifier.inputIntrinsicWidth(fontSize: TextUnit, padding: PaddingValues? = null) = layout { measurable, constraints ->
    if (constraints.hasBoundedWidth) {
        val p = measurable.measure(constraints)
        return@layout layout(p.width, p.height) { p.place(0, 0) }
    }
    val em = fontSize.toDp().value
    val avg = 0.581f * em
    val room = padding?.let { it.calculateLeftPadding(layoutDirection).value + it.calculateRightPadding(layoutDirection).value } ?: 0f
    val w = (ceil(20 * avg) + (2.538f * em).roundToInt() - avg + room).dp.roundToPx()
    val p = measurable.measure(constraints.copy(minWidth = w, maxWidth = w))
    layout(w, p.height) { p.place(0, 0) }
}

/** shadow-glow-focus: a 3px halo in the glow colour and a soft glow round it. */
internal val Tokens.glowFocus: List<Shadow>
    get() = listOf(ring(glow.color(0.16f), 3f), Shadow(blur = 24f, spread = -6f, color = glow.color(0.6f * glowK)))

/** ::selection (base.css): the glow colour at 35%. */
internal val Tokens.selection: TextSelectionColors
    get() = TextSelectionColors(handleColor = glow.color(), backgroundColor = glow.color(0.35f))

/** A placeholder's colour: muted, dimmed further on dark glass so it can't pass for a value. */
internal val Tokens.placeholder: Color get() = mutedForeground.color(zenPlaceholder)

/**
 * The chevron of a field or section that opens: ChevronDownMicro (size-4) turned `turn` degrees,
 * easing round over 300ms as it changes.
 */
@Composable
internal fun Chevron(turn: Float, easing: Easing = Ease.Standard, color: Color = Color.Unspecified, duration: Int = 300) {
    val angle by animateFloatAsState(turn, transition(duration, easing))
    Icon(Icons.ChevronDownMicro, Modifier.rotate(angle), size = 16.dp, color = color)
}
