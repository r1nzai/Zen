package dev.rinzai.zen

/** "locale\u001Funit/display" → "other\u001Fcount=pattern…", read once from the generated chunks. */
private val UnitPatterns: Map<String, String> by lazy {
    val table = HashMap<String, String>()
    var locale = ""
    for (record in UnitPatternChunks.joinToString("").split('\u001E')) {
        var rest = record
        val header = rest.indexOf('\u001D')
        if (header >= 0) {
            locale = rest.substring(0, header)
            rest = rest.substring(header + 1)
        }
        if (rest.isEmpty()) continue
        val key = rest.substringBefore('\u001F')
        table["$locale\u001F$key"] = rest.substringAfter('\u001F')
    }
    table
}

// Number formats come from the platform; the unit's pattern, and the plural form it takes, from CLDR.
internal actual fun platformFormatUnit(
    value: Double,
    locale: String,
    unit: String,
    display: UnitDisplay,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String {
    // As ICU writes it: short and narrow percent take the locale's percent pattern (its own spacing).
    if (unit == "percent" && display != UnitDisplay.Long) {
        return platformFormatNumber(value / 100, locale, NumberStyle.Percent, null, minFraction, maxFraction, minInteger, grouping)
    }
    val key = unit + "/" + when (display) {
        UnitDisplay.Long -> "l"
        UnitDisplay.Short -> "s"
        UnitDisplay.Narrow -> "n"
    }
    val patterns = (cldrChain(intlLocale(locale, IntlNumberLocales)) + "und").firstNotNullOfOrNull { UnitPatterns["$it\u001F$key"] }
        ?: throw IllegalArgumentException("Not a unit Intl formats: $unit")
    val number = platformFormatNumber(value, locale, NumberStyle.Decimal, null, minFraction, maxFraction, minInteger, grouping)
    val digits = platformFormatNumber(value, "en", NumberStyle.Decimal, null, minFraction, maxFraction, 1, false)
    val count = pluralCategory(digits, locale).name.lowercase()
    val forms = patterns.split('\u001F')
    val pattern = forms.drop(1).firstOrNull { it.startsWith("$count=") }?.substringAfter('=') ?: forms.first()
    return pattern.replace("{0}", number)
}
