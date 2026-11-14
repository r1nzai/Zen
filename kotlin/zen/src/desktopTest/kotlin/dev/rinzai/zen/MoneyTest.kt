package dev.rinzai.zen

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

/** The web library's money tests, so both parse and format alike. */
class MoneyTest {
    private fun major(n: Long) = n * 100

    @Test
    fun digits() {
        assertEquals(2, currencyDigits("INR"))
        assertEquals(0, currencyDigits("JPY"))
    }

    @Test
    fun formats() {
        assertEquals("₹1,52,000.00", formatMoney(15200000, "INR", "en-IN"))
        assertEquals("-₹32,740", formatMoney(-3274000, "INR", "en-IN", showDecimals = false))
        assertEquals("$152,000.00", formatMoney(15200000, "USD", "en-US"))
        assertEquals("₹1,23,45,679", formatMoney(1234567890, "INR", "en-IN", showDecimals = false))
    }

    @Test
    fun parses() {
        assertEquals(15200000, parseMoney("1,52,000", "INR"))
        assertEquals(3274050, parseMoney("₹ 32,740.50", "INR"))
        assertEquals(-700000, parseMoney("-7000", "INR"))
        assertEquals(10, parseMoney("0.1", "INR"))
        assertEquals(29, parseMoney("0.29", "USD"))
        assertEquals(50, parseMoney(".5", "INR"))
        assertEquals(100000000, parseMoney("1 000 000", "EUR"))
        assertEquals(500, parseMoney("500", "JPY"))
        for (bad in listOf("", "abc", "1.234", "1.2.3", "--5", ".", "1e5", "500.5")) {
            assertFailsWith<MoneyParseError>(bad) { parseMoney(bad, if (bad == "500.5") "JPY" else "INR") }
        }
    }

    @Test
    fun shorthand() {
        assertEquals(major(150_000), parseMoneyInput("1.5L", "INR"))
        assertEquals(major(152_000), parseMoneyInput("1.52 lakh", "INR"))
        assertEquals(major(20_000_000), parseMoneyInput("2cr", "INR"))
        assertEquals(major(10_000), parseMoneyInput("10k", "INR"))
        assertEquals(major(1_200_000), parseMoneyInput("1.2m", "USD"))
        assertEquals(-major(32_740), parseMoneyInput("-32.74k", "INR"))
        assertEquals(1234560, parseMoneyInput("0.123456L", "INR"))
        assertEquals(major(152_000), parseMoneyInput("1,52,000", "INR"))
        assertFailsWith<MoneyParseError> { parseMoneyInput("5 bananas", "INR") }
        assertFailsWith<MoneyParseError> { parseMoneyInput("L", "INR") }
        assertEquals(12345678, parseMoneyInput("1.2345678L", "INR"))
        assertFailsWith<MoneyParseError> { parseMoneyInput("1.23456789L", "INR") }
    }

    @Test
    fun sums() {
        assertEquals(16550, parseMoneyInput("120 + 45.50", "USD"))
        assertEquals(30, parseMoneyInput("0.10+0.20", "USD"))
        assertEquals(91225, parseMoneyInput("1,200 - 300 + 12.25", "USD"))
        assertEquals(major(11_500), parseMoneyInput("10k+1.5k", "INR"))
        assertEquals(7500, parseMoneyInput("$100 − $25", "USD"))
        assertEquals(-1500, parseMoneyInput("-20 + 5", "USD"))
        assertEquals(3897, parseMoneyInput("3 * 12.99", "USD"))
        assertEquals(4397, parseMoneyInput("12.99 × 3 + 5", "USD"))
        assertEquals(3333, parseMoneyInput("100 / 3", "USD"))
        assertEquals(6667, parseMoneyInput("200 ÷ 3", "USD"))
        assertEquals(501, parseMoneyInput("10.01 * 0.5", "USD"))
        assertEquals(375, parseMoneyInput("1500 / 4", "JPY"))
        for (bad in listOf("100 +", "100 / 0", "100 * $2", "5 bananas + 2")) {
            assertFailsWith<MoneyParseError>(bad) { parseMoneyInput(bad, "USD") }
        }
    }

    @Test
    fun amounts() {
        assertEquals("1,52,000", formatAmount(major(152_000), "INR", "en-IN"))
        assertEquals("32,740.50", formatAmount(3274050, "INR", "en-IN"))
        assertEquals("-1,000,000", formatAmount(-major(1_000_000), "USD", "en-US"))
        assertEquals("₹", currencySymbol("INR", "en-IN"))
        assertEquals("€", currencySymbol("EUR", "de-DE"))
    }
}
