package dev.rinzai.zen.monthpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Month
import dev.rinzai.zen.NameStyle
import dev.rinzai.zen.PickerField
import dev.rinzai.zen.PickerMonth
import dev.rinzai.zen.PickerNav
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.currentMonth
import dev.rinzai.zen.formatMonth
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.locale
import dev.rinzai.zen.monthNames
import dev.rinzai.zen.rememberPopupState

/**
 * Month selector: a field showing "Sep 2026" that opens a year and a 12-month
 * grid. Months are "YYYY-MM" strings. When `clearable`, the popup also offers
 * `clearLabel` (e.g. "No end") to empty it.
 */
@Composable
fun MonthPicker(
    value: Month?,
    onValueChange: (Month?) -> Unit,
    modifier: Modifier = Modifier,
    /** Decides month names and format, e.g. "en-IN". Defaults to the LocaleProvider's. */
    locale: String? = null,
    /** Earliest month that can be picked. */
    min: Month? = null,
    /** Latest month that can be picked. */
    max: Month? = null,
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    placeholder: String? = null,
    /** Offers a clear option in the popup (shown when a month is set); clearing reports null. */
    clearable: Boolean = false,
    clearLabel: String? = null,
    label: String? = null,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val loc = locale(locale)
    var year by remember { mutableIntStateOf((value ?: currentMonth()).take(4).toInt()) }
    // Opening shows the chosen month's year.
    val popup = rememberPopupState { open -> if (open && value != null) year = value.take(4).toInt() }
    val names = remember(loc) { monthNames(loc) }
    fun inRange(month: Month) = (min == null || month >= min) && (max == null || month <= max)

    PickerField(
        popup,
        shown = value?.let { formatMonth(it, loc) },
        placeholder = placeholder ?: m.pickMonth,
        popupLabel = m.chooseMonth,
        modifier = modifier,
        enabled = enabled,
        size = size,
        label = label,
        onClear = if (clearable && value != null) ({ onValueChange(null) }) else null,
        clearLabel = clearLabel ?: m.clear,
        icon = { open -> Chevron(if (open) 180f else 0f, color = t.mutedForeground.color()) },
    ) {
        Column(Modifier.width(232.dp)) {
            Row(Modifier.popupRow().fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                PickerNav(m.previousYear, Icons.ChevronLeft) { year-- }
                Text(
                    year.toString(),
                    Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                    style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular),
                    color = t.foreground.color(),
                )
                PickerNav(m.nextYear, Icons.ChevronRight) { year++ }
            }
            Column(Modifier.popupRow(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                for (row in 0 until 4) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        for (col in 0 until 3) {
                            val i = row * 3 + col
                            val month = "${year.toString().padStart(4, '0')}-${(i + 1).toString().padStart(2, '0')}"
                            PickerMonth(names[i], formatMonth(month, loc, NameStyle.Long), month == value, inRange(month), Modifier.weight(1f)) {
                                onValueChange(month)
                                popup.hide()
                            }
                        }
                    }
                }
            }
        }
    }
}
