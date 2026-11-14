package dev.rinzai.zen

/** A decimal as digits × 10^exp, exactly as the double's shortest form writes it. */
private class Decimal(val digits: String, val exp: Int) {
    val zero get() = digits == "0"

    /** Where its first digit is: 0 for 1–9, 3 for thousands. */
    val magnitude get() = if (zero) 0 else digits.length - 1 + exp

    fun shift(by: Int) = if (zero) this else Decimal(digits, exp + by)

    /** Rounded half away from zero to `places` decimals, as Intl rounds. */
    fun round(places: Int): Decimal {
        val drop = -exp - places
        if (zero || drop <= 0) return this
        if (drop > digits.length) return Decimal("0", 0)
        val keep = digits.take(digits.length - drop).ifEmpty { "0" }
        val up = digits[digits.length - drop] >= '5'
        val kept = if (up) keep.plusOne() else keep
        return of(kept, -places)
    }

    fun toDouble() = plain(0).toDouble()

    /** In plain digits with at least `minFraction` decimals ("1.20"), as plural rules read a number shown. */
    fun plain(minFraction: Int): String {
        val places = maxOf(-exp, 0)
        val padded = if (exp >= 0) digits + "0".repeat(exp) else digits.padStart(places + 1, '0')
        val fraction = padded.takeLast(places).padEnd(minFraction, '0')
        val whole = padded.dropLast(places)
        return if (fraction.isEmpty()) whole else "$whole.$fraction"
    }

    companion object {
        fun of(digits: String, exp: Int): Decimal {
            val trimmed = digits.trimStart('0')
            if (trimmed.isEmpty()) return Decimal("0", 0)
            val bare = trimmed.trimEnd('0')
            return Decimal(bare, exp + trimmed.length - bare.length)
        }

        fun of(value: Double): Decimal {
            val text = value.toString().lowercase()
            val mantissa = text.substringBefore('e')
            val e = text.substringAfter('e', "0").toInt()
            val fraction = mantissa.substringAfter('.', "")
            return of(mantissa.substringBefore('.') + fraction, e - fraction.length)
        }
    }
}

/** A string of digits plus one. */
private fun String.plusOne(): String {
    val d = toCharArray()
    var i = d.size - 1
    while (i >= 0 && d[i] == '9') d[i--] = '0'
    return if (i < 0) "1" + d.concatToString() else d.also { it[i] = it[i] + 1 }.concatToString()
}

private class CompactPattern(val zeros: Int, val count: String, val pattern: String)

private fun compactData(locale: String, key: String): String? =
    (cldrChain(intlLocale(locale, IntlNumberLocales)) + "und").firstNotNullOfOrNull { CompactPatterns["$it\u001F$key"] }

/** A locale's short patterns, from its numbering system's (or, without them, the Latin digits'). */
private fun compactPatterns(locale: String, currency: Boolean): List<CompactPattern> {
    val kind = if (currency) "c" else "d"
    val ns = compactData(locale, "ns")
    val text = compactData(locale, "$ns:$kind") ?: compactData(locale, "latn:$kind") ?: error("CLDR has no compact patterns")
    return text.split('\u001D').map {
        val (zeros, count, pattern) = it.split('\u001F')
        CompactPattern(zeros.toInt(), count, pattern)
    }
}

/**
 * `value` in Intl's compact notation ("1.2K", "₹4.2L", "1,5 Mio. €"): scaled by the locale's short
 * pattern for its magnitude and plural count, rounded to `fraction` digits (min, max) or, without
 * them, Intl's compact rounding (whole numbers from 10, else two significant digits).
 */
internal fun formatCompact(value: Double, locale: String, currency: String?, fraction: Pair<Int, Int>?, grouping: Boolean): String {
    val patterns = compactPatterns(locale, currency != null)
    val most = patterns.maxOf { it.zeros }
    val negative = value < 0 || (value == 0.0 && 1 / value < 0)
    val abs = Decimal.of(kotlin.math.abs(value))
    var magnitude = abs.magnitude
    while (true) {
        val at = minOf(magnitude, most)
        val other = patterns.firstOrNull { it.zeros == at && it.count == "other" }?.pattern ?: "0"
        val shift = if (other == "0") 0 else at - (other.substringBefore(';').count { it == '0' } - 1)
        val scaled = abs.shift(-shift)
        val (minF, maxF) = fraction ?: (0 to if (scaled.magnitude >= 1 || scaled.zero) 0 else 1 - scaled.magnitude)
        val rounded = scaled.round(maxF)
        // Rounded up into the next magnitude (999.96K is 1M): its pattern, then.
        if (rounded.magnitude + shift > magnitude && !rounded.zero) {
            magnitude = rounded.magnitude + shift
            continue
        }
        // Grouped only from five digits (1234, 15,000), as Intl groups a compact number.
        val group = grouping && rounded.magnitude >= 4
        val signed = if (negative) -rounded.toDouble() else rounded.toDouble()
        if (other == "0") {
            val style = if (currency != null) NumberStyle.Currency else NumberStyle.Decimal
            return platformFormatNumber(signed, locale, style, currency, minF, maxF, 1, group)
        }
        val count = pluralCategory(rounded.plain(minF), locale).name.lowercase()
        fun find(key: String) = patterns.firstOrNull { it.zeros == at && it.count == key }?.pattern
        var pattern = find(count) ?: other
        val symbol = currency?.let { currencySymbol(it, locale) }
        if (symbol != null && letterNextToNumber(pattern, symbol)) pattern = find("$count+") ?: find("other+") ?: pattern
        val number = platformFormatNumber(rounded.toDouble(), locale, NumberStyle.Decimal, null, minF, maxF, 1, group)
        if (!negative) return render(pattern.substringBefore(';'), number, symbol.orEmpty(), "")
        // The locale's minus, as it writes -1 (marks and all): where a negative pattern puts it, else before the whole.
        val one = platformFormatNumber(1.0, locale, NumberStyle.Decimal, null, 0, 0, 1, false)
        val minusOne = platformFormatNumber(-1.0, locale, NumberStyle.Decimal, null, 0, 0, 1, false)
        val minus = if (minusOne.endsWith(one)) minusOne.removeSuffix(one) else minusOne.removePrefix(one)
        if (';' in pattern) return render(pattern.substringAfter(';'), number, symbol.orEmpty(), minus)
        val text = render(pattern, number, symbol.orEmpty(), "")
        return if (minusOne.endsWith(one)) minus + text else text + minus
    }
}

/** Whether the currency symbol touches the number in `pattern` with a letter ("CHF" before "0K"). */
private fun letterNextToNumber(pattern: String, symbol: String): Boolean {
    val s = pattern.indexOf('¤')
    val z = pattern.indexOf('0')
    if (s < 0 || z < 0 || symbol.isEmpty()) return false
    return if (s < z) s + 1 == z && symbol.last().isLetter() else pattern.lastIndexOf('0') + 1 == s && symbol.first().isLetter()
}

/** A CLDR pattern with its run of zeros as `number`, ¤ as `symbol`, - as `minus`, and quoted text as it is. */
private fun render(pattern: String, number: String, symbol: String, minus: String): String {
    val out = StringBuilder()
    var i = 0
    var placed = false
    while (i < pattern.length) {
        val c = pattern[i]
        when {
            c == '\'' -> {
                val end = pattern.indexOf('\'', i + 1).takeIf { it > 0 } ?: pattern.length
                out.append(if (end == i + 1) "'" else pattern.substring(i + 1, end))
                i = end + 1
                continue
            }
            c == '0' -> if (!placed) {
                out.append(number)
                placed = true
            }
            c == '¤' -> out.append(symbol)
            c == '-' -> out.append(minus)
            else -> out.append(c)
        }
        i++
    }
    return out.toString()
}
