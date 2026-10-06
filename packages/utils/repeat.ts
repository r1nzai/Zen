import {
    addDays,
    addMonthsToDate,
    type DateString,
    dayOfWeek,
    daysBetween,
    daysInMonth,
    formatDate,
    weekdayNames,
} from './date';

/**
 * How often something comes round: every `every` days, weeks, months or
 * years. Weekly can name `weekdays` (0 for Sunday … 6); monthly a `day` of the
 * month (-1 for the last). Otherwise it falls on the start date's.
 */
export interface Repeat {
    every: number;
    unit: 'day' | 'week' | 'month' | 'year';
    weekdays?: number[];
    day?: number;
}

/** "Every 2 weeks on Mon, Thu", "Every month on day 5", "Every year on Sep 3" (from `start`). */
export function describeRepeat(repeat: Repeat, locale: string, start?: DateString): string {
    const { every, unit } = repeat;
    const what = every === 1 ? `Every ${unit}` : `Every ${every} ${unit}s`;
    if (unit === 'week' && repeat.weekdays?.length) {
        const names = weekdayNames(locale);
        return `${what} on ${[...repeat.weekdays]
            .sort((a, b) => a - b)
            .map((d) => names[d])
            .join(', ')}`;
    }
    if (unit === 'month' && repeat.day !== undefined) {
        return `${what} on ${repeat.day === -1 ? 'the last day' : `day ${repeat.day}`}`;
    }
    if (unit === 'year' && start) return `${what} on ${formatDate(start, locale, 'day')}`;
    return what;
}

/** The next `count` dates it falls on, from `start` (which sets the cycle) onwards, not before `from`. */
export function nextOccurrences(repeat: Repeat, start: DateString, count: number, from = start): DateString[] {
    const out: DateString[] = [];
    const every = Math.max(1, Math.floor(repeat.every));
    // From the cycle just before `from`, and bounded, so a far `from` is quick and nothing loops forever.
    const first = Math.max(0, Math.floor(unitsBetween(repeat.unit, start, from) / every) - 1);
    for (let cycle = first; out.length < count && cycle < first + count + 2; cycle++) {
        for (const date of inCycle(repeat, start, cycle * every)) {
            if (date >= start && date >= from && out.length < count) out.push(date);
        }
    }
    return out;
}

function unitsBetween(unit: Repeat['unit'], from: DateString, to: DateString): number {
    if (unit === 'day') return daysBetween(from, to);
    if (unit === 'week') return Math.floor(daysBetween(from, to) / 7);
    const months =
        (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7));
    return unit === 'month' ? months : Math.floor(months / 12);
}

/** The dates in the cycle `n` units after the start's, in order. */
function inCycle(repeat: Repeat, start: DateString, n: number): DateString[] {
    switch (repeat.unit) {
        case 'day':
            return [addDays(start, n)];
        case 'week': {
            const days = repeat.weekdays?.length
                ? [...new Set(repeat.weekdays)].sort((a, b) => a - b)
                : [dayOfWeek(start)];
            // From the Sunday of the start's week.
            const sunday = addDays(start, -dayOfWeek(start) + n * 7);
            return days.map((d) => addDays(sunday, d));
        }
        case 'month': {
            const month = addMonthsToDate(`${start.slice(0, 7)}-01`, n).slice(0, 7);
            const last = daysInMonth(month);
            const want = repeat.day ?? Number(start.slice(8));
            const day = want === -1 ? last : Math.min(want, last);
            return [`${month}-${String(day).padStart(2, '0')}`];
        }
        case 'year':
            return [addMonthsToDate(start, n * 12)];
    }
}
