package dev.rinzai.zen

/** How a repeat counts: in days, weeks, months or years. */
enum class RepeatUnit { Day, Week, Month, Year }

/**
 * How often something comes round: every `every` days, weeks, months or years. Weekly can name
 * `weekdays` (0 for Sunday … 6); monthly a `day` of the month (-1 for the last). Otherwise it falls
 * on the start date's.
 */
data class Repeat(val every: Int, val unit: RepeatUnit, val weekdays: List<Int>? = null, val day: Int? = null)

internal val RepeatUnit.word get() = name.lowercase()

/** "Every 2 weeks on Mon, Thu", "Every month on day 5", "Every year on Sep 3" (from `start`), in `messages`' words. */
fun describeRepeat(repeat: Repeat, locale: String, start: DateString? = null, messages: Messages = Messages.English): String {
    val m = messages
    val what = m.repeatEvery(repeat.every, m.repeatUnit(repeat.unit.word, repeat.every))
    val weekdays = repeat.weekdays
    return when {
        repeat.unit == RepeatUnit.Week && !weekdays.isNullOrEmpty() -> {
            val names = weekdayNames(locale)
            m.repeatOn(what, formatUnitList(weekdays.sorted().map { names[it] }, locale))
        }
        repeat.unit == RepeatUnit.Month && repeat.day != null -> m.repeatOn(what, if (repeat.day == -1) m.repeatLastDay else m.repeatDay(repeat.day))
        repeat.unit == RepeatUnit.Year && start != null -> m.repeatOn(what, formatDate(start, locale, DateStyle.Day))
        else -> what
    }
}

/** The next `count` dates it falls on, from `start` (which sets the cycle) onwards, not before `from`. */
fun nextOccurrences(repeat: Repeat, start: DateString, count: Int, from: DateString = start): List<DateString> {
    val out = mutableListOf<DateString>()
    val every = maxOf(1, repeat.every)
    // From the cycle just before `from`, and bounded, so a far `from` is quick and nothing loops forever.
    val first = maxOf(0, unitsBetween(repeat.unit, start, from).floorDiv(every) - 1)
    var cycle = first
    while (out.size < count && cycle < first + count + 2) {
        for (date in inCycle(repeat, start, cycle * every)) if (date >= start && date >= from && out.size < count) out += date
        cycle++
    }
    return out
}

private fun unitsBetween(unit: RepeatUnit, from: DateString, to: DateString): Int {
    if (unit == RepeatUnit.Day) return daysBetween(from, to)
    if (unit == RepeatUnit.Week) return daysBetween(from, to).floorDiv(7)
    val months = (to.substring(0, 4).toInt() - from.substring(0, 4).toInt()) * 12 + to.substring(5, 7).toInt() - from.substring(5, 7).toInt()
    return if (unit == RepeatUnit.Month) months else months.floorDiv(12)
}

/** The dates in the cycle `n` units after the start's, in order. */
private fun inCycle(repeat: Repeat, start: DateString, n: Int): List<DateString> = when (repeat.unit) {
    RepeatUnit.Day -> listOf(addDays(start, n))
    RepeatUnit.Week -> {
        val days = repeat.weekdays?.takeIf { it.isNotEmpty() }?.distinct()?.sorted() ?: listOf(dayOfWeek(start))
        // From the Sunday of the start's week.
        val sunday = addDays(start, -dayOfWeek(start) + n * 7)
        days.map { addDays(sunday, it) }
    }
    RepeatUnit.Month -> {
        val month = addMonthsToDate("${start.substring(0, 7)}-01", n).substring(0, 7)
        val last = daysInMonth(month)
        val want = repeat.day ?: start.substring(8).toInt()
        val day = if (want == -1) last else minOf(want, last)
        listOf("$month-${day.toString().padStart(2, '0')}")
    }
    RepeatUnit.Year -> listOf(addMonthsToDate(start, n * 12))
}

/** "Mon, Thu" as Intl.ListFormat writes a short list of units, from CLDR's patterns. */
internal fun formatUnitList(items: List<String>, locale: String): String {
    val patterns = (cldrChain(intlLocale(locale, IntlListLocales)) + "und").firstNotNullOf { ListPatterns[it] }
    val (start, middle, end, two) = patterns.split('\u001F')
    fun fill(p: String, a: String, b: String) = p.replace("{0}", a).replace("{1}", b)
    if (items.size < 2) return items.firstOrNull() ?: ""
    if (items.size == 2) return fill(two, items[0], items[1])
    var out = fill(end, items[items.size - 2], items.last())
    for (i in items.size - 3 downTo 1) out = fill(middle, items[i], out)
    return fill(start, items[0], out)
}
