package dev.rinzai.zen

import kotlin.math.min

/**
 * Calendar date as "YYYY-MM-DD": no time and no time zone, so it never shifts
 * a day. Compares correctly as a string.
 */
typealias DateString = String

/** Calendar month as "YYYY-MM". Compares correctly as a string. */
typealias Month = String

/** A start and an end date; `end` is null while only the start is picked. */
data class DateRange(val start: DateString, val end: DateString?)

private val DATE = Regex("^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$")
private val MONTH = Regex("^(\\d{4})-(0[1-9]|1[0-2])$")

fun isDate(value: Any?): Boolean {
    if (value !is String) return false
    val m = DATE.find(value) ?: return false
    return m.groupValues[3].toInt() <= daysInMonth("${m.groupValues[1]}-${m.groupValues[2]}")
}

/** Days since 1970-01-01; lets date arithmetic be plain integer maths. */
fun dayIndex(date: DateString): Int {
    val (y, m, d) = date.split('-').map { it.toInt() }
    return daysFromCivil(y, m, d)
}

fun fromDayIndex(index: Int): DateString {
    val (y, m, d) = civilFromDays(index)
    return "${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}"
}

fun addDays(date: DateString, n: Int): DateString = fromDayIndex(dayIndex(date) + n)

/** The same day n months later, kept within the month (Jan 31 + 1 month is Feb 28 or 29). */
fun addMonthsToDate(date: DateString, n: Int): DateString {
    val (y, m, d) = date.split('-').map { it.toInt() }
    val month = fromMonthIndex(y * 12 + m - 1 + n)
    return "$month-${pad(min(d, daysInMonth(month)), 2)}"
}

fun daysInMonth(month: Month): Int {
    val (y, m) = month.split('-').map { it.toInt() }
    return daysFromCivil(if (m == 12) y + 1 else y, if (m == 12) 1 else m + 1, 1) - daysFromCivil(y, m, 1)
}

/** 0 for Sunday … 6 for Saturday. */
fun dayOfWeek(date: DateString): Int = (dayIndex(date) + 4).mod(7) // 1970-01-01 was a Thursday

/** Today in the user's time zone. */
fun today(): DateString = platformToday()

/** The time now in the user's time zone, "HH:mm". */
fun now(): String = platformNow()

internal expect fun platformNow(): String

/**
 * The ranges people pick most, up to `today`: label them yourself, e.g. for
 * DateRangePicker's presets. Weeks start on `weekStartsOn` (0 for Sunday).
 */
fun commonRanges(today: DateString, weekStartsOn: Int = 1): CommonRanges {
    val month = today.take(7)
    val lastMonth = addMonthsToDate("$month-01", -1)
    return CommonRanges(
        today = DateRange(today, today),
        thisWeek = DateRange(addDays(today, -(dayOfWeek(today) - weekStartsOn).mod(7)), today),
        last7Days = DateRange(addDays(today, -6), today),
        last30Days = DateRange(addDays(today, -29), today),
        thisMonth = DateRange("$month-01", today),
        lastMonth = DateRange(lastMonth, addDays("$month-01", -1)),
        thisYear = DateRange("${today.take(4)}-01-01", today),
    )
}

data class CommonRanges(
    val today: DateRange,
    val thisWeek: DateRange,
    val last7Days: DateRange,
    val last30Days: DateRange,
    val thisMonth: DateRange,
    val lastMonth: DateRange,
    val thisYear: DateRange,
)

/** Days from `from` to `to` (negative if `to` is earlier). */
fun daysBetween(from: DateString, to: DateString): Int = dayIndex(to) - dayIndex(from)

/** How much of a date to show; `Day` is the day and month without the year ("Sep 3"), for dates within the year. */
enum class DateStyle { Day, Short, Medium, Long, Full }

private val DateStyle.kind
    get() = when (this) {
        DateStyle.Day -> DateKind.Day
        DateStyle.Short -> DateKind.Short
        DateStyle.Medium -> DateKind.Medium
        DateStyle.Long -> DateKind.Long
        DateStyle.Full -> DateKind.Full
    }

/**
 * "Sep 30, 2026" (or the locale's equivalent) by default; `Day` is "Sep 30",
 * `Short` "9/30/26", `Long` "September 30, 2026", `Full` adds the weekday.
 */
fun formatDate(date: DateString, locale: String, style: DateStyle = DateStyle.Medium): String =
    plainSpaces(platformFormatDate(style.kind, dayIndex(date), locale))

/** "Sep 3 – 10, 2026" (or the locale's equivalent), sharing what the two dates have in common. */
fun formatDateRange(start: DateString, end: DateString, locale: String, style: DateStyle = DateStyle.Medium): String {
    require(style != DateStyle.Full) { "A range can't be Full" }
    // Intl formats a range of one day as that day.
    if (start == end) return formatDate(start, locale, style)
    return plainSpaces(platformFormatDateRange(style.kind, dayIndex(start), dayIndex(end), locale))
}

enum class NameStyle { Narrow, Short, Long }

/** Weekday names for a locale, Sunday first. */
fun weekdayNames(locale: String, style: NameStyle = NameStyle.Short): List<String> {
    val kind = when (style) {
        NameStyle.Narrow -> DateKind.WeekdayNarrow
        NameStyle.Short -> DateKind.WeekdayShort
        NameStyle.Long -> DateKind.WeekdayLong
    }
    return List(7) { platformFormatDate(kind, 19358 + it, locale) } // 2023-01-01 was a Sunday
}

/** The first day of the week for a locale: 0 for Sunday, 1 for Monday, 6 for Saturday. */
fun weekStart(locale: String): Int = platformWeekStart(locale)

/** Months since year 0; lets month arithmetic be plain integer maths. */
fun monthIndex(month: Month): Int {
    val m = MONTH.find(month) ?: throw IllegalArgumentException("Invalid month: $month")
    return m.groupValues[1].toInt() * 12 + m.groupValues[2].toInt() - 1
}

fun fromMonthIndex(index: Int): Month = "${pad(index.floorDiv(12), 4)}-${pad((index).mod(12) + 1, 2)}"

fun isMonth(value: Any?): Boolean = value is String && MONTH.matches(value)

fun addMonths(month: Month, n: Int): Month = fromMonthIndex(monthIndex(month) + n)

/** Every month from `from` to `to`, inclusive. Empty if `to` is before `from`. */
fun monthRange(from: Month, to: Month): List<Month> = (monthIndex(from)..monthIndex(to)).map(::fromMonthIndex)

fun monthsBetween(from: Month, to: Month): Int = monthIndex(to) - monthIndex(from)

fun currentMonth(): Month = today().take(7)

/** "Sep 2026" (or the locale's equivalent); "September 2026" with style Long. */
fun formatMonth(month: Month, locale: String, style: NameStyle = NameStyle.Short): String {
    require(style != NameStyle.Narrow) { "A month is Short or Long" }
    val kind = if (style == NameStyle.Long) DateKind.MonthYearLong else DateKind.MonthYearShort
    return platformFormatDate(kind, dayIndex("$month-01"), locale)
}

/** Short month names for a locale, January first. */
fun monthNames(locale: String): List<String> = List(12) { platformFormatDate(DateKind.MonthShort, dayIndex("2000-${pad(it + 1, 2)}-01"), locale) }

/** A time's part as a locale shows it: the hour, the minute, AM/PM, or the text between them. */
internal enum class ClockSegment { Hour, Minute, DayPeriod }

internal class ClockPart(val segment: ClockSegment?, val text: String)

/**
 * A locale's clock, as Intl shows hour "numeric" and minute "2-digit": its parts in order (as at
 * 15:05), whether its hours count round 12, and its names for 9:05 and 15:05.
 */
internal class ClockPattern(val parts: List<ClockPart>, val h12: Boolean, val periods: Pair<String, String>)

internal expect fun platformClock(locale: String): ClockPattern

/** A clock from an ICU pattern (the "jmm" skeleton's best pattern), `period` naming a time by its day-period letters. */
internal fun clockFromPattern(pattern: String, period: (letters: String, hour: Int) -> String): ClockPattern {
    val parts = mutableListOf<ClockPart>()
    var h12 = false
    var letters = ""
    val literal = StringBuilder()
    fun text() {
        if (literal.isNotEmpty()) parts += ClockPart(null, plainSpaces(literal.toString()))
        literal.clear()
    }
    var i = 0
    while (i < pattern.length) {
        val c = pattern[i]
        when {
            c == '\'' -> {
                val close = pattern.indexOf('\'', i + 1).let { if (it < 0) pattern.length else it }
                literal.append(if (close == i + 1) "'" else pattern.substring(i + 1, close))
                i = close + 1
            }
            c.isLetter() -> {
                var end = i
                while (end < pattern.length && pattern[end] == c) end++
                text()
                val segment = when (c) {
                    'h', 'K' -> ClockSegment.Hour.also { h12 = true }
                    'H', 'k' -> ClockSegment.Hour
                    'm' -> ClockSegment.Minute
                    'a', 'b', 'B' -> ClockSegment.DayPeriod.also { letters = pattern.substring(i, end) }
                    else -> error("No time field $c in $pattern")
                }
                parts += ClockPart(segment, "")
                i = end
            }
            else -> literal.append(c).also { i++ }
        }
    }
    text()
    return ClockPattern(parts, h12, if (letters.isEmpty()) "" to "" else plainSpaces(period(letters, 9)) to plainSpaces(period(letters, 15)))
}

/** What of a date a platform formats: each is one of Intl's options, and its pattern for the locale. */
internal enum class DateKind(val key: String, val skeleton: String) {
    Short("short", ""),
    Medium("medium", ""),
    Long("long", ""),
    Full("full", ""),
    Day("day", "MMMd"),
    MonthYearShort("yMMM", "yMMM"),
    MonthYearLong("yMMMM", "yMMMM"),
    MonthShort("MMM", "MMM"),
    WeekdayShort("E", "EEE"),
    WeekdayLong("EEEE", "EEEE"),
    WeekdayNarrow("EEEEE", "EEEEE"),
}

/** The date `day` days after 1970-01-01 as `kind`, in the locale's own calendar, at UTC. */
internal expect fun platformFormatDate(kind: DateKind, day: Int, locale: String): String

/** Two different dates as a range, sharing what they have in common. */
internal expect fun platformFormatDateRange(kind: DateKind, start: Int, end: Int, locale: String): String

internal expect fun platformWeekStart(locale: String): Int

internal expect fun platformToday(): DateString

private fun pad(n: Int, width: Int) = n.toString().padStart(width, '0')

/** Howard Hinnant's days_from_civil: the proleptic Gregorian calendar, without a platform. */
private fun daysFromCivil(year: Int, month: Int, day: Int): Int {
    val y = if (month <= 2) year - 1 else year
    val era = y.floorDiv(400)
    val yoe = y - era * 400
    val doy = (153 * (if (month > 2) month - 3 else month + 9) + 2) / 5 + day - 1
    val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
    return era * 146097 + doe - 719468
}

private fun civilFromDays(days: Int): Triple<Int, Int, Int> {
    val z = days + 719468
    val era = z.floorDiv(146097)
    val doe = z - era * 146097
    val yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365
    val doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
    val mp = (5 * doy + 2) / 153
    val d = doy - (153 * mp + 2) / 5 + 1
    val m = if (mp < 10) mp + 3 else mp - 9
    return Triple(yoe + era * 400 + if (m <= 2) 1 else 0, m, d)
}
