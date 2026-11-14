package dev.rinzai.zen.calendarheatmap

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.DateString
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.Month
import dev.rinzai.zen.NameStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.dayOfWeek
import dev.rinzai.zen.daysInMonth
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatMonth
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.fullWidth
import dev.rinzai.zen.locale
import dev.rinzai.zen.radii
import dev.rinzai.zen.ring
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.title
import dev.rinzai.zen.transition
import dev.rinzai.zen.weekStart
import dev.rinzai.zen.weekdayNames
import kotlin.math.round
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * A month as a grid of days, each shaded by its value (e.g. what was spent that day): busy days
 * stand out at a glance. Hover a day for its figure; with `onSelectedChange`, days are buttons.
 */
@Composable
fun CalendarHeatmap(
    month: Month,
    /** Each day's value, by date ("2026-09-03"); days missing have none. */
    values: Map<DateString, Number>,
    modifier: Modifier = Modifier,
    locale: String? = null,
    /** Turns a value into text for its label, e.g. as money. */
    format: ((Double) -> String)? = null,
    /** 0 for Sunday … 6 for Saturday (default: the locale's). */
    weekStartsOn: Int? = null,
    /** Makes the days buttons. */
    onSelectedChange: ((DateString) -> Unit)? = null,
    selected: DateString? = null,
    /** Accessible name (default: the month, e.g. "September 2026"). */
    label: String? = null,
) {
    val t = Zen.tokens
    val loc = locale(locale)
    val said = format ?: { formatNumber(it, loc) }
    val first = weekStartsOn ?: weekStart(loc)
    val days = List(daysInMonth(month)) { "$month-${(it + 1).toString().padStart(2, '0')}" }
    val lead = (dayOfWeek(days[0]) - first + 7) % 7
    val names = weekdayNames(loc, NameStyle.Narrow)
    val order = List(7) { (first + it) % 7 }
    val peak = days.maxOf { values[it]?.toDouble() ?: 0.0 }.coerceAtLeast(0.0)
    val name = label ?: formatMonth(month, loc, NameStyle.Long)

    Layout(
        content = {
            for (d in order) {
                Text(
                    names[d],
                    Modifier.padding(bottom = 4.dp).clearAndSetSemantics { },
                    style = TextStyles.xs.copy(textAlign = TextAlign.Center),
                    color = t.mutedForeground.color(),
                )
            }
            for (day in days) Day(day, values[day]?.toDouble(), peak, loc, said, day == selected, onSelectedChange)
        },
        modifier = modifier
            .fullWidth()
            .semantics {
                contentDescription = name
                isTraversalGroup = true
            },
    ) { measurables, constraints ->
        // A fixed table with border-spacing 4px: seven equal columns, square days, every edge
        // snapped to the pixel it falls on, as a browser paints a table's fractional tracks.
        val gap = 4.dp.toPx()
        val heads = measurables.subList(0, 7)
        val cells = measurables.subList(7, measurables.size)
        val size = if (constraints.hasBoundedWidth) (constraints.maxWidth - gap * 8) / 7
        else measurables.maxOf { it.maxIntrinsicWidth(Constraints.Infinity) }.toFloat()
        fun edge(i: Int) = (gap + i * (size + gap)).roundToInt()
        fun end(i: Int) = (gap + i * (size + gap) + size).roundToInt()
        val head = heads.map { it.measure(Constraints.fixedWidth(end(0) - edge(0))) }
        val headHeight = head.maxOf { it.height }
        val top = gap + headHeight + gap
        val rows = (lead + days.size + 6) / 7
        val placed = cells.mapIndexed { k, m ->
            val i = lead + k
            val x = edge(i % 7)
            val y = (top + i / 7 * (size + gap)).roundToInt()
            val bottom = (top + i / 7 * (size + gap) + size).roundToInt()
            Triple(m.measure(Constraints.fixed(end(i % 7) - x, bottom - y)), x, y)
        }
        val width = constraints.constrainWidth((gap * 8 + size * 7).roundToInt())
        val height = constraints.constrainHeight((top + rows * (size + gap)).roundToInt())
        layout(width, height) {
            head.forEachIndexed { c, p -> p.placeRelative(edge(c) + (end(c) - edge(c) - p.width) / 2, gap.roundToInt()) }
            for ((p, x, y) in placed) p.placeRelative(x, y)
        }
    }
}

@Composable
private fun Day(
    day: DateString,
    value: Double?,
    peak: Double,
    locale: String,
    format: (Double) -> String,
    chosen: Boolean,
    onSelect: ((DateString) -> Unit)?,
) {
    val t = Zen.tokens
    // A square root spreads small days apart, so one big day doesn't wash out the rest.
    val share = if (peak > 0 && value != null && value != 0.0) sqrt(value / peak).toFloat() else 0f
    val said = "${formatDate(day, locale, DateStyle.Day)}: ${format(value ?: 0.0)}"
    val fill = if (share > 0f) t.primary.color((round((0.14f + 0.81f * share) * 100f) / 100f)) else t.tint.color(0.04f)
    val ink = when {
        share > 0.6f -> t.primaryForeground.color()
        share > 0f -> t.foreground.color(0.8f)
        else -> t.mutedForeground.color()
    }
    val state = rememberControlState()
    val hover by animateColorAsState(t.tint.color(if (state.hovered && onSelect != null) 0.3f else 0f), transition(150))
    val shadows = buildList {
        if (chosen) add(ring(t.ring.color(), 2f))
        add(ring(hover, 1f))
        addAll(focusRing(state.focusVisible))
    }
    Box(
        Modifier
            .title(said)
            .box(Zen.radii.md, fill = SolidColor(fill), shadows = shadows)
            .then(
                if (onSelect != null) Modifier.control(state, role = null) { onSelect(day) } else Modifier,
            )
            .clearAndSetSemantics {
                contentDescription = said
                if (onSelect != null) {
                    role = Role.Button
                    toggleableState = ToggleableState(chosen)
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(formatNumber(day.takeLast(2).toDouble(), locale), style = TextStyles.tabular.copy(fontSize = 10.4.sp, lineHeight = 15.6.sp), color = ink)
    }
}
