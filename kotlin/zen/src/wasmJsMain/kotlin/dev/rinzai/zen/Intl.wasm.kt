package dev.rinzai.zen

// Intl, as the web library formats: the browser's own ICU and options.

actual fun currencyDigits(currency: String): Int =
    js("new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2")

actual fun currencySymbol(currency: String, locale: String): String =
    js("new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency")

private fun format(
    value: Double,
    locale: String,
    style: String,
    currency: String?,
    unit: String?,
    unitDisplay: String?,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String = js(
    """new Intl.NumberFormat(locale, {
    style,
    ...(currency != null && { currency }),
    ...(unit != null && { unit, unitDisplay }),
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction,
    minimumIntegerDigits: minInteger,
    useGrouping: grouping,
}).format(value)""",
)

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
    val name = when (style) {
        NumberStyle.Decimal, NumberStyle.Unit -> "decimal"
        NumberStyle.Percent -> "percent"
        NumberStyle.Currency -> "currency"
    }
    return format(value, locale, name, currency, null, null, minFraction, maxFraction, minInteger, grouping)
}

internal actual fun platformFormatUnit(
    value: Double,
    locale: String,
    unit: String,
    display: UnitDisplay,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String = format(value, locale, "unit", null, unit, display.name.lowercase(), minFraction, maxFraction, minInteger, grouping)
