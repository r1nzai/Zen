package dev.rinzai.zen

import kotlin.math.abs

/**
 * Money as a whole number of minor units (paise, cents). Never do arithmetic on floats; only
 * formatting converts to a decimal for display.
 */
typealias Money = Long

/** Number.MAX_SAFE_INTEGER: amounts stay within what the web library can hold exactly. */
private const val SAFE = 9_007_199_254_740_991L

private fun pow10(n: Int): Long {
    var p = 1L
    repeat(n) { p *= 10 }
    return p
}

private fun Money.toDecimal(digits: Int): Double = this.toDouble() / pow10(digits)

/** With symbol: en-IN gives lakh/crore grouping (₹1,52,000.00); en-US gives $152,000.00. */
fun formatMoney(amount: Money, currency: String, locale: String, showDecimals: Boolean = true): String {
    val digits = currencyDigits(currency)
    val shown = if (showDecimals) digits else 0
    return formatNumber(
        amount.toDecimal(digits),
        locale,
        NumberOptions(NumberStyle.Currency, currency, minimumFractionDigits = shown, maximumFractionDigits = shown),
    )
}

/** Number without symbol, e.g. "1,52,000" or "32,740.50". Decimals only when non-zero. */
fun formatAmount(amount: Money, currency: String, locale: String): String {
    val digits = currencyDigits(currency)
    val fraction = amount % pow10(digits) != 0L
    return formatNumber(
        amount.toDecimal(digits),
        locale,
        NumberOptions(minimumFractionDigits = if (fraction) digits else 0, maximumFractionDigits = digits),
    )
}

class MoneyParseError(input: String) : IllegalArgumentException("Not an amount: $input")

private fun safe(digits: String, input: String): Long =
    digits.toLongOrNull()?.takeIf { it <= SAFE } ?: throw MoneyParseError(input)

private val Separators = Regex("[\\s,_]")
private val LeadingSymbol = Regex("^([+-]?)[^\\d.+-]+")
private val Plain = Regex("^([+-]?)(\\d*)(?:\\.(\\d*))?$")

/**
 * Parses user input to minor units using string arithmetic (no float rounding). Accepts grouping
 * separators (commas, spaces, underscores), a leading sign or currency symbol, and at most the
 * currency's number of decimals.
 */
fun parseMoney(input: String, currency: String): Money {
    val digits = currencyDigits(currency)
    val cleaned = input.trim().replace(Separators, "").replace(LeadingSymbol, "$1")
    val m = Plain.find(cleaned) ?: throw MoneyParseError(input)
    val (sign, whole, frac) = m.destructured
    if (whole.isEmpty() && frac.isEmpty()) throw MoneyParseError(input)
    if (frac.length > digits) throw MoneyParseError(input)
    val minor = safe(whole.ifEmpty { "0" } + frac.padEnd(digits, '0'), input)
    return if (sign == "-") -minor else minor
}

private val Suffixes = mapOf(
    "k" to 3, "thousand" to 3,
    "l" to 5, "lac" to 5, "lakh" to 5, "lakhs" to 5,
    "cr" to 7, "crore" to 7, "crores" to 7,
    "m" to 6, "mn" to 6, "million" to 6,
)

// An operator after the start of an amount; a leading sign belongs to the first amount.
private val Operator = Regex("(?<=[\\d.a-z])\\s*([+\\-−*/×÷])\\s*", RegexOption.IGNORE_CASE)

/**
 * Like parseMoney, plus shorthand: "1.5L" (lakh), "2cr" (crore), "10k", "1.2m", and sums:
 * "120 + 45.50 - 10", "3 * 12.99", "1200 / 4" (× and ÷ too). Amounts add exactly; times and
 * divide take plain numbers and round to the currency's smallest unit (halves away from zero).
 */
fun parseMoneyInput(input: String, currency: String): Money {
    val text = input.trim()
    // As JS's split with a capture group: amounts and the operators between them, alternating.
    val parts = mutableListOf<String>()
    var from = 0
    for (op in Operator.findAll(text)) {
        parts += text.substring(from, op.range.first)
        parts += op.groupValues[1]
        from = op.range.last + 1
    }
    parts += text.substring(from)
    if (parts.size == 1) return parseAmount(input, currency)
    var total = 0L
    var i = 0
    while (i < parts.size) {
        val sign = if (i == 0 || parts[i - 1] == "+") 1 else -1
        var term = parseAmount(parts[i], currency)
        i += 2
        while (i < parts.size && parts[i - 1] in setOf("*", "/", "×", "÷")) {
            term = scale(term, parts[i], parts[i - 1] == "*" || parts[i - 1] == "×", input)
            i += 2
        }
        total += sign * term
        if (abs(total) > SAFE) throw MoneyParseError(input)
    }
    return total
}

private val Factor = Regex("^(\\d*)(?:\\.(\\d+))?$")

private tailrec fun gcd(a: Long, b: Long): Long = if (b == 0L) a else gcd(b, a % b)

/** `minor` times or divided by a plain decimal number, rounded to a whole minor unit. */
private fun scale(minor: Money, by: String, times: Boolean, input: String): Money {
    val m = Factor.find(by.trim()) ?: throw MoneyParseError(input)
    val (whole, frac) = m.destructured
    if (whole.isEmpty() && frac.isEmpty()) throw MoneyParseError(input)
    val n = (whole + frac).trimStart('0').ifEmpty { "0" }.toLongOrNull() ?: throw MoneyParseError(input)
    val unit = pow10(frac.length)
    var (num, den) = if (times) n to unit else unit to n
    if (den == 0L) throw MoneyParseError(input)
    // Reduced first, so only a result past any amount overflows.
    val g = gcd(num, den).coerceAtLeast(1)
    num /= g
    den /= g
    val product = abs(minor).let { a -> if (num != 0L && a > Long.MAX_VALUE / 2 / num) throw MoneyParseError(input) else a * num }
    val rounded = (product * 2 + den) / (den * 2)
    return if (minor < 0) -rounded else rounded
}

private val Shorthand = Regex("^\\s*(.*?)\\s*([a-z]+)\\s*$", RegexOption.IGNORE_CASE)
private val ShortAmount = Regex("^([+-]?)[^\\d.+-]*([\\d,\\s_]*)(?:\\.(\\d*))?$")

/** One amount: parseMoney plus shorthand. */
private fun parseAmount(input: String, currency: String): Money {
    val m = Shorthand.find(input)
    val power = m?.let { Suffixes[it.groupValues[2].lowercase()] } ?: return parseMoney(input, currency)
    val digits = currencyDigits(currency)
    val n = ShortAmount.find(m.groupValues[1]) ?: throw MoneyParseError(input)
    val whole = n.groupValues[2].replace(Separators, "")
    val frac = n.groupValues[3]
    if (whole.isEmpty() && frac.isEmpty()) throw MoneyParseError(input)
    val shift = power + digits
    if (frac.length > shift) throw MoneyParseError(input)
    val minor = safe(whole.ifEmpty { "0" } + frac.padEnd(shift, '0'), input)
    return if (n.groupValues[1] == "-") -minor else minor
}
