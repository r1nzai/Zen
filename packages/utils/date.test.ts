import {
    addDays,
    addMonthsToDate,
    dayOfWeek,
    daysBetween,
    daysInMonth,
    formatDate,
    formatDateRange,
    isDate,
    today,
    weekdayNames,
    weekStart,
} from './date';

describe('date helpers', () => {
    it('validates real dates only', () => {
        expect(isDate('2026-09-30')).toBe(true);
        expect(isDate('2028-02-29')).toBe(true);
        expect(isDate('2026-02-29')).toBe(false);
        expect(isDate('2026-13-01')).toBe(false);
        expect(isDate('30/09/2026')).toBe(false);
    });

    it('adds days across months, years and leap days', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
        expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
    });

    it('adds months, keeping the day within the month', () => {
        expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
        expect(addMonthsToDate('2028-01-31', 1)).toBe('2028-02-29');
        expect(addMonthsToDate('2026-03-15', -12)).toBe('2025-03-15');
        expect(addMonthsToDate('2026-11-30', 2)).toBe('2027-01-30');
        expect(daysInMonth('2026-02')).toBe(28);
    });

    it('knows the weekday', () => {
        expect(dayOfWeek('2026-09-30')).toBe(3); // Wednesday
        expect(dayOfWeek('1970-01-01')).toBe(4);
        expect(dayOfWeek('1969-12-28')).toBe(0);
    });

    it('today is the local date', () => {
        expect(today(new Date(2026, 8, 30, 23, 59))).toBe('2026-09-30');
    });

    it('formats for the locale, never shifting the day', () => {
        expect(formatDate('2026-09-30', 'en-US')).toBe('Sep 30, 2026');
        expect(formatDate('2026-09-30', 'en-GB', 'long')).toBe('30 September 2026');
        expect(formatDate('2026-09-03', 'en-US', 'day')).toBe('Sep 3');
        expect(formatDateRange('2026-09-03', '2026-10-10', 'en-US', 'day')).toBe('Sep 3 – Oct 10');
        // Plain spaces whatever the engine's ICU, so server and browser render the same text.
        expect(formatDateRange('2026-09-03', '2026-09-10', 'en-US')).toBe('Sep 3 – 10, 2026');
        expect(formatDateRange('2026-10-05', '2026-10-12', 'en-GB')).toBe('5 – 12 Oct 2026');
        expect(weekdayNames('en-US')[0]).toBe('Sun');
    });

    it('knows where weeks start', () => {
        expect(weekStart('en-US')).toBe(0);
        expect(weekStart('en-GB')).toBe(1);
        expect(weekStart('de-DE')).toBe(1);
        expect(weekStart('not a locale!')).toBe(1);
    });
});
