package dev.rinzai.zen

import kotlin.test.Test
import kotlin.test.assertEquals

/** What Intl.NumberFormat gives in Chrome (V8's ICU), for the same locale and options. */
class IntlTest {
    private val trend = NumberOptions(NumberStyle.Percent, maximumFractionDigits = 1, signDisplay = SignDisplay.ExceptZero)

    @Test
    fun percentWithSign() {
        assertEquals("+8.4%", formatNumber(0.084, "en-US", trend))
        assertEquals("-5%", formatNumber(-0.05, "en-US", trend))
        assertEquals("0%", formatNumber(0.0, "en-US", trend))
        assertEquals("+12%", formatNumber(0.12, "en-US", trend))
    }

    @Test
    fun cldrGrouping() {
        assertEquals("₹1,52,000.00", formatNumber(152000.0, "en-IN", NumberOptions(NumberStyle.Currency, "INR")))
        assertEquals("1,52,00,000.5", formatNumber(15200000.5, "en-IN"))
        assertEquals("1234", formatNumber(1234.0, "es-ES"))
        assertEquals("12.345", formatNumber(12345.0, "es-ES"))
        assertEquals("1,234", formatNumber(1234.0, "es-MX"))
        assertEquals("-₹32,740.50", formatNumber(-32740.5, "en-IN", NumberOptions(NumberStyle.Currency, "INR")))
    }

    @Test
    fun locales() {
        assertEquals("\$152,000.00", formatNumber(152000.0, "en-US", NumberOptions(NumberStyle.Currency, "USD")))
        assertEquals("1.234.567,891", formatNumber(1234567.891, "de-DE"))
        assertEquals("26\u00A0%", formatNumber(0.256, "fr-FR", NumberOptions(NumberStyle.Percent)))
        assertEquals("￥1,500", formatNumber(1500.0, "ja-JP", NumberOptions(NumberStyle.Currency, "JPY")))
    }

    @Test
    fun digits() {
        assertEquals("3", formatNumber(2.5, "en-US", NumberOptions(maximumFractionDigits = 0)))
        assertEquals("07", formatNumber(7.0, "en-US", NumberOptions(minimumIntegerDigits = 2, useGrouping = false)))
        assertEquals("+\$5.00", formatNumber(5.0, "en-US", NumberOptions(NumberStyle.Currency, "USD", signDisplay = SignDisplay.Always)))
    }

    private fun rows(file: String) = IntlTest::class.java.getResource("/$file")!!.readText()
        .lines().filter { it.isNotEmpty() && !it.startsWith("#") }.map { it.split('\t') }

    /** Every row of scripts/intl-fixture.mjs's table, with what differs listed together. */
    private fun check(file: String, actual: (List<String>) -> String) {
        val wrong = rows(file).mapNotNull { row ->
            val got = runCatching { actual(row) }.getOrElse { "! $it" }
            if (got == row.last()) null else "${row.dropLast(1)}: expected <${row.last()}>, got <$got>"
        }
        assertEquals(emptyList(), wrong.groupBy { it.substringBefore(",") + it.substringAfter(",").substringBefore(",") }.map { (k, v) -> "$k x${v.size}: ${v.first()}" }, "${wrong.size} differ")
    }

    @Test
    fun numbersAsIntl() = check("intl-numbers.tsv") { (locale, style, currency, min, max, grouping, value) ->
        formatNumber(
            value.toDouble(),
            locale,
            NumberOptions(
                NumberStyle.valueOf(style.replaceFirstChar { it.uppercase() }),
                currency = currency.ifEmpty { null },
                minimumFractionDigits = min.toIntOrNull(),
                maximumFractionDigits = max.toIntOrNull(),
                useGrouping = grouping.toBoolean(),
            ),
        )
    }

    @Test
    fun compactAsIntl() = check("intl-compact.tsv") { (locale, style, currency, min, max, grouping, value) ->
        formatNumber(
            value.toDouble(),
            locale,
            NumberOptions(
                NumberStyle.valueOf(style.replaceFirstChar { it.uppercase() }),
                currency = currency.ifEmpty { null },
                minimumFractionDigits = min.toIntOrNull(),
                maximumFractionDigits = max.toIntOrNull(),
                useGrouping = grouping.toBoolean(),
                notation = Notation.Compact,
            ),
        )
    }

    @Test
    fun unitsAsIntl() = check("intl-units.tsv") { (locale, unit, display, value) ->
        formatNumber(value.toDouble(), locale, NumberOptions(NumberStyle.Unit, unit = unit, unitDisplay = UnitDisplay.valueOf(display.replaceFirstChar { it.uppercase() })))
    }

    @Test
    fun datesAsIntl() = check("intl-dates.tsv") { (kind, locale, style, value) ->
        val name = { s: String -> s.replaceFirstChar { it.uppercase() } }
        when (kind) {
            "date" -> formatDate(value, locale, DateStyle.valueOf(name(style)))
            "range" -> formatDateRange(value.substringBefore('/'), value.substringAfter('/'), locale, DateStyle.valueOf(name(style)))
            "month" -> formatMonth(value, locale, NameStyle.valueOf(name(style)))
            "monthNames" -> monthNames(locale).joinToString("|")
            "weekdays" -> weekdayNames(locale, NameStyle.valueOf(name(style))).joinToString("|")
            "weekStart" -> weekStart(locale).toString()
            "clock" -> platformClock(locale).let { c ->
                val order = c.parts.joinToString("") { p -> p.segment?.let { "{${it.name.replaceFirstChar(Char::lowercase)}}" } ?: p.text }
                listOf(order, c.h12, c.periods.first, c.periods.second).joinToString("|")
            }
            else -> error(kind)
        }
    }

    @Test
    fun pluralsAsIntl() = check("intl-plurals.tsv") { (locale, digits) -> pluralCategory(digits, locale).name.lowercase() }
}

private operator fun <T> List<T>.component6() = this[5]
private operator fun <T> List<T>.component7() = this[6]
