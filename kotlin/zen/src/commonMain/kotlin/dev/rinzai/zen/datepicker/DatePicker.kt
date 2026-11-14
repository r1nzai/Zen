package dev.rinzai.zen.datepicker

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.PopupRow
import dev.rinzai.zen.DateRange
import dev.rinzai.zen.DateString
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.PickerField
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.box
import dev.rinzai.zen.calendar.Calendar
import dev.rinzai.zen.calendar.RangeCalendar
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatDateRange
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.locale
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.transition

/**
 * Date field: shows the date ("Sep 30, 2026" for the locale) and opens a
 * Calendar to pick one, focused on the chosen date so the keyboard works at
 * once. Dates are "YYYY-MM-DD" strings. When `clearable`, the popup also offers
 * `clearLabel` to empty it.
 */
@Composable
fun DatePicker(
    value: DateString?,
    onValueChange: (DateString?) -> Unit,
    modifier: Modifier = Modifier,
    /** Decides the date format, month and weekday names, and the first day of the week, e.g. "en-IN". Defaults to the LocaleProvider's. */
    locale: String? = null,
    /** Earliest date that can be picked. */
    min: DateString? = null,
    /** Latest date that can be picked. */
    max: DateString? = null,
    /** Dates that can't be picked, e.g. weekends or booked days. */
    isDisabled: ((DateString) -> Boolean)? = null,
    /** 0 for Sunday … 6 for Saturday. Defaults to the locale's. */
    weekStartsOn: Int? = null,
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    placeholder: String? = null,
    /** Offers a clear option in the popup (shown when a value is set); clearing reports null. */
    clearable: Boolean = false,
    clearLabel: String? = null,
    label: String? = null,
) {
    val m = LocalMessages.current
    val loc = locale(locale)
    val popup = rememberPopupState()
    PickerField(
        popup,
        shown = value?.let { formatDate(it, loc) },
        placeholder = placeholder ?: m.pickDate,
        popupLabel = m.chooseDate,
        modifier = modifier,
        enabled = enabled,
        size = size,
        label = label,
        onClear = if (clearable && value != null) ({ onValueChange(null) }) else null,
        clearLabel = clearLabel ?: m.clear,
        icon = { open -> CalendarIcon(open) },
    ) {
        // Beside Clear, the calendar is one of the popup's rows; alone, its own parts are.
        PopupRow(whole = clearable && value != null) { Calendar(
            value,
            {
                onValueChange(it)
                popup.hide()
            },
            locale = loc,
            min = min,
            max = max,
            isDisabled = isDisabled,
            weekStartsOn = weekStartsOn,
            autoFocus = true,
        ) }
    }
}

/** A range picked in one tap beside DateRangePicker's calendar. */
data class DateRangePreset(val label: String, val range: DateRange)

/**
 * Date range field: pick a start and then an end in a Calendar (the days
 * between are previewed while pointing); it closes once the range is complete.
 * Shows the range the locale's way, e.g. "Sep 3 – 10, 2026". With `presets`,
 * common ranges ("Last 30 days") sit beside the calendar, one tap each (see
 * commonRanges).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DateRangePicker(
    value: DateRange?,
    onValueChange: (DateRange?) -> Unit,
    modifier: Modifier = Modifier,
    locale: String? = null,
    min: DateString? = null,
    max: DateString? = null,
    isDisabled: ((DateString) -> Boolean)? = null,
    weekStartsOn: Int? = null,
    /** Months shown side by side (2 suits wide screens). */
    months: Int = 1,
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    placeholder: String? = null,
    clearable: Boolean = false,
    clearLabel: String? = null,
    /** Ranges picked in one tap, beside the calendar. */
    presets: List<DateRangePreset> = emptyList(),
    label: String? = null,
) {
    val m = LocalMessages.current
    val loc = locale(locale)
    val popup = rememberPopupState()
    val end = value?.end
    PickerField(
        popup,
        shown = when {
            value == null -> null
            end != null -> formatDateRange(value.start, end, loc)
            else -> "${formatDate(value.start, loc)} – …"
        },
        placeholder = placeholder ?: m.pickDates,
        popupLabel = m.chooseDates,
        modifier = modifier,
        enabled = enabled,
        size = size,
        label = label,
        onClear = if (clearable && value != null) ({ onValueChange(null) }) else null,
        clearLabel = clearLabel ?: m.clear,
        icon = { open -> CalendarIcon(open) },
    ) {
        val calendar = @Composable {
            RangeCalendar(
                value,
                {
                    onValueChange(it)
                    if (it.end != null) popup.hide()
                },
                locale = loc,
                min = min,
                max = max,
                isDisabled = isDisabled,
                weekStartsOn = weekStartsOn,
                months = months,
                autoFocus = true,
            )
        }
        // Beside Clear, what it holds is one of the popup's rows; alone, its parts are (the presets, the calendar).
        val clear = clearable && value != null
        if (presets.isEmpty()) return@PickerField PopupRow(clear) { calendar() }
        PopupRow(clear) {
            val choose = { p: DateRangePreset ->
                onValueChange(p.range)
                popup.hide()
            }
            // Beside the calendar from sm up, with a line between; above it, wrapping, on narrow screens.
            if (Zen.page.atLeast(Breakpoint.Sm)) Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(
                    Modifier
                        .popupRow()
                        .fillMaxHeight()
                        .box(RectangleShape, border = SolidColor(Zen.tokens.tint.color(0.06f)), sides = if (LocalLayoutDirection.current == LayoutDirection.Rtl) Sides(left = 1.dp) else Sides(right = 1.dp))
                        .padding(end = 12.dp)
                        .semantics { contentDescription = m.presets },
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    for (p in presets) Preset(p, p.range == value, choose)
                }
                PopupRow { calendar() }
            } else Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                FlowRow(
                    Modifier.popupRow().width(IntrinsicSize.Max).semantics { contentDescription = m.presets },
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    for (p in presets) Preset(p, p.range == value, choose)
                }
                PopupRow { calendar() }
            }
        }
    }
}

@Composable
private fun Preset(preset: DateRangePreset, on: Boolean, choose: (DateRangePreset) -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val fill = when {
        on -> t.primary.color(0.12f)
        state.hovered -> t.tint.color(0.06f)
        else -> t.tint.color(0f)
    }
    Text(
        preset.label,
        Modifier
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .control(state) { choose(preset) }
            .semantics { toggleableState = ToggleableState(on) }
            .padding(horizontal = 10.dp, vertical = 6.dp),
        style = TextStyles.sm,
        color = if (on || state.hovered) t.foreground.color() else t.mutedForeground.color(),
        softWrap = false,
    )
}

@Composable
private fun CalendarIcon(open: Boolean) {
    val t = Zen.tokens
    val color by animateColorAsState(if (open) t.foreground.color() else t.mutedForeground.color(), transition(150))
    Icon(Icons.CalendarMicro, size = 16.dp, color = color)
}
