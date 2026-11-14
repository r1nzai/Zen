package dev.rinzai.zen

// Intl.DateTimeFormat, with the options the web library gives it for each kind, at UTC.

private fun options(kind: DateKind): String = when (kind) {
    DateKind.Short, DateKind.Medium, DateKind.Long, DateKind.Full -> """{"dateStyle":"${kind.key}"}"""
    DateKind.Day -> """{"day":"numeric","month":"short"}"""
    DateKind.MonthYearShort -> """{"month":"short","year":"numeric"}"""
    DateKind.MonthYearLong -> """{"month":"long","year":"numeric"}"""
    DateKind.MonthShort -> """{"month":"short"}"""
    DateKind.WeekdayShort -> """{"weekday":"short"}"""
    DateKind.WeekdayLong -> """{"weekday":"long"}"""
    DateKind.WeekdayNarrow -> """{"weekday":"narrow"}"""
}

private fun formatDate(options: String, locale: String, ms: Double): String =
    js("new Intl.DateTimeFormat(locale, { ...JSON.parse(options), timeZone: 'UTC' }).format(ms)")

private fun formatRange(options: String, locale: String, start: Double, end: Double): String =
    js("new Intl.DateTimeFormat(locale, { ...JSON.parse(options), timeZone: 'UTC' }).formatRange(start, end)")

internal actual fun platformFormatDate(kind: DateKind, day: Int, locale: String): String =
    formatDate(options(kind), locale, day * 86_400_000.0)

internal actual fun platformFormatDateRange(kind: DateKind, start: Int, end: Int, locale: String): String =
    formatRange(options(kind), locale, start * 86_400_000.0, end * 86_400_000.0)

// The parts of 15:05 as `type value` lines, whether it counts hours round 12, then the names for 9:05 and 15:05.
private fun clock(locale: String): String = js(
    """{
    const f = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
    const at = (h) => f.formatToParts(Date.UTC(2020, 0, 1, h, 5));
    const period = (h) => at(h).find((p) => p.type === 'dayPeriod')?.value ?? '';
    return [f.resolvedOptions().hourCycle?.startsWith('h1') ? '1' : '0', period(9), period(15), ...at(15).map((p) => p.type + ' ' + p.value)].join('\n');
}""",
)

internal actual fun platformClock(locale: String): ClockPattern {
    val lines = clock(locale).split('\n')
    val parts = lines.drop(3).map { line ->
        val type = line.substringBefore(' ')
        val segment = when (type) {
            "hour" -> ClockSegment.Hour
            "minute" -> ClockSegment.Minute
            "dayPeriod" -> ClockSegment.DayPeriod
            else -> null
        }
        ClockPart(segment, if (segment == null) plainSpaces(line.substringAfter(' ')) else "")
    }
    return ClockPattern(parts, lines[0] == "1", plainSpaces(lines[1]) to plainSpaces(lines[2]))
}

// Intl counts Monday 1 … Sunday 7; where a browser has no week info, the regions whose weeks start on Sunday or Saturday.
internal actual fun platformWeekStart(locale: String): Int = js(
    """{
    try {
        const loc = new Intl.Locale(locale);
        const info = loc.getWeekInfo?.() ?? loc.weekInfo;
        if (info) return info.firstDay % 7;
        const region = loc.maximize().region ?? '';
        const sunday = 'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(' ');
        const saturday = 'AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' ');
        return sunday.includes(region) ? 0 : saturday.includes(region) ? 6 : 1;
    } catch {
        return 1;
    }
}""",
)

internal actual fun platformNow(): String = js(
    """{
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}""",
)

internal actual fun platformToday(): DateString = js(
    """{
    const d = new Date();
    return String(d.getFullYear()).padStart(4, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}""",
)
