package dev.rinzai.zen.calendar

import dev.rinzai.zen.popupRow
import dev.rinzai.zen.CssCursor
import dev.rinzai.zen.cssCursor
import kotlin.math.roundToInt
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateRange
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.DateString
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Month
import dev.rinzai.zen.NameStyle
import dev.rinzai.zen.PickerMonth
import dev.rinzai.zen.PickerNav
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.addDays
import dev.rinzai.zen.addMonths
import dev.rinzai.zen.addMonthsToDate
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.dayOfWeek
import dev.rinzai.zen.daysInMonth
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatMonth
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.locale
import dev.rinzai.zen.monthNames
import dev.rinzai.zen.monthsBetween
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.today
import dev.rinzai.zen.transition
import dev.rinzai.zen.weekStart
import dev.rinzai.zen.weekdayNames

/**
 * A month grid to pick a date, fully keyboard-driven: arrows move by day and
 * week, Home and End to the week's ends, Page Up and Down by month (with Shift,
 * by year). The title opens a year and month grid to jump far. Dates are
 * "YYYY-MM-DD" strings, so they never shift a day with time zones. Inline on a
 * page, or in a popup with DatePicker. For a start and an end, RangeCalendar.
 */
@Composable
fun Calendar(
    value: DateString?,
    onValueChange: (DateString) -> Unit,
    modifier: Modifier = Modifier,
    /** Decides month and weekday names, and the first day of the week, e.g. "en-IN". Defaults to the LocaleProvider's. */
    locale: String? = null,
    /** Earliest date that can be picked. */
    min: DateString? = null,
    /** Latest date that can be picked. */
    max: DateString? = null,
    /** Dates that can't be picked, e.g. weekends or booked days. */
    isDisabled: ((DateString) -> Boolean)? = null,
    /** 0 for Sunday … 6 for Saturday. Defaults to the locale's. */
    weekStartsOn: Int? = null,
    /** Months shown side by side. */
    months: Int = 1,
    /** Month shown first. Defaults to the chosen date's, or this month. */
    defaultMonth: Month? = null,
    /** Focus the chosen date (or today) when shown, e.g. in a popup. */
    autoFocus: Boolean = false,
) = CalendarGrid(value, null, false, onValueChange, { }, modifier, locale, min, max, isDisabled, weekStartsOn, months, defaultMonth, autoFocus)

/**
 * Calendar for a range: pick a start and then an end (either way round); the
 * days between are highlighted, previewed while pointing. `end` is null while
 * only the start is picked.
 */
@Composable
fun RangeCalendar(
    value: DateRange?,
    onValueChange: (DateRange) -> Unit,
    modifier: Modifier = Modifier,
    locale: String? = null,
    min: DateString? = null,
    max: DateString? = null,
    isDisabled: ((DateString) -> Boolean)? = null,
    weekStartsOn: Int? = null,
    months: Int = 1,
    defaultMonth: Month? = null,
    autoFocus: Boolean = false,
) = CalendarGrid(null, value, true, { }, onValueChange, modifier, locale, min, max, isDisabled, weekStartsOn, months, defaultMonth, autoFocus)

@Composable
private fun CalendarGrid(
    single: DateString?,
    range: DateRange?,
    isRange: Boolean,
    onDate: (DateString) -> Unit,
    onRange: (DateRange) -> Unit,
    modifier: Modifier,
    localeOwn: String?,
    min: DateString?,
    max: DateString?,
    isDisabled: ((DateString) -> Boolean)?,
    weekStartsOnOwn: Int?,
    months: Int,
    defaultMonth: Month?,
    autoFocus: Boolean,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val locale = locale(localeOwn)
    val weekStartsOn = weekStartsOnOwn ?: remember(locale) { weekStart(locale) }
    val selected = single ?: range?.start
    val now = today()

    var view by remember { mutableStateOf(defaultMonth ?: (selected ?: now).take(7)) }
    // The date that has keyboard focus (the grid's one tab stop).
    var active by remember { mutableStateOf(selected ?: now) }
    var hover by remember { mutableStateOf<DateString?>(null) }
    var pickingMonths by remember { mutableStateOf(false) }
    var year by remember { mutableIntStateOf(view.take(4).toInt()) }
    var moved by remember { mutableStateOf(autoFocus) }
    val focus = remember { HashMap<DateString, FocusRequester>() }

    val lastView = addMonths(view, months - 1)
    fun shown(d: DateString) = d.take(7) in view..lastView
    fun blocked(d: DateString) = (min != null && d < min) || (max != null && d > max) || isDisabled?.invoke(d) == true

    // The tab stop follows the view: after the arrows change month, it's on a day in sight.
    val tabStop = if (shown(active)) active else addMonthsToDate(active, monthsBetween(active.take(7), view))

    // Focus follows the keyboard (and lands on the tab stop when opened with autoFocus).
    LaunchedEffect(tabStop, pickingMonths) {
        if (!moved) return@LaunchedEffect
        moved = false
        focus[tabStop]?.let { runCatching { it.requestFocus() } }
    }

    fun moveTo(to: DateString) {
        var d = to
        if (min != null && d < min) d = min
        if (max != null && d > max) d = max
        moved = true
        active = d
        if (!shown(d)) view = if (d < view) d.take(7) else addMonths(d.take(7), -(months - 1))
    }

    fun pick(d: DateString) {
        if (blocked(d)) return
        active = d
        moved = true
        if (isRange) {
            val r = range
            // A new range starts on the first click, and ends on the second (either way round).
            onRange(if (r == null || r.end != null) DateRange(d, null) else if (d < r.start) DateRange(d, r.start) else DateRange(r.start, d))
        } else onDate(d)
    }

    // The end of the range being picked follows the pointer (or keyboard focus), as a preview.
    val pending = range?.takeIf { it.end == null }?.start
    val preview = if (pending != null && hover != null) listOf(hover!!, pending).sorted() else null
    val (from, to) = range?.end?.let { range.start to it } ?: preview?.let { it[0] to it[1] } ?: (null to null)

    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Column(modifier.width(IntrinsicSize.Max)) {
        Row(
            Modifier.popupRow().fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PickerNav(if (!pickingMonths) m.previousMonth else m.previousYear, Icons.ChevronLeft) { if (!pickingMonths) view = addMonths(view, -1) else year-- }
            Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                val title = rememberControlState()
                val fill by animateColorAsState(t.tint.color(if (title.hovered) 0.07f else 0f), transition(150))
                Text(
                    when {
                        pickingMonths -> year.toString()
                        months == 1 -> formatMonth(view, locale, NameStyle.Long)
                        else -> "${formatMonth(view, locale)} – ${formatMonth(lastView, locale)}"
                    },
                    Modifier
                        .box(Zen.radii.md, fill = SolidColor(fill), shadows = focusRing(title.focusVisible))
                        .control(title) {
                            year = view.take(4).toInt()
                            pickingMonths = !pickingMonths
                        }
                        .semantics {
                            liveRegion = LiveRegionMode.Polite
                            contentDescription = if (!pickingMonths) m.chooseMonthAndYear(formatMonth(view, locale, NameStyle.Long)) else m.backToDays(year)
                        }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular),
                    color = t.foreground.color(),
                )
            }
            PickerNav(if (!pickingMonths) m.nextMonth else m.nextYear, Icons.ChevronRight) { if (!pickingMonths) view = addMonths(view, 1) else year++ }
        }

        if (pickingMonths) {
            val names = remember(locale) { monthNames(locale) }
            Column(Modifier.popupRow().width(256.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                for (row in 0 until 4) Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    for (col in 0 until 3) {
                        val i = row * 3 + col
                        val month = "${year.toString().padStart(4, '0')}-${(i + 1).toString().padStart(2, '0')}"
                        val out = (min != null && month < min.take(7)) || (max != null && month > max.take(7))
                        PickerMonth(names[i], formatMonth(month, locale, NameStyle.Long), month == view, !out, Modifier.weight(1f)) {
                            view = month
                            moved = true
                            active = addMonthsToDate(active, monthsBetween(active.take(7), month))
                            pickingMonths = false
                        }
                    }
                }
            }
            return@Column
        }

        val narrow = remember(locale) { weekdayNames(locale, NameStyle.Narrow) }
        val long = remember(locale) { weekdayNames(locale, NameStyle.Long) }
        val order = List(7) { (weekStartsOn + it) % 7 }
        Row(
            Modifier
                .popupRow()
                .onKeyEvent { e ->
                    if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                    val dow = (dayOfWeek(tabStop) - weekStartsOn).mod(7)
                    val back = if (rtl) Key.DirectionRight else Key.DirectionLeft
                    val forward = if (rtl) Key.DirectionLeft else Key.DirectionRight
                    val next = when (e.key) {
                        back -> addDays(tabStop, -1)
                        forward -> addDays(tabStop, 1)
                        Key.DirectionUp -> addDays(tabStop, -7)
                        Key.DirectionDown -> addDays(tabStop, 7)
                        Key.MoveHome -> addDays(tabStop, -dow)
                        Key.MoveEnd -> addDays(tabStop, 6 - dow)
                        Key.PageUp -> addMonthsToDate(tabStop, if (e.isShiftPressed) -12 else -1)
                        Key.PageDown -> addMonthsToDate(tabStop, if (e.isShiftPressed) 12 else 1)
                        else -> return@onKeyEvent false
                    }
                    moveTo(next)
                    true
                }
                .height(IntrinsicSize.Max)
                .pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) if (awaitPointerEvent().type == PointerEventType.Exit) hover = null
                    }
                },
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Side by side, the months are as tall as the tallest (flex items stretch), and a shorter
            // one's table shares the extra out among its rows of days, as a table does: each row
            // as tall as the rest, its edges and its day where the browser snaps them to the pixel.
            val lead = { month: String -> (dayOfWeek("$month-01") - weekStartsOn).mod(7) }
            val weeksOf = (0 until months).map { k ->
                val month = addMonths(view, k)
                if (months > 1) (lead(month) + daysInMonth(month) + 6) / 7 else 6
            }
            val density = LocalDensity.current
            val cell = with(density) { 36.dp.toPx() }
            val gap = with(density) { 2.dp.roundToPx() }
            for (k in 0 until months) {
                val month = addMonths(view, k)
                val first = "$month-01"
                val last = "$month-${daysInMonth(month)}"
                val start = addDays(first, -lead(month))
                val extra = cell * (weeksOf.max() - weeksOf[k]) / weeksOf[k]
                Column(Modifier.fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
                    if (months > 1) Text(
                        formatMonth(month, locale, NameStyle.Long),
                        Modifier.padding(bottom = 4.dp),
                        style = TextStyles.xs.merge(TextStyles.medium),
                        color = t.mutedForeground.color(),
                    )
                    Column(
                        Modifier
                            .weight(1f)
                            .semantics {
                                contentDescription = formatMonth(month, locale, NameStyle.Long)
                                collectionInfo = CollectionInfo(6, 7)
                            }
                            .padding(vertical = 2.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Row {
                            for (d in order) Box(Modifier.size(36.dp).semantics { contentDescription = long[d] }, contentAlignment = Alignment.Center) {
                                Text(narrow[d], style = TextStyles.xs.merge(TextStyles.medium), color = t.mutedForeground.color())
                            }
                        }
                        for (w in 0 until 6) {
                            // With several months, each shows only its own days: a week of none has no height.
                            val empty = months > 1 && (0 until 7).none { addDays(start, w * 7 + it).take(7) == month }
                            val top = w * (cell + extra + gap)
                            val snapped = top.roundToInt()
                            val height = with(density) { ((top + cell + extra).roundToInt() - snapped).toDp() }
                            val dayTop = with(density) { ((top + extra / 2).roundToInt() - snapped).toDp() }
                            Row(if (empty) Modifier else Modifier.height(height)) {
                            if (!empty) for (i in 0 until 7) {
                                val d = addDays(start, w * 7 + i)
                                val inMonth = d.take(7) == month
                                if (!inMonth && months > 1) {
                                    Box(Modifier.width(36.dp))
                                    continue
                                }
                                val between = from != null && to != null && d > from && d < to
                                val isStart = d == from
                                val isEnd = d == to
                                val band = between || ((isStart || isEnd) && from != to)
                                // The band rounds off at each row's ends, and at the month's when months sit side by side.
                                val roundStart = isStart || (between && (i == 0 || (months > 1 && d == first)))
                                val roundEnd = isEnd || (between && (i == 6 || (months > 1 && d == last)))
                                val r = t.radius.dp
                                Box(
                                    Modifier.width(36.dp).fillMaxHeight().then(
                                    if (!band) Modifier
                                    else Modifier.background(
                                        t.primary.color(0.15f),
                                        RoundedCornerShape(
                                            topStart = if (roundStart) r else 0.dp,
                                            bottomStart = if (roundStart) r else 0.dp,
                                            topEnd = if (roundEnd) r else 0.dp,
                                            bottomEnd = if (roundEnd) r else 0.dp,
                                        ),
                                    )).padding(top = dayTop),
                                    contentAlignment = Alignment.TopCenter,
                                ) {
                                    Day(
                                        d,
                                        locale,
                                        inMonth = inMonth,
                                        chosen = d == single || d == range?.start || d == range?.end,
                                        off = blocked(d),
                                        isToday = d == now,
                                        tabStop = d == tabStop,
                                        focus = focus.getOrPut(d) { FocusRequester() },
                                        onFocus = {
                                            active = d
                                            if (pending != null) hover = d
                                        },
                                        onHover = { if (pending != null) hover = d },
                                        onClick = { pick(d) },
                                    )
                                }
                            }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Day(
    d: DateString,
    locale: String,
    inMonth: Boolean,
    chosen: Boolean,
    off: Boolean,
    isToday: Boolean,
    tabStop: Boolean,
    focus: FocusRequester,
    onFocus: () -> Unit,
    onHover: () -> Unit,
    onClick: () -> Unit,
) {
    val t = Zen.tokens
    val state = rememberControlState()
    LaunchedEffect(state.hovered) { if (state.hovered) onHover() }
    val fill by animateColorAsState(
        when {
            chosen -> t.primary.color()
            state.hovered && !off -> t.tint.color(0.08f)
            else -> t.tint.color(0f)
        },
        transition(150),
    )
    val color by animateColorAsState(
        when {
            chosen -> t.primaryForeground.color()
            !inMonth -> t.mutedForeground.color()
            else -> t.foreground.color()
        },
        transition(150),
    )
    val lit by animateFloatAsState(if (chosen) 1f else 0f, transition(150))
    Box(
        Modifier
            .size(36.dp)
            .alpha(if (off) 0.35f else 1f)
            .box(
                Zen.radii.lg,
                fill = SolidColor(fill),
                shadows = focusRing(state.focusVisible) + Shadow(blur = 20f, spread = -4f, color = t.glow.color(0.8f * t.glowK * lit)),
            )
            .focusRequester(focus)
            .focusProperties { canFocus = tabStop }
            .onFocusChanged { if (it.isFocused) onFocus() }
            .control(state, label = formatDate(d, locale, DateStyle.Full), onClick = onClick)
            .then(if (off) Modifier.pointerHoverIcon(cssCursor(CssCursor.NotAllowed)) else Modifier)
            .semantics {
                contentDescription = formatDate(d, locale, DateStyle.Full)
                toggleableState = ToggleableState(chosen)
                if (off) disabled()
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            formatNumber(d.substring(8).toDouble(), locale),
            style = TextStyles.sm.merge(TextStyles.tabular),
            color = color,
            align = TextAlign.Center,
        )
        if (isToday) Box(
            Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 4.dp)
                .size(4.dp)
                .background(if (chosen) t.primaryForeground.color() else t.primary.color(), CircleShape),
        )
    }
}
