package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.round

/** The locale components format with (a BCP 47 tag such as "en-IN"), as the web library's LocaleProvider gives it. */
val LocalLocale = staticCompositionLocalOf { "en-US" }

/** The locale from the nearest LocaleProvider, or `own` when given (a component's own `locale`). */
@Composable
fun locale(own: String? = null): String = own ?: LocalLocale.current

enum class NumberStyle { Decimal, Percent, Currency, Unit }

/** How a unit is written: long ("12.5 kilometers"), short ("12.5 km") or narrow ("12.5km"). */
enum class UnitDisplay { Long, Short, Narrow }

enum class SignDisplay { Auto, ExceptZero, Always, Never }

/** Numbers in full, or compact ("1.2K", "₹4.2L"), as Intl's short compact notation writes them. */
enum class Notation { Standard, Compact }

/** The options of Intl.NumberFormat that Zen formats with; unset digits take Intl's defaults for the style. */
data class NumberOptions(
    val style: NumberStyle = NumberStyle.Decimal,
    val currency: String? = null,
    /** For the Unit style: one of the units Intl.NumberFormat takes ("kilometer", "percent", "day"…). */
    val unit: String? = null,
    val unitDisplay: UnitDisplay = UnitDisplay.Short,
    val minimumFractionDigits: Int? = null,
    val maximumFractionDigits: Int? = null,
    val minimumIntegerDigits: Int = 1,
    val useGrouping: Boolean = true,
    val signDisplay: SignDisplay = SignDisplay.Auto,
    /** Compact takes the Decimal or Currency style. */
    val notation: Notation = Notation.Standard,
)

/** Intl.NumberFormat(locale, options).format(value), from the platform's own CLDR data. */
fun formatNumber(value: Double, locale: String, options: NumberOptions = NumberOptions()): String {
    val compact = options.notation == Notation.Compact
    require(!compact || options.style == NumberStyle.Decimal || options.style == NumberStyle.Currency) { "Compact notation takes the Decimal or Currency style" }
    val (defaultMin, defaultMax) = when {
        // Compact numbers round as Intl's compact rounding unless their digits are given.
        compact -> 0 to 3
        else -> when (options.style) {
        NumberStyle.Decimal, NumberStyle.Unit -> 0 to 3
        NumberStyle.Percent -> 0 to 0
        NumberStyle.Currency -> currencyDigits(requireNotNull(options.currency) { "Currency style needs a currency" }).let { it to it }
        }
    }
    val min = options.minimumFractionDigits ?: minOf(defaultMin, options.maximumFractionDigits ?: defaultMin)
    val max = options.maximumFractionDigits ?: maxOf(defaultMax, min)
    val scaled = if (options.style == NumberStyle.Percent) value * 100 else value
    val zero = round(abs(scaled) * 10.0.pow(max)) == 0.0
    val plus = when (options.signDisplay) {
        SignDisplay.Always -> scaled >= 0
        SignDisplay.ExceptZero -> scaled > 0 && !zero
        else -> false
    }
    val magnitude = if (options.signDisplay == SignDisplay.Never || plus || (zero && options.signDisplay == SignDisplay.ExceptZero)) abs(value) else value
    val digits = (min to max).takeUnless { compact && options.minimumFractionDigits == null && options.maximumFractionDigits == null }
    val fmt = { v: Double ->
        if (compact) {
            formatCompact(v, locale, options.currency.takeIf { options.style == NumberStyle.Currency }, digits, options.useGrouping)
        } else if (options.style == NumberStyle.Unit) {
            platformFormatUnit(v, locale, requireNotNull(options.unit) { "Unit style needs a unit" }, options.unitDisplay, min, max, options.minimumIntegerDigits, options.useGrouping)
        } else platformFormatNumber(v, locale, options.style, options.currency, min, max, options.minimumIntegerDigits, options.useGrouping)
    }
    if (!plus) return fmt(magnitude)
    // The plus goes where the locale puts its minus.
    val negative = fmt(-magnitude.coerceAtLeast(Double.MIN_VALUE))
    val at = negative.indexOfFirst { it == '-' || it == '−' }
    return if (at < 0) "+" + fmt(magnitude) else negative.substring(0, at) + "+" + negative.substring(at + 1)
}

/** Decimal places a currency uses: 2 for USD and INR, 0 for JPY. */
expect fun currencyDigits(currency: String): Int

/** A currency's symbol in a locale: "₹", "$", "US$", "€". */
expect fun currencySymbol(currency: String, locale: String): String

internal expect fun platformFormatNumber(
    value: Double,
    locale: String,
    style: NumberStyle,
    currency: String?,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String

/** A number with its unit, as Intl.NumberFormat's unit style writes it. */
internal expect fun platformFormatUnit(
    value: Double,
    locale: String,
    unit: String,
    display: UnitDisplay,
    minFraction: Int,
    maxFraction: Int,
    minInteger: Int,
    grouping: Boolean,
): String

/** Thin and narrow no-break spaces as plain ones, as the web library shows formatted text in fields. */
internal fun plainSpaces(text: String) = text.replace('\u2009', ' ').replace('\u202F', ' ')
