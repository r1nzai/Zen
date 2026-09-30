import { type Month } from './month';

/**
 * Calendar date as "YYYY-MM-DD": no time and no time zone, so it never shifts
 * a day. Compares correctly as a string.
 */
export type DateString = string;

/** A start and an end date; `end` is null while only the start is picked. */
export interface DateRange {
    start: DateString;
    end: DateString | null;
}

const DATE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isDate(value: unknown): value is DateString {
    if (typeof value !== 'string') return false;
    const m = DATE.exec(value);
    return !!m && Number(m[3]) <= daysInMonth(`${m[1]}-${m[2]}`);
}

/** Days since 1970-01-01; lets date arithmetic be plain integer maths. */
export function dayIndex(date: DateString): number {
    const [y, m, d] = date.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
}

export function fromDayIndex(index: number): DateString {
    return new Date(index * 86400000).toISOString().slice(0, 10);
}

export function addDays(date: DateString, n: number): DateString {
    return fromDayIndex(dayIndex(date) + n);
}

/** The same day n months later, kept within the month (Jan 31 + 1 month is Feb 28 or 29). */
export function addMonthsToDate(date: DateString, n: number): DateString {
    const [y, m, d] = date.split('-').map(Number);
    const index = y * 12 + m - 1 + n;
    const month = `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
    return `${month}-${String(Math.min(d, daysInMonth(month))).padStart(2, '0')}`;
}

export function daysInMonth(month: Month): number {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 for Sunday … 6 for Saturday. */
export function dayOfWeek(date: DateString): number {
    return (dayIndex(date) + 4) % 7; // 1970-01-01 was a Thursday
}

/** Today in the user's time zone. */
export function today(now: Date = new Date()): DateString {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DateString, to: DateString): number {
    return dayIndex(to) - dayIndex(from);
}

/** How much of a date to show; `day` is the day and month without the year ("Sep 3"), for dates within the year. */
export type DateStyle = 'day' | 'short' | 'medium' | 'long' | 'full';

const dateFormat = (locale: string, style: DateStyle) =>
    new Intl.DateTimeFormat(
        locale,
        style === 'day' ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { dateStyle: style, timeZone: 'UTC' },
    );

/**
 * "Sep 30, 2026" (or the locale's equivalent) by default; `day` is "Sep 30",
 * `short` "9/30/26", `long` "September 30, 2026", `full` adds the weekday.
 */
export function formatDate(date: DateString, locale: string, style: DateStyle = 'medium'): string {
    return plainSpaces(dateFormat(locale, style).format(dayIndex(date) * 86400000));
}

/** Short weekday names for a locale, Sunday first. */
export function weekdayNames(locale: string, style: 'narrow' | 'short' | 'long' = 'short'): string[] {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(Date.UTC(2023, 0, 1 + i))); // 2023-01-01 was a Sunday
}

// Regions whose weeks start on Sunday (or Saturday), for browsers without Intl week info.
const SUNDAY = new Set(
    'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
        ' ',
    ),
);
const SATURDAY = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

/** The first day of the week for a locale: 0 for Sunday, 1 for Monday, 6 for Saturday. */
export function weekStart(locale: string): number {
    try {
        const loc = new Intl.Locale(locale) as Intl.Locale & {
            getWeekInfo?: () => { firstDay: number };
            weekInfo?: { firstDay: number };
        };
        const info = loc.getWeekInfo?.() ?? loc.weekInfo;
        if (info) return info.firstDay % 7; // Intl counts Monday 1 … Sunday 7
        const region = loc.maximize().region ?? '';
        return SUNDAY.has(region) ? 0 : SATURDAY.has(region) ? 6 : 1;
    } catch {
        return 1;
    }
}

/** "Sep 3 – 10, 2026" (or the locale's equivalent), sharing what the two dates have in common. */
export function formatDateRange(
    start: DateString,
    end: DateString,
    locale: string,
    style: Exclude<DateStyle, 'full'> = 'medium',
): string {
    return plainSpaces(dateFormat(locale, style).formatRange(dayIndex(start) * 86400000, dayIndex(end) * 86400000));
}

/**
 * Engines' ICU versions differ in thin and narrow no-break spaces (Node 24
 * writes "5\u2009–\u200912 Oct", Chrome "5 – 12 Oct"). Plain spaces make text
 * rendered on the server match the browser's, so hydration doesn't fail.
 */
const plainSpaces = (text: string) => text.replace(/[\u2009\u202f]/g, ' ');
