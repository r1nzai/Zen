package dev.rinzai.zen

import android.icu.text.DateFormat
import android.icu.text.DateIntervalFormat
import android.icu.text.DateTimePatternGenerator
import android.icu.text.SimpleDateFormat
import android.icu.util.Calendar
import android.icu.util.DateInterval
import android.icu.util.TimeZone
import android.icu.util.ULocale
import java.text.FieldPosition
import java.time.LocalDate
import java.util.Date

// Android has ICU, as browsers do: each locale's own calendar, patterns and ranges as Intl gives them.
private const val DAY = 86400000L

private fun formatter(kind: DateKind, loc: ULocale): DateFormat = when (kind) {
    DateKind.Short -> DateFormat.getDateInstance(DateFormat.SHORT, loc)
    DateKind.Medium -> DateFormat.getDateInstance(DateFormat.MEDIUM, loc)
    DateKind.Long -> DateFormat.getDateInstance(DateFormat.LONG, loc)
    DateKind.Full -> DateFormat.getDateInstance(DateFormat.FULL, loc)
    else -> DateFormat.getInstanceForSkeleton(kind.skeleton, loc)
}.apply { timeZone = TimeZone.GMT_ZONE }

internal actual fun platformFormatDate(kind: DateKind, day: Int, locale: String): String =
    formatter(kind, ULocale.forLanguageTag(locale)).format(Date(day * DAY))

internal actual fun platformFormatDateRange(kind: DateKind, start: Int, end: Int, locale: String): String {
    val loc = ULocale.forLanguageTag(locale)
    // As V8 does, a date style's range takes the skeleton of the style's pattern.
    val skeleton = kind.skeleton.ifEmpty { DateTimePatternGenerator.getInstance(loc).getSkeleton((formatter(kind, loc) as SimpleDateFormat).toPattern()) }
    val f = DateIntervalFormat.getInstance(skeleton, loc).apply { timeZone = TimeZone.GMT_ZONE }
    return f.format(DateInterval(start * DAY, end * DAY), StringBuffer(), FieldPosition(0)).toString()
}

internal actual fun platformClock(locale: String): ClockPattern {
    val loc = ULocale.forLanguageTag(locale)
    return clockFromPattern(DateTimePatternGenerator.getInstance(loc).getBestPattern("jmm")) { letters, hour ->
        SimpleDateFormat(letters, loc).apply { timeZone = TimeZone.GMT_ZONE }.format(Date(hour * 3600000L + 300000))
    }
}

internal actual fun platformWeekStart(locale: String): Int = Calendar.getInstance(ULocale.forLanguageTag(locale)).firstDayOfWeek - Calendar.SUNDAY

internal actual fun platformNow(): String = java.time.LocalTime.now().toString().take(5)

internal actual fun platformToday(): DateString = LocalDate.now().toString()
