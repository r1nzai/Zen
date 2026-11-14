package dev.rinzai.zen

import platform.Foundation.NSLocale
import platform.Foundation.NSNumber
import platform.Foundation.NSNumberFormatter
import platform.Foundation.NSNumberFormatterCurrencyStyle
import platform.Foundation.NSNumberFormatterDecimalStyle
import platform.Foundation.NSNumberFormatterPercentStyle
import platform.Foundation.NSNumberFormatterRoundHalfUp

private fun formatter(locale: String, style: NumberStyle, currency: String?) = NSNumberFormatter().apply {
    this.locale = NSLocale(localeIdentifier = locale.replace('-', '_'))
    numberStyle = when (style) {
        NumberStyle.Decimal, NumberStyle.Unit -> NSNumberFormatterDecimalStyle
        NumberStyle.Percent -> NSNumberFormatterPercentStyle
        NumberStyle.Currency -> NSNumberFormatterCurrencyStyle
    }
    if (currency != null) currencyCode = currency
}

actual fun currencyDigits(currency: String): Int = formatter("en", NumberStyle.Currency, currency).maximumFractionDigits.toInt()

actual fun currencySymbol(currency: String, locale: String): String = formatter(locale, NumberStyle.Currency, currency).currencySymbol

internal actual fun platformFormatNumber(
    value: Double,
    locale: String,
    style: NumberStyle,
    currency: String?,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String = formatter(locale, style, currency).run {
    minimumFractionDigits = minFraction.toULong()
    maximumFractionDigits = maxFraction.toULong()
    minimumIntegerDigits = minInteger.toULong()
    usesGroupingSeparator = grouping
    roundingMode = NSNumberFormatterRoundHalfUp
    stringFromNumber(NSNumber(value)) ?: value.toString()
}
