package dev.rinzai.zen.repeatpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateString
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Repeat
import dev.rinzai.zen.RepeatUnit
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.chip.Chip
import dev.rinzai.zen.dayOfWeek
import dev.rinzai.zen.describeRepeat
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.input.InputType
import dev.rinzai.zen.locale
import dev.rinzai.zen.nextOccurrences
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectItem
import dev.rinzai.zen.weekStart
import dev.rinzai.zen.weekdayNames
import dev.rinzai.zen.word

/**
 * How often something recurs, e.g. a bill: every n days, weeks, months or years, on chosen
 * weekdays or a day of the month. Says what it means in words, and with a `start` date, the next
 * few dates it falls on. `start` also gives the weekday and day of the month a rule starts on;
 * `locale` and `weekStartsOn` default to the LocaleProvider's; `label` names the group ("Repeats").
 */
@Composable
fun RepeatPicker(
    value: Repeat,
    onValueChange: (Repeat) -> Unit,
    modifier: Modifier = Modifier,
    locale: String? = null,
    start: DateString? = null,
    weekStartsOn: Int? = null,
    label: String? = null,
) {
    val m = LocalMessages.current
    val locale = locale(locale)
    val first = weekStartsOn ?: weekStart(locale)
    var count by remember { mutableStateOf(value.every.toString()) }
    if (count.toIntOrNull() != value.every && count.isNotEmpty()) count = value.every.toString()
    val names = weekdayNames(locale)
    val weekdays = value.weekdays ?: listOfNotNull(start?.let(::dayOfWeek))
    val plural = value.every != 1
    val muted = Zen.tokens.mutedForeground.color()

    fun setUnit(unit: RepeatUnit) = onValueChange(
        Repeat(
            value.every,
            unit,
            weekdays = if (unit == RepeatUnit.Week && start != null) listOf(dayOfWeek(start)) else null,
            day = if (unit == RepeatUnit.Month) start?.substring(8)?.toInt() ?: 1 else null,
        ),
    )

    Column(modifier.semantics { contentDescription = label ?: m.repeats }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(m.every, color = muted, style = TextStyles.sm)
            Input(
                count,
                { typed ->
                    val text = typed.filter { it in '0'..'9' }.take(3)
                    count = text
                    text.toIntOrNull()?.takeIf { it >= 1 }?.let { onValueChange(value.copy(every = it)) }
                },
                Modifier.width(64.dp).onFocusChanged { if (!it.hasFocus) count = value.every.toString() },
                label = m.howMany,
                type = InputType.Numeric,
                style = TextStyles.tabular.copy(textAlign = TextAlign.Center),
            )
            Select(value.unit.word, { setUnit(RepeatUnit.valueOf(it.replaceFirstChar(Char::uppercase))) }, Modifier.width(128.dp), label = m.unit) {
                for (u in RepeatUnit.entries) SelectItem(u.word, m.repeatUnit(u.word, if (plural) 2 else 1))
            }
        }
        if (value.unit == RepeatUnit.Week) {
            FlowRow(Modifier.semantics { contentDescription = m.on }, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (i in 0 until 7) {
                    val d = (first + i) % 7
                    val on = d in weekdays
                    // At least one day.
                    Chip({ if (!(on && weekdays.size == 1)) onValueChange(value.copy(weekdays = if (on) weekdays - d else weekdays + d)) }, pressed = on) {
                        Text(names[d])
                    }
                }
            }
        }
        if (value.unit == RepeatUnit.Month) {
            val day = value.day ?: start?.substring(8)?.toInt() ?: 1
            Select(day.toString(), { onValueChange(value.copy(day = it.toInt())) }, Modifier.width(160.dp), label = m.on) {
                for (d in 1..31) SelectItem(d.toString(), m.day(d))
                SelectItem("-1", m.lastDay)
            }
        }
        val next = start?.let { "\n${m.next} " + nextOccurrences(value, it, 3).joinToString(", ") { d -> formatDate(d, locale) } } ?: ""
        Text(describeRepeat(value, locale, start, m) + next, Modifier.semantics { liveRegion = LiveRegionMode.Polite }, color = muted, style = TextStyles.sm)
    }
}
