/**
 * Money as an integer number of minor units (paise, cents). Never do arithmetic
 * on floats; only formatting converts to a decimal for display.
 */
export type Money = number;

/** Decimal places the currency uses: 2 for USD and INR, 0 for JPY. */
export function minorDigits(currency: string): number {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** With symbol: en-IN gives lakh/crore grouping (₹1,52,000.00); en-US gives $152,000.00. */
export function formatMoney(
    amount: Money,
    currency: string,
    locale: string,
    { showDecimals = true }: { showDecimals?: boolean } = {},
): string {
    const digits = minorDigits(currency);
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: showDecimals ? digits : 0,
        maximumFractionDigits: showDecimals ? digits : 0,
    }).format(amount / 10 ** digits);
}

/** Number without symbol, e.g. "1,52,000" or "32,740.50". Decimals only when non-zero. */
export function formatAmount(amount: Money, currency: string, locale: string): string {
    const digits = minorDigits(currency);
    const hasFraction = amount % 10 ** digits !== 0;
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: hasFraction ? digits : 0,
        maximumFractionDigits: digits,
    }).format(amount / 10 ** digits);
}

/** The currency's symbol in a locale: "₹", "$", "US$", "€". */
export function currencySymbol(currency: string, locale: string): string {
    return (
        new Intl.NumberFormat(locale, { style: 'currency', currency })
            .formatToParts(0)
            .find((p) => p.type === 'currency')?.value ?? currency
    );
}

export class MoneyParseError extends Error {
    constructor(input: string) {
        super(`Not an amount: ${input}`);
        this.name = 'MoneyParseError';
    }
}

/**
 * Parses user input to minor units using string arithmetic (no float rounding).
 * Accepts grouping separators (commas, spaces, underscores), a leading sign or
 * currency symbol, and at most the currency's number of decimals.
 */
export function parseMoney(input: string, currency: string): Money {
    const digits = minorDigits(currency);
    const cleaned = input
        .trim()
        .replace(/[\s,_]/g, '')
        .replace(/^([+-]?)[^\d.+-]+/, '$1');
    const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(cleaned);
    if (!m || (m[2] === '' && (m[3] ?? '') === '')) throw new MoneyParseError(input);
    const [, sign, whole, frac = ''] = m;
    if (frac.length > digits) throw new MoneyParseError(input);
    const minor = Number((whole || '0') + frac.padEnd(digits, '0'));
    if (!Number.isSafeInteger(minor)) throw new MoneyParseError(input);
    return sign === '-' ? -minor : minor;
}

const SUFFIXES: Record<string, number> = {
    k: 3,
    thousand: 3,
    l: 5,
    lac: 5,
    lakh: 5,
    lakhs: 5,
    cr: 7,
    crore: 7,
    crores: 7,
    m: 6,
    mn: 6,
    million: 6,
};

/**
 * Like parseMoney, plus shorthand: "1.5L" (lakh), "2cr" (crore), "10k",
 * "1.2m". Scaling is done by shifting the decimal string, so it stays exact.
 */
export function parseMoneyInput(input: string, currency: string): Money {
    const m = /^\s*(.*?)\s*([a-z]+)\s*$/i.exec(input);
    const suffix = m ? m[2].toLowerCase() : '';
    const power = SUFFIXES[suffix];
    if (!m || power === undefined) return parseMoney(input, currency);

    const digits = minorDigits(currency);
    const n = /^([+-]?)[^\d.+-]*([\d,\s_]*)(?:\.(\d*))?$/.exec(m[1]);
    if (!n) throw new MoneyParseError(input);
    const whole = n[2].replace(/[,\s_]/g, '');
    const frac = n[3] ?? '';
    if (whole === '' && frac === '') throw new MoneyParseError(input);
    const shift = power + digits;
    if (frac.length > shift) throw new MoneyParseError(input);
    const minor = Number((whole || '0') + frac.padEnd(shift, '0'));
    if (!Number.isSafeInteger(minor)) throw new MoneyParseError(input);
    return n[1] === '-' ? -minor : minor;
}
