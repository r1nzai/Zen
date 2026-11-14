/** Calendar month as "YYYY-MM". Compares correctly as a string. */
export type Month = string;

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonth(value: unknown): value is Month {
    return typeof value === 'string' && MONTH.test(value);
}

/** Months since year 0; lets month arithmetic be plain integer maths. */
export function monthIndex(month: Month): number {
    const m = MONTH.exec(month);
    if (!m) throw new Error(`Invalid month: ${month}`);
    return Number(m[1]) * 12 + Number(m[2]) - 1;
}

export function fromMonthIndex(index: number): Month {
    const year = Math.floor(index / 12);
    return `${String(year).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

export function addMonths(month: Month, n: number): Month {
    return fromMonthIndex(monthIndex(month) + n);
}

/** Every month from `from` to `to`, inclusive. Empty if `to` is before `from`. */
export function monthRange(from: Month, to: Month): Month[] {
    const out: Month[] = [];
    for (let i = monthIndex(from); i <= monthIndex(to); i++) out.push(fromMonthIndex(i));
    return out;
}

export function monthsBetween(from: Month, to: Month): number {
    return monthIndex(to) - monthIndex(from);
}

export function currentMonth(now: Date = new Date()): Month {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** "Sep 2026" (or the locale's equivalent); "September 2026" with style "long". */
export function formatMonth(month: Month, locale: string, style: 'short' | 'long' = 'short'): string {
    const [y, m] = month.split('-').map(Number);
    return new Intl.DateTimeFormat(locale, { month: style, year: 'numeric', timeZone: 'UTC' }).format(
        Date.UTC(y, m - 1, 1),
    );
}

/** Short month names for a locale, January first. */
export function monthNames(locale: string): string[] {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(Date.UTC(2000, i, 1)));
}
