package dev.rinzai.zen.timefield

import dev.rinzai.zen.CssCursor
import dev.rinzai.zen.cssCursor
import dev.rinzai.zen.activeElement
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.key.utf16CodePoint
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ClockSegment
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.fieldInvalid
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.locale
import dev.rinzai.zen.platformClock
import dev.rinzai.zen.radii

/** A time of day as "HH:MM", 24-hour: no date and no time zone, like DateString. */
typealias TimeString = String

/** The parts as shown: the hour in the locale's cycle (1–12 or 0–23), and AM (0) or PM (1). */
private data class Parts(val hour: Int?, val minute: Int?, val period: Int?) {
    operator fun get(segment: ClockSegment) = when (segment) {
        ClockSegment.Hour -> hour
        ClockSegment.Minute -> minute
        ClockSegment.DayPeriod -> period
    }

    fun with(segment: ClockSegment, n: Int?) = when (segment) {
        ClockSegment.Hour -> copy(hour = n)
        ClockSegment.Minute -> copy(minute = n)
        ClockSegment.DayPeriod -> copy(period = n)
    }
}

/**
 * A time of day, typed or stepped a part at a time: hour, minute and, where
 * the locale uses a 12-hour clock, AM/PM, in the locale's order and digits.
 * Type digits (it moves on when a part is full), ↑↓ to step (minutes by
 * `step`), ←→ between parts, Backspace to clear one. The value is "HH:MM"
 * (24-hour) once every part is set, and null until then.
 */
@Composable
fun TimeField(
    value: TimeString?,
    onValueChange: (TimeString?) -> Unit,
    modifier: Modifier = Modifier,
    /** Minutes ↑↓ move by, e.g. 5 or 15. */
    step: Int = 1,
    locale: String? = null,
    size: FieldSize = FieldSize.Default,
    invalid: Boolean = false,
    enabled: Boolean = true,
    label: String? = null,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val loc = locale(locale)
    val clock = remember(loc) { Clock(loc) }
    // Parts set so far while the time is incomplete (the value is null meanwhile).
    var draft by remember { mutableStateOf<Parts?>(null) }
    val parts = draft ?: clock.split(value)
    // Digits typed into the focused part, to read "1" then "2" as 12.
    val typed = remember { StringBuilder() }
    val segments = clock.order.mapNotNull { it.segment }
    val focus = remember(segments) { segments.map { FocusRequester() } }
    var focused by remember { mutableStateOf<ClockSegment?>(null) }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val hover = remember { MutableInteractionSource() }
    val hovered by hover.collectIsHoveredAsState()

    fun update(next: Parts) {
        val time = clock.join(next)
        draft = if (time == null) next else null
        if (time != value) onValueChange(time)
    }

    Row(
        modifier
            .hoverable(hover)
            .pointerHoverIcon(if (enabled) PointerIcon.Text else cssCursor(CssCursor.NotAllowed))
            .pointerInput(enabled) {
                awaitEachGesture {
                    // A press on the field but not a part goes to the first part.
                    val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Final)
                    if (enabled && !down.isConsumed) focus.firstOrNull()?.requestFocus()
                }
            }
            .fieldControl(label)
            .fieldBox(size, hovered && !coarsePointer && enabled, focused != null, fieldInvalid(invalid), background = if (enabled) null else t.muted.color())
            .then(if (enabled) Modifier else Modifier.alpha(0.5f).semantics { disabled() }),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = if (enabled) t.foreground.color() else t.mutedForeground.color(), style = TextStyles.sm) {
            for (part in clock.order) {
                val segment = part.segment
                if (segment == null) {
                    Text(part.text, color = t.mutedForeground.color())
                    continue
                }
                val index = segments.indexOf(segment)
                val n = parts[segment]
                val text = n?.let { clock.show(segment, it) }
                val isFocused = focused == segment
                val name = when (segment) {
                    ClockSegment.Hour -> m.hour
                    ClockSegment.Minute -> m.minute
                    ClockSegment.DayPeriod -> m.dayPeriod
                }
                fun stepBy(by: Int) {
                    typed.clear()
                    update(clock.step(parts, segment, by, step))
                }
                Text(
                    text ?: "––",
                    Modifier
                        .focusRequester(focus[index])
                        .onFocusChanged {
                            if (it.isFocused) {
                                typed.clear()
                                focused = segment
                            } else if (focused == segment) focused = null
                        }
                        .then(
                            if (!enabled) Modifier
                            else Modifier
                                .pointerInput(Unit) {
                                    awaitEachGesture {
                                        awaitFirstDown(requireUnconsumed = false).consume()
                                        focus[index].requestFocus()
                                    }
                                }
                                .onKeyEvent { e ->
                                    if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                                    val forward = if (rtl) Key.DirectionLeft else Key.DirectionRight
                                    val back = if (rtl) Key.DirectionRight else Key.DirectionLeft
                                    when (e.key) {
                                        back -> focus.getOrNull(index - 1)?.requestFocus().let { true }
                                        forward -> focus.getOrNull(index + 1)?.requestFocus().let { true }
                                        Key.DirectionUp -> stepBy(1).let { true }
                                        Key.DirectionDown -> stepBy(-1).let { true }
                                        Key.Backspace, Key.Delete -> {
                                            typed.clear()
                                            update(parts.with(segment, null))
                                            true
                                        }
                                        else -> {
                                            val code = e.utf16CodePoint
                                            if (code <= 32 || e.isCtrlPressed || e.isMetaPressed || e.isAltPressed) return@onKeyEvent false
                                            val key = if (code > 0xFFFF) charArrayOf(Char(0xD7C0 + (code shr 10)), Char(0xDC00 + (code and 0x3FF))).concatToString() else Char(code).toString()
                                            if (segment == ClockSegment.DayPeriod) {
                                                val period = clock.periodFor(key) ?: return@onKeyEvent false
                                                update(parts.copy(period = period))
                                                return@onKeyEvent true
                                            }
                                            val digit = clock.digit(key) ?: return@onKeyEvent false
                                            val (next, done) = clock.type(segment, typed.toString() + digit)
                                            if (done) typed.clear() else typed.append(digit)
                                            update(parts.with(segment, next))
                                            if (done) focus.getOrNull(index + 1)?.requestFocus()
                                            true
                                        }
                                    }
                                }
                                .activeElement()
                                .focusable()
                        )
                        .semantics {
                            contentDescription = name
                            text?.let { stateDescription = it }
                            if (enabled) customActions = listOf(
                                CustomAccessibilityAction(m.increase) { stepBy(1); true },
                                CustomAccessibilityAction(m.decrease) { stepBy(-1); true },
                            )
                        }
                        .clip(Zen.radii.sm)
                        .background(if (isFocused) t.primary.color(0.2f) else t.primary.color(0f))
                        .padding(horizontal = 2.dp),
                    color = when {
                        isFocused -> t.foreground.color()
                        text == null -> t.mutedForeground.color()
                        else -> Color.Unspecified
                    },
                    style = TextStyles.tabular,
                )
            }
        }
    }
}

/** A time ("HH:mm") as `locale` writes it, as toLocaleTimeString with hour "numeric" and minute "2-digit" does: "9:41 AM", "09:41". */
fun formatTime(time: TimeString, locale: String): String {
    val clock = Clock(locale)
    val parts = clock.split(time)
    return clock.order.joinToString("") { part -> part.segment?.let { clock.show(it, parts[it]!!) } ?: part.text }
}

/** A locale's clock: its parts' order, hour cycle, digits and AM/PM names. */
private class Clock(val locale: String) {
    private val pattern = platformClock(locale)
    val order = pattern.parts
    private val h12 = pattern.h12
    private val periods = pattern.periods
    private val digits: Map<String, String> = formatNumber(9876543210.0, locale, NumberOptions(useGrouping = false))
        .characters().mapIndexed { i, d -> d to (9 - i).toString() }.toMap()

    fun min(segment: ClockSegment) = if (segment == ClockSegment.Hour && h12) 1 else 0
    fun max(segment: ClockSegment) = if (segment == ClockSegment.Minute) 59 else if (h12) 12 else 23

    fun show(segment: ClockSegment, n: Int): String = when {
        segment == ClockSegment.DayPeriod -> if (n == 0) periods.first else periods.second
        segment == ClockSegment.Hour && h12 -> formatNumber(n.toDouble(), locale, NumberOptions(useGrouping = false))
        else -> formatNumber(n.toDouble(), locale, NumberOptions(minimumIntegerDigits = 2, useGrouping = false))
    }

    fun split(time: TimeString?): Parts {
        if (time.isNullOrEmpty()) return Parts(null, null, if (h12) null else 0)
        val h = time.substring(0, 2).toInt()
        val minute = time.substring(3, 5).toInt()
        return if (h12) Parts((h % 12).takeIf { it != 0 } ?: 12, minute, if (h >= 12) 1 else 0) else Parts(h, minute, 0)
    }

    fun join(p: Parts): TimeString? {
        val (hour, minute, period) = p
        if (hour == null || minute == null || (h12 && period == null)) return null
        val h = if (!h12) hour else hour % 12 + (if (period == 1) 12 else 0)
        return "${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}"
    }

    fun step(parts: Parts, segment: ClockSegment, by: Int, minutes: Int): Parts {
        if (segment == ClockSegment.DayPeriod) return parts.copy(period = if (parts.period == 1) 0 else 1)
        val (lo, hi) = min(segment) to max(segment)
        val size = hi - lo + 1
        val unit = if (segment == ClockSegment.Minute) minutes else 1
        val n = parts[segment] ?: return parts.with(segment, if (by > 0) lo else lo + (hi - lo) / unit * unit)
        // On to the next whole step either way (7 goes down to 5 and up to 10), wrapping round the clock.
        val at = (n - lo).toDouble() / unit
        val next = (if (by > 0) kotlin.math.floor(at).toInt() + 1 else kotlin.math.ceil(at).toInt() - 1) * unit
        return parts.with(segment, lo + next.mod(size))
    }

    fun digit(key: String): String? = if (key.length == 1 && key[0] in '0'..'9') key else digits[key]

    /** The part's number from the digits typed into it, and whether it's full (so focus moves on). */
    fun type(segment: ClockSegment, typed: String): Pair<Int, Boolean> {
        val hi = max(segment)
        val n = typed.toInt()
        if (typed.length == 2) return if (n in min(segment)..hi) n to true else type(segment, typed.substring(1))
        // Done after one digit when no second could follow it (a 3 in hours: there's no 30-something o'clock).
        return n to (n * 10 > hi)
    }

    fun periodFor(key: String): Int? {
        val k = key.lowercase()
        if (k == "a" || periods.first.lowercase().startsWith(k)) return 0
        if (k == "p" || periods.second.lowercase().startsWith(k)) return 1
        return null
    }
}

private fun String.characters(): List<String> {
    val out = mutableListOf<String>()
    var i = 0
    while (i < length) {
        val n = if (this[i].isHighSurrogate() && i + 1 < length) 2 else 1
        out += substring(i, i + n)
        i += n
    }
    return out
}
