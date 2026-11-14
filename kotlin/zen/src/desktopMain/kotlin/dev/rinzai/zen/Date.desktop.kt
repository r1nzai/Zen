package dev.rinzai.zen

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.WeekFields

// The JDK's dates follow its own CLDR, behind Chrome's: dates are formatted here from the patterns
// Intl resolves, generated in DateData.kt, in the calendar each locale defaults to.

/** "locale\u001Fkey" → value, read once from the generated chunks. */
private val DateData: Map<String, String> by lazy {
    val table = HashMap<String, String>()
    var locale = ""
    for (record in DateDataChunks.joinToString("").split('\u001E')) {
        var rest = record
        val header = rest.indexOf('\u001D')
        if (header >= 0) {
            locale = rest.substring(0, header)
            rest = rest.substring(header + 1)
        }
        if (rest.isEmpty()) continue
        table["$locale\u001F${rest.substringBefore('\u001F')}"] = rest.substringAfter('\u001F')
    }
    table
}

private fun resolved(locale: String) = intlLocale(locale, IntlDateLocales)

/** A key of a locale `resolved` gives, from it or its CLDR parents. */
private fun data(locale: String, key: String): String =
    (cldrChain(locale) + "und").firstNotNullOfOrNull { DateData["$it\u001F$key"] } ?: error("No date $key for $locale")

internal actual fun platformFormatDate(kind: DateKind, day: Int, locale: String): String {
    val loc = resolved(locale)
    val date = CalendarDate.of(day, data(loc, "cal"))
    return render(data(loc, kind.key), loc, date, date)
}

internal actual fun platformFormatDateRange(kind: DateKind, start: Int, end: Int, locale: String): String {
    val loc = resolved(locale)
    val cal = data(loc, "cal")
    val (from, to) = CalendarDate.of(start, cal) to CalendarDate.of(end, cal)
    val diff = when {
        from.year != to.year -> "y"
        from.month != to.month -> "M"
        else -> "d"
    }
    return render(data(loc, "${kind.key}~$diff"), loc, from, to)
}

internal actual fun platformClock(locale: String): ClockPattern {
    val loc = resolved(locale)
    val pattern = data(loc, "time")
    val parts = mutableListOf<ClockPart>()
    var h12 = false
    var periods = "" to ""
    var i = 0
    while (i < pattern.length) {
        val open = pattern.indexOf('\u0001', i).let { if (it < 0) pattern.length else it }
        if (open > i) parts += ClockPart(null, plainSpaces(pattern.substring(i, open)))
        if (open == pattern.length) break
        val close = pattern.indexOf('\u0001', open + 1)
        val code = pattern.substring(open + 1, close)
        parts += ClockPart(
            when (code[0]) {
                'h', 'K' -> ClockSegment.Hour.also { h12 = true }
                'H', 'k' -> ClockSegment.Hour
                'm' -> ClockSegment.Minute
                // The names of each hour at :05.
                '@' -> ClockSegment.DayPeriod.also { data(loc, code.substring(1)).split('\u001F').let { periods = plainSpaces(it[9]) to plainSpaces(it[15]) } }
                else -> error("No time field $code")
            },
            "",
        )
        i = close + 1
    }
    return ClockPattern(parts, h12, periods)
}

internal actual fun platformWeekStart(locale: String): Int {
    val tags = locale.split('-', '_')
    val region = tags.drop(1).takeWhile { it.length > 1 }.firstOrNull { it.length == 2 && it.all(Char::isLetter) || it.length == 3 && it.all(Char::isDigit) }
    if (region != null) return RegionFirstDays[region.uppercase()] ?: 1
    val language = tags[0].lowercase()
    val script = tags.getOrNull(1)?.takeIf { it.length == 4 }?.let { it[0].uppercase() + it.substring(1).lowercase() }
    return script?.let { LanguageFirstDay["$language-$it"] } ?: LanguageFirstDay[language] ?: 1
}

private val LanguageFirstDay: Map<String, Int> by lazy {
    LanguageFirstDays.flatMap { (day, tags) -> tags.split(' ').map { it to day } }.toMap()
}

internal actual fun platformNow(): String = java.time.LocalTime.now().toString().take(5)

internal actual fun platformToday(): DateString = LocalDate.now().toString()

/** A date in a calendar: its year, month (1 to 12) and day, with the day it is for week years and weekdays. */
private class CalendarDate(val year: Int, val month: Int, val day: Int, val epochDay: Int) {
    companion object {
        fun of(epochDay: Int, calendar: String): CalendarDate {
            val g = LocalDate.ofEpochDay(epochDay.toLong())
            return when (calendar) {
                "gregory" -> CalendarDate(g.year, g.monthValue, g.dayOfMonth, epochDay)
                "buddhist" -> CalendarDate(g.year + 543, g.monthValue, g.dayOfMonth, epochDay)
                "persian" -> persian(epochDay)
                else -> error("No $calendar calendar")
            }
        }

        // ICU's arithmetic Persian calendar: 8 leap years in every 33.
        private val PersianMonthStarts = intArrayOf(0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336)

        private fun persian(epochDay: Int): CalendarDate {
            val sinceEpoch = epochDay.toLong() + 2440588 - 1948320 // Julian days, from 1 Farvardin 1
            val year = (33 * sinceEpoch + 3).floorDiv(12053) + 1
            val dayOfYear = (sinceEpoch - (365 * (year - 1) + (8 * year + 21).floorDiv(33))).toInt()
            val month = if (dayOfYear < 216) dayOfYear / 31 else (dayOfYear - 6) / 30
            return CalendarDate(year.toInt(), month + 1, dayOfYear - PersianMonthStarts[month] + 1, epochDay)
        }
    }
}

/** A generated pattern filled in: fields in \u0001…\u0001 from `start`, in \u0002…\u0002 from `end`. */
private fun render(pattern: String, locale: String, start: CalendarDate, end: CalendarDate): String {
    val digits = data(locale, "digits").let { d -> List(10) { d.codePointAt(d.offsetByCodePoints(0, it)) } }
    fun native(n: Int, width: Int) = buildString { n.toString().padStart(width, '0').forEach { appendCodePoint(digits[it - '0']) } }
    val out = StringBuilder()
    var i = 0
    while (i < pattern.length) {
        val c = pattern[i]
        if (c != '\u0001' && c != '\u0002') {
            out.append(c)
            i++
            continue
        }
        val close = pattern.indexOf(c, i + 1)
        val code = pattern.substring(i + 1, close)
        val date = if (c == '\u0001') start else end
        out.append(
            when {
                code.startsWith('@') -> names(locale, code.substring(1), date)
                code.startsWith('Y') -> native(weekYear(date, code.substring(1)), 1)
                else -> when (code) {
                    "y" -> native(date.year, 1)
                    "yy" -> native(date.year % 100, 2)
                    "M", "MM" -> native(date.month, code.length)
                    "d", "dd" -> native(date.day, code.length)
                    else -> error("No date field $code")
                }
            },
        )
        i = close + 1
    }
    return out.toString()
}

/** The month or weekday name for `date`, from the names under `key` (m… months, w… weekdays). */
private fun names(locale: String, key: String, date: CalendarDate): String {
    val names = data(locale, key).split('\u001F')
    return when (key[0]) {
        'm' -> names[date.month - 1]
        'w' -> names[(date.epochDay + 4).mod(7)]
        else -> error("No names $key for a date")
    }
}

/** The year the date's week belongs to, weeks starting on day f (0 for Sunday) with at least m days in a year: "f/m". */
private fun weekYear(date: CalendarDate, rule: String): Int {
    val (first, minDays) = rule.split('/').map { it.toInt() }
    val fields = WeekFields.of(if (first == 0) DayOfWeek.SUNDAY else DayOfWeek.of(first), minDays)
    return LocalDate.ofEpochDay(date.epochDay.toLong()).get(fields.weekBasedYear())
}
