package dev.rinzai.zen

import java.math.BigDecimal
import java.math.RoundingMode

// The JDK's CLDR lags the browsers' (Arabic's digits, Mexican Spanish's percent, Bengali's grouping):
// numbers are formatted here from CLDR's own data, generated in NumberData.kt, as ICU formats them.

/** "locale\u001Fkey" → value, read once from the generated chunks. */
private val NumberData: Map<String, String> by lazy {
    val table = HashMap<String, String>()
    var locale = ""
    for (record in NumberDataChunks.joinToString("").split('\u001E')) {
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

private fun data(locale: String, key: String): String? =
    (cldrChain(intlLocale(locale, IntlNumberLocales)) + "und").firstNotNullOfOrNull { NumberData["$it\u001F$key"] }

private fun required(locale: String, key: String) = data(locale, key) ?: error("CLDR has no $key")

actual fun currencyDigits(currency: String): Int = CurrencyFractionDigits[currency.uppercase()] ?: 2

actual fun currencySymbol(currency: String, locale: String): String = data(locale, "¤${currency.uppercase()}") ?: currency.uppercase()

internal actual fun platformFormatNumber(
    value: Double,
    locale: String,
    style: NumberStyle,
    currency: String?,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String {
    val symbol = if (style == NumberStyle.Currency) currencySymbol(requireNotNull(currency), locale) else ""
    val pattern = when (style) {
        NumberStyle.Decimal, NumberStyle.Unit -> required(locale, "decimalPattern")
        NumberStyle.Percent -> required(locale, "percentPattern")
        // A symbol with a letter next to the number takes the pattern that spaces it off.
        NumberStyle.Currency -> required(locale, if (pattern(required(locale, "currencyPattern")).letterNextTo(symbol)) "currencyAlphaPattern" else "currencyPattern")
    }
    val negative = value < 0 || (value == 0.0 && 1 / value < 0)
    val digits = digits(kotlin.math.abs(value), if (style == NumberStyle.Percent) 2 else 0, minFraction, maxFraction, minInteger)
    val parts = pattern.split(';')
    // Without its own negative pattern, a number's minus goes before the whole positive one.
    val sub = pattern(if (negative && parts.size > 1) parts[1] else parts[0])
    val number = group(digits, sub, locale, grouping)
    val minus = required(locale, "minus")
    val text = sub.render(number, symbol, required(locale, "percent"), minus)
    return if (negative && parts.size == 1) minus + text else text
}

/**
 * The number's digits rounded as ICU rounds them: half away from zero, from the shortest decimal for
 * the double, scaled by 10^`shift` (a percentage's 100) as a decimal, so 1.005 is 100.5%, not 100.49….
 */
private fun digits(value: Double, shift: Int, minFraction: Int, maxFraction: Int, minInteger: Int): Pair<String, String> {
    val rounded = BigDecimal(value.toString()).movePointRight(shift).setScale(maxFraction, RoundingMode.HALF_UP)
    val plain = rounded.toPlainString()
    val whole = plain.substringBefore('.').padStart(minInteger, '0')
    var fraction = plain.substringAfter('.', "")
    while (fraction.length > minFraction && fraction.endsWith('0')) fraction = fraction.dropLast(1)
    return whole to fraction
}

/** The digits in the locale's own numerals, grouped and with its separators, as the pattern groups them. */
private fun group(digits: Pair<String, String>, pattern: Pattern, locale: String, grouping: Boolean): String {
    val (whole, fraction) = digits
    val minimum = required(locale, "minimumGrouping").toInt()
    val groups = mutableListOf<String>()
    if (grouping && pattern.primary > 0 && whole.length >= pattern.primary + minimum) {
        var rest = whole
        groups.add(0, rest.takeLast(pattern.primary))
        rest = rest.dropLast(pattern.primary)
        while (rest.length > pattern.secondary) {
            groups.add(0, rest.takeLast(pattern.secondary))
            rest = rest.dropLast(pattern.secondary)
        }
        groups.add(0, rest)
    } else groups.add(whole)
    val numerals = numerals(required(locale, "ns"))
    val native = { s: String -> s.map { numerals[it - '0'] }.joinToString("") }
    val integer = groups.joinToString(required(locale, "group")) { native(it) }
    return if (fraction.isEmpty()) integer else integer + required(locale, "decimal") + native(fraction)
}

/** A numbering system's ten digits, each one code point (some lie past the BMP). */
private fun numerals(system: String): List<String> {
    val digits = NumberingDigits[system] ?: error("No digits for $system")
    val out = mutableListOf<String>()
    var i = 0
    while (i < digits.length) {
        val wide = digits[i].isHighSurrogate()
        out += digits.substring(i, i + if (wide) 2 else 1)
        i += if (wide) 2 else 1
    }
    return out
}

private fun pattern(text: String) = Pattern.parse(text)

/** A CLDR number pattern: the text before and after its number, and the number's grouping sizes. */
private class Pattern(val prefix: String, val suffix: String, val primary: Int, val secondary: Int) {
    /** Whether the currency symbol `symbol` would have a letter next to the number. */
    fun letterNextTo(symbol: String): Boolean = when {
        prefix.endsWith('¤') -> symbol.lastOrNull()?.let(::spaced) == true
        suffix.startsWith('¤') -> symbol.firstOrNull()?.let(::spaced) == true
        else -> false
    }

    fun render(number: String, currency: String, percent: String, minus: String): String {
        fun fill(part: String, before: Boolean): String {
            var text = part.replace("¤", currency).replace("%", percent).replace("-", minus)
            // CLDR's currency spacing: a letter in the symbol next to a digit gets a no-break space.
            if (currency.isNotEmpty() && '¤' in part) {
                if (before && part.endsWith('¤') && currency.lastOrNull()?.let(::spaced) == true) text += ' '
                if (!before && part.startsWith('¤') && currency.firstOrNull()?.let(::spaced) == true) text = " $text"
            }
            return text
        }
        return fill(prefix, before = true) + number + fill(suffix, before = false)
    }

    companion object {
        private val NumberPart = Regex("[#0,.@]+(?:[#0,.@]|\\s(?=[#0]))*")

        fun parse(text: String): Pattern {
            val m = NumberPart.find(text) ?: error("Not a number pattern: $text")
            val integer = m.value.substringBefore('.')
            val sizes = integer.split(',').drop(1).map { it.length }
            val primary = sizes.lastOrNull() ?: 0
            val secondary = if (sizes.size > 1) sizes[sizes.size - 2] else primary
            return Pattern(unquote(text.substring(0, m.range.first)), unquote(text.substring(m.range.last + 1)), primary, secondary)
        }

        private fun unquote(text: String) = text.replace("''", "\u0000").replace("'", "").replace("\u0000", "'")
    }
}

/** [[:^S:]&[:^Z:]]: neither a symbol nor a space, so a digit beside it needs one. */
private fun spaced(c: Char): Boolean = when (c.category) {
    CharCategory.MATH_SYMBOL, CharCategory.CURRENCY_SYMBOL, CharCategory.MODIFIER_SYMBOL, CharCategory.OTHER_SYMBOL,
    CharCategory.SPACE_SEPARATOR, CharCategory.LINE_SEPARATOR, CharCategory.PARAGRAPH_SEPARATOR -> false
    else -> true
}
