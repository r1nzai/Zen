package dev.rinzai.zen

import kotlin.test.Test
import kotlin.test.assertEquals

class RepeatTest {
    @Test
    fun saysItPlainly() {
        assertEquals("Every day", describeRepeat(Repeat(1, RepeatUnit.Day), "en-US"))
        assertEquals("Every 2 weeks on Mon, Thu", describeRepeat(Repeat(2, RepeatUnit.Week, weekdays = listOf(4, 1)), "en-US"))
        assertEquals("Every month on day 5", describeRepeat(Repeat(1, RepeatUnit.Month, day = 5), "en-US"))
        assertEquals("Every 3 months on the last day", describeRepeat(Repeat(3, RepeatUnit.Month, day = -1), "en-US"))
        assertEquals("Every year on Sep 3", describeRepeat(Repeat(1, RepeatUnit.Year), "en-US", "2026-09-03"))
    }

    @Test
    fun listsAsIntlDoes() {
        // Intl.ListFormat(locale, { style: 'short', type: 'unit' }).
        assertEquals("A, B, C", formatUnitList(listOf("A", "B", "C"), "en-US"))
        assertEquals("A, B et C", formatUnitList(listOf("A", "B", "C"), "fr-FR"))
        assertEquals("A y B", formatUnitList(listOf("A", "B"), "es-MX"))
    }

    @Test
    fun stepsDaysAndWeeksFromTheStart() {
        assertEquals(listOf("2026-03-30", "2026-04-02", "2026-04-05"), nextOccurrences(Repeat(3, RepeatUnit.Day), "2026-03-30", 3))
        // 2026-03-04 is a Wednesday: every 2 weeks on Mon and Thu.
        assertEquals(
            listOf("2026-03-05", "2026-03-16", "2026-03-19", "2026-03-30"),
            nextOccurrences(Repeat(2, RepeatUnit.Week, weekdays = listOf(1, 4)), "2026-03-04", 4),
        )
    }

    @Test
    fun keepsAMonthlyDayInsideShortMonthsAndCanMeanTheLastDay() {
        assertEquals(listOf("2026-01-31", "2026-02-28", "2026-03-31"), nextOccurrences(Repeat(1, RepeatUnit.Month), "2026-01-31", 3))
        assertEquals(listOf("2026-01-31", "2026-02-28"), nextOccurrences(Repeat(1, RepeatUnit.Month, day = -1), "2026-01-10", 2))
        assertEquals(listOf("2026-02-05", "2026-03-05"), nextOccurrences(Repeat(1, RepeatUnit.Month, day = 5), "2026-01-10", 2))
    }

    @Test
    fun landsALeapDayOnFeb28InOtherYearsAndStartsFromFrom() {
        assertEquals(listOf("2028-02-29", "2029-02-28"), nextOccurrences(Repeat(1, RepeatUnit.Year), "2028-02-29", 2))
        assertEquals(listOf("2026-06-05", "2026-07-05"), nextOccurrences(Repeat(1, RepeatUnit.Month, day = 5), "2026-01-05", 2, "2026-06-01"))
    }

    @Test
    fun findsDatesFarPastTheStartQuickly() {
        assertEquals(listOf("2026-10-06", "2026-10-07"), nextOccurrences(Repeat(1, RepeatUnit.Day), "2020-01-01", 2, "2026-10-06"))
        assertEquals(listOf("2026-10-14"), nextOccurrences(Repeat(2, RepeatUnit.Week), "2020-01-01", 1, "2026-10-06"))
    }
}
