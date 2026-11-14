package dev.rinzai.zen.numberfield

import dev.rinzai.zen.pressCursor
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.locale
import dev.rinzai.zen.plainSpaces
import dev.rinzai.zen.radii
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** How a NumberField's number changed: a step (with what it adds), typing, or Home/End. */
sealed interface NumberFieldChange {
    data class Step(val delta: Double) : NumberFieldChange
    data object Input : NumberFieldChange
    data object Limit : NumberFieldChange
}

/**
 * A number to type or step: − and + on either side, ↑↓ by `step`, Page Up and Page Down by
 * `largeStep`, Home and End to `min` and `max`. Shown in the locale's way (`format`: a
 * percentage, a unit, decimals) and read back from what's typed in it, digits, separators and
 * all. Kept within `min` and `max` once you leave the field; empty is null.
 *
 * Each change says how it came about: a Step (with its delta) for − +, ↑↓ and Page Up/Down,
 * Input for typing, Limit for Home and End. So a step can be sent on as a step, and the number
 * kept by whoever owns it. `onValueCommit` hears each finished change: each step, and what's
 * typed on Enter or on leaving the field.
 */
@Composable
fun NumberField(
    value: Double?,
    onValueChange: (Double?, NumberFieldChange) -> Unit,
    modifier: Modifier = Modifier,
    onValueCommit: ((Double?, NumberFieldChange) -> Unit)? = null,
    min: Double? = null,
    max: Double? = null,
    step: Double = 1.0,
    largeStep: Double = step * 10,
    format: NumberOptions = NumberOptions(),
    locale: String? = null,
    label: String? = null,
    size: FieldSize = FieldSize.Default,
    invalid: Boolean = false,
    enabled: Boolean = true,
) {
    val m = LocalMessages.current
    val loc = locale(locale)
    val reader = remember(loc, format) { NumberReader(loc, format) }
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    val commit by rememberUpdatedState(onValueCommit)
    // What's typed, while the field has focus; otherwise the value, formatted.
    var draft by remember { mutableStateOf<String?>(null) }
    var typed by remember { mutableStateOf(false) }
    val clamp = { n: Double -> min(max ?: Double.POSITIVE_INFINITY, max(min ?: Double.NEGATIVE_INFINITY, n)) }

    val set = { n: Double?, details: NumberFieldChange ->
        change(n, details)
        commit?.invoke(n, details)
        typed = false
        draft = null
    }
    val finish = finish@{
        if (!typed) return@finish
        // What's typed, not `value`: an owner may take up only finished changes.
        val read = draft?.let { reader.parse(it) }
        val was = if (read?.isNaN() == true || draft == null) current else read
        val n = was?.let(clamp)
        if (n != current) change(n, NumberFieldChange.Input)
        commit?.invoke(n, NumberFieldChange.Input)
        typed = false
    }
    val by = { delta: Double ->
        val from = current ?: if (delta > 0) (min ?: 0.0) - delta else (max ?: 0.0) - delta
        // In whole steps from `min` (or 0), without float drift: 0.1 + 0.2 is 0.3.
        val base = min ?: 0.0
        val next = clamp(base + jsRound((from + delta - base) / step) * step)
        val decimals = max(places(step), places(base))
        set(fixed(next, decimals), NumberFieldChange.Step(delta))
    }
    val shown = draft ?: current?.let { reader.format(it) } ?: ""

    InputGroup(modifier, size, invalid, contentPadding = PaddingValues(horizontal = 4.dp)) {
        InputGroupAddon {
            Step(m.decrease, Icons.MinusMicro, enabled && !(current != null && min != null && current!! <= min)) { by(-step) }
        }
        InputGroupInput(
            shown,
            { text ->
                draft = text
                typed = true
                val n = reader.parse(text)
                if (n?.isNaN() != true) change(n, NumberFieldChange.Input)
            },
            Modifier
                .onFocusChanged {
                    if (it.isFocused && draft == null) draft = shown
                    else if (!it.isFocused && draft != null) {
                        draft = null
                        finish()
                    }
                }
                .onPreviewKeyEvent { e ->
                    if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                    if (e.key == Key.Enter || e.key == Key.NumPadEnter) {
                        finish()
                        draft = null
                        return@onPreviewKeyEvent false
                    }
                    val to: (() -> Unit) = when (e.key) {
                        Key.DirectionUp -> ({ by(step) })
                        Key.DirectionDown -> ({ by(-step) })
                        Key.PageUp -> ({ by(largeStep) })
                        Key.PageDown -> ({ by(-largeStep) })
                        Key.MoveHome -> min?.let { lo -> { set(lo, NumberFieldChange.Limit) } }
                        Key.MoveEnd -> max?.let { hi -> { set(hi, NumberFieldChange.Limit) } }
                        else -> null
                    } ?: return@onPreviewKeyEvent false
                    to()
                    true
                }
                .semantics {
                    current?.let { stateDescription = reader.format(it) }
                    customActions = listOf(
                        CustomAccessibilityAction(m.increase) { by(step); true },
                        CustomAccessibilityAction(m.decrease) { by(-step); true },
                    )
                },
            label = label,
            enabled = enabled,
            style = TextStyles.tabular.merge(TextStyle(textAlign = TextAlign.Center)),
        )
        InputGroupAddon {
            Step(m.increase, Icons.PlusMicro, enabled && !(current != null && max != null && current!! >= max)) { by(step) }
        }
    }
}

/** − or +: out of the tab order (the arrow keys do the same), and a press leaves focus in the input. */
@Composable
private fun Step(label: String, icon: ImageVector, enabled: Boolean, onStep: () -> Unit) {
    val t = Zen.tokens
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val lit = hovered && enabled && !coarsePointer
    val step by rememberUpdatedState(onStep)
    Box(
        Modifier
            .size(28.dp)
            .alpha(if (enabled) 1f else 0.4f)
            .hoverable(source, enabled)
            .pointerHoverIcon(pressCursor(enabled))
            .box(Zen.radii.md, fill = if (lit) SolidColor(t.tint.color(0.08f)) else null)
            .pointerInput(enabled) { detectTapGestures { if (enabled) step() } }
            .semantics {
                contentDescription = label
                role = Role.Button
                if (enabled) onClick { step(); true } else disabled()
            },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, size = 16.dp, color = if (lit) t.foreground.color() else t.mutedForeground.color())
    }
}

/** Math.round: halves up, toward +∞ (Kotlin's round goes to even). */
private fun jsRound(x: Double) = floor(x + 0.5)

/** Decimal places of `n` as JavaScript writes it (0.0025 has 4, 1 has none). */
private fun places(n: Double) = formatNumber(abs(n), "en", NumberOptions(maximumFractionDigits = 20, useGrouping = false)).substringAfter('.', "").length

private fun fixed(n: Double, decimals: Int) = formatNumber(n, "en", NumberOptions(maximumFractionDigits = decimals, useGrouping = false)).toDouble()

/** Formats numbers for a locale, and reads them back from text typed that way. */
private class NumberReader(private val locale: String, private val options: NumberOptions) {
    private val decimal: String
    private val digits: Map<String, Char>

    init {
        val own = codePoints(formatNumber(9876543210.0, locale, NumberOptions(useGrouping = false)))
        digits = own.mapIndexed { i, d -> d to '0' + (9 - i) }.toMap()
        decimal = codePoints(formatNumber(1.5, locale, NumberOptions(minimumFractionDigits = 1))).filter { it !in digits }.joinToString("")
    }

    fun format(n: Double) = plainSpaces(formatNumber(n, locale, options))

    /** The number in the text, null when it's empty, or NaN when it isn't a number (yet). */
    fun parse(text: String): Double? {
        var plain = ""
        for (c in codePoints(text)) {
            val d = digits[c] ?: c.singleOrNull()?.takeIf { it in '0'..'9' }
            when {
                d != null -> plain += d
                c == decimal -> plain += '.'
                (c == "-" || c == "−") && plain.isEmpty() -> plain = "-"
            }
        }
        if (plain.isEmpty() && text.isBlank()) return null
        if (!Plain.matches(plain)) return Double.NaN
        val n = plain.toDouble()
        return if (options.style == NumberStyle.Percent) n / 100 else n
    }
}

private val Plain = Regex("^-?\\d+(\\.\\d+)?$")

private fun codePoints(text: String): List<String> {
    val out = mutableListOf<String>()
    var i = 0
    while (i < text.length) {
        val wide = text[i].isHighSurrogate() && i + 1 < text.length
        out += text.substring(i, i + if (wide) 2 else 1)
        i += if (wide) 2 else 1
    }
    return out
}
