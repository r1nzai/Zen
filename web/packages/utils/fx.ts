import { minorDigits, type Money } from './money';

/** Exchange rates: units of each currency per 1 unit of `base` (e.g. as the ECB publishes them). */
export interface RateTable {
    base: string;
    /** Day the rates are for, "YYYY-MM-DD". */
    date: string;
    rates: Record<string, number>;
}

/** A converted amount's original, kept so it's never lost. */
export interface ForeignAmount {
    currency: string;
    /** Minor units of `currency`. */
    amount: Money;
    /** Units of the home currency per 1 unit of `currency`. */
    rate: number;
    /** Day of the rate used, "YYYY-MM-DD". */
    date: string;
}

export class RateUnavailableError extends Error {}

/** How many `to` per 1 `from`, via the table's base. Throws RateUnavailableError for a currency it lacks. */
export function rateBetween(table: RateTable, from: string, to: string): number {
    if (from === to) return 1;
    const per = (c: string) => (c === table.base ? 1 : table.rates[c]);
    const f = per(from);
    const t = per(to);
    if (!f || !t) throw new RateUnavailableError(`No rate for ${!f ? from : to}`);
    return t / f;
}

/**
 * Converts minor units between currencies (with different decimal places,
 * e.g. JPY has none). Rounded once, to the nearest minor unit of `to`.
 */
export function convertMinor(amount: Money, rate: number, from: string, to: string): Money {
    const shift = minorDigits(to) - minorDigits(from);
    return Math.round(amount * rate * 10 ** shift);
}

/** Whether a value (e.g. a fetched response) is a well-formed RateTable. */
export function isRateTable(value: unknown): value is RateTable {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Partial<RateTable>;
    return (
        typeof v.base === 'string' &&
        /^[A-Z]{3}$/.test(v.base) &&
        typeof v.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
        typeof v.rates === 'object' &&
        v.rates !== null &&
        Object.entries(v.rates).every(
            ([k, r]) => /^[A-Z]{3}$/.test(k) && typeof r === 'number' && Number.isFinite(r) && r > 0,
        )
    );
}
