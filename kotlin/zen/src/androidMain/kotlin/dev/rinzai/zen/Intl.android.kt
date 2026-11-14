package dev.rinzai.zen

import android.icu.text.DecimalFormat
import android.icu.text.MeasureFormat
import android.icu.text.NumberFormat
import android.icu.util.Currency
import android.icu.util.Measure
import android.icu.util.MeasureUnit
import android.icu.util.ULocale
import java.math.BigDecimal

// Android has ICU, as browsers do: lakh grouping and the rest come as Intl gives them.
actual fun currencyDigits(currency: String): Int = Currency.getInstance(currency).defaultFractionDigits

actual fun currencySymbol(currency: String, locale: String): String = Currency.getInstance(currency).getSymbol(ULocale.forLanguageTag(locale))

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
    val loc = ULocale.forLanguageTag(locale)
    val f = when (style) {
        NumberStyle.Decimal, NumberStyle.Unit -> NumberFormat.getNumberInstance(loc)
        NumberStyle.Percent -> NumberFormat.getPercentInstance(loc)
        NumberStyle.Currency -> NumberFormat.getCurrencyInstance(loc).also { it.currency = Currency.getInstance(currency) }
    } as DecimalFormat
    f.minimumFractionDigits = minFraction
    f.maximumFractionDigits = maxFraction
    f.minimumIntegerDigits = minInteger
    f.isGroupingUsed = grouping
    @Suppress("DEPRECATION")
    f.roundingMode = BigDecimal.ROUND_HALF_UP
    return f.format(value)
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
): String {
    val loc = ULocale.forLanguageTag(locale)
    val measure = MeasureUnit.getAvailable().firstOrNull { it.subtype == unit }
        ?: throw IllegalArgumentException("Not a unit Intl formats: $unit")
    val number = (NumberFormat.getNumberInstance(loc) as DecimalFormat).apply {
        minimumFractionDigits = minFraction
        maximumFractionDigits = maxFraction
        minimumIntegerDigits = minInteger
        isGroupingUsed = grouping
        @Suppress("DEPRECATION")
        roundingMode = BigDecimal.ROUND_HALF_UP
    }
    val width = when (display) {
        UnitDisplay.Long -> MeasureFormat.FormatWidth.WIDE
        UnitDisplay.Short -> MeasureFormat.FormatWidth.SHORT
        UnitDisplay.Narrow -> MeasureFormat.FormatWidth.NARROW
    }
    return MeasureFormat.getInstance(loc, width, number).format(Measure(value, measure))
}
