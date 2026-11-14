package dev.rinzai.zen

import kotlin.math.floor

/** Exchange rates: units of each currency per 1 unit of `base` (e.g. as the ECB publishes them). */
data class RateTable(
    val base: String,
    /** Day the rates are for. */
    val date: DateString,
    val rates: Map<String, Double>,
)

/** A converted amount's original, kept so it's never lost. */
data class ForeignAmount(
    val currency: String,
    /** Minor units of `currency`. */
    val amount: Money,
    /** Units of the home currency per 1 unit of `currency`. */
    val rate: Double,
    /** Day of the rate used. */
    val date: DateString,
)

class RateUnavailableError(message: String) : IllegalArgumentException(message)

/** How many `to` per 1 `from`, via the table's base. Throws RateUnavailableError for a currency it lacks. */
fun rateBetween(table: RateTable, from: String, to: String): Double {
    if (from == to) return 1.0
    val per = { c: String -> if (c == table.base) 1.0 else table.rates[c] }
    val f = per(from)?.takeIf { it != 0.0 }
    val t = per(to)?.takeIf { it != 0.0 }
    if (f == null || t == null) throw RateUnavailableError("No rate for ${if (f == null) from else to}")
    return t / f
}

/**
 * Converts minor units between currencies (with different decimal places,
 * e.g. JPY has none). Rounded once, to the nearest minor unit of `to`.
 */
fun convertMinor(amount: Money, rate: Double, from: String, to: String): Money {
    val shift = currencyDigits(to) - currencyDigits(from)
    var scale = 1.0
    repeat(kotlin.math.abs(shift)) { scale *= 10 }
    // Math.round: halves toward +∞.
    return floor(amount * rate * (if (shift >= 0) scale else 1 / scale) + 0.5).toLong()
}
