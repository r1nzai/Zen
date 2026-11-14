package dev.rinzai.zen

import platform.Foundation.NSCalendar
import platform.Foundation.NSCalendarIdentifierGregorian
import platform.Foundation.NSCalendarUnitDay
import platform.Foundation.NSCalendarUnitHour
import platform.Foundation.NSCalendarUnitMinute
import platform.Foundation.NSCalendarUnitMonth
import platform.Foundation.NSCalendarUnitYear
import platform.Foundation.NSDate
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSDateFormatterFullStyle
import platform.Foundation.NSDateFormatterLongStyle
import platform.Foundation.NSDateFormatterMediumStyle
import platform.Foundation.NSDateFormatterShortStyle
import platform.Foundation.NSDateIntervalFormatter
import platform.Foundation.NSDateIntervalFormatterLongStyle
import platform.Foundation.NSDateIntervalFormatterMediumStyle
import platform.Foundation.NSDateIntervalFormatterNoStyle
import platform.Foundation.NSDateIntervalFormatterShortStyle
import platform.Foundation.NSLocale
import platform.Foundation.NSTimeZone
import platform.Foundation.calendarIdentifier
import platform.Foundation.dateWithTimeIntervalSince1970
import platform.Foundation.timeZoneForSecondsFromGMT

// Foundation formats dates with Apple's ICU: each locale's own calendar, patterns and ranges.
private fun nsLocale(locale: String) = NSLocale(localeIdentifier = locale.replace('-', '_'))

private fun calendar(locale: NSLocale) = NSCalendar(calendarIdentifier = locale.calendarIdentifier).apply {
    this.locale = locale
    timeZone = NSTimeZone.timeZoneForSecondsFromGMT(0)
}

private fun date(day: Int) = NSDate.dateWithTimeIntervalSince1970(day * 86400.0)

internal actual fun platformFormatDate(kind: DateKind, day: Int, locale: String): String {
    val loc = nsLocale(locale)
    val f = NSDateFormatter().apply {
        this.locale = loc
        calendar = calendar(loc)
        timeZone = NSTimeZone.timeZoneForSecondsFromGMT(0)
        when (kind) {
            DateKind.Short -> dateStyle = NSDateFormatterShortStyle
            DateKind.Medium -> dateStyle = NSDateFormatterMediumStyle
            DateKind.Long -> dateStyle = NSDateFormatterLongStyle
            DateKind.Full -> dateStyle = NSDateFormatterFullStyle
            else -> dateFormat = NSDateFormatter.dateFormatFromTemplate(kind.skeleton, 0u, loc) ?: kind.skeleton
        }
    }
    return f.stringFromDate(date(day))
}

internal actual fun platformFormatDateRange(kind: DateKind, start: Int, end: Int, locale: String): String {
    val loc = nsLocale(locale)
    val f = NSDateIntervalFormatter().apply {
        this.locale = loc
        calendar = calendar(loc)
        timeZone = NSTimeZone.timeZoneForSecondsFromGMT(0)
        timeStyle = NSDateIntervalFormatterNoStyle
        when (kind) {
            DateKind.Short -> dateStyle = NSDateIntervalFormatterShortStyle
            DateKind.Medium -> dateStyle = NSDateIntervalFormatterMediumStyle
            DateKind.Long -> dateStyle = NSDateIntervalFormatterLongStyle
            else -> dateTemplate = kind.skeleton
        }
    }
    return f.stringFromDate(date(start), toDate = date(end))
}

internal actual fun platformClock(locale: String): ClockPattern {
    val loc = nsLocale(locale)
    return clockFromPattern(NSDateFormatter.dateFormatFromTemplate("jmm", 0u, loc) ?: "HH:mm") { letters, hour ->
        NSDateFormatter().apply {
            this.locale = loc
            timeZone = NSTimeZone.timeZoneForSecondsFromGMT(0)
            dateFormat = letters
        }.stringFromDate(NSDate.dateWithTimeIntervalSince1970(hour * 3600.0 + 300))
    }
}

internal actual fun platformWeekStart(locale: String): Int =
    NSCalendar(calendarIdentifier = NSCalendarIdentifierGregorian).apply { this.locale = nsLocale(locale) }.firstWeekday.toInt() - 1

internal actual fun platformNow(): String {
    val parts = NSCalendar.currentCalendar.components(NSCalendarUnitHour or NSCalendarUnitMinute, fromDate = NSDate())
    return "${parts.hour.toString().padStart(2, '0')}:${parts.minute.toString().padStart(2, '0')}"
}

internal actual fun platformToday(): DateString {
    val parts = NSCalendar.currentCalendar.components(NSCalendarUnitYear or NSCalendarUnitMonth or NSCalendarUnitDay, fromDate = NSDate())
    return "${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}"
}
