// Ported from Sora's month model tests.
import {
    addMonths,
    currentMonth,
    formatMonth,
    fromMonthIndex,
    isMonth,
    monthIndex,
    monthNames,
    monthRange,
    monthsBetween,
} from './month';

describe('month', () => {
    it('recognises YYYY-MM', () => {
        expect(isMonth('2026-09')).toBe(true);
        expect(isMonth('2026-13')).toBe(false);
        expect(isMonth('2026-9')).toBe(false);
        expect(isMonth(202609)).toBe(false);
    });

    it('does month arithmetic across years', () => {
        expect(addMonths('2026-11', 3)).toBe('2027-02');
        expect(addMonths('2026-01', -1)).toBe('2025-12');
        expect(fromMonthIndex(monthIndex('2026-09'))).toBe('2026-09');
        expect(monthsBetween('2026-09', '2027-03')).toBe(6);
        expect(monthRange('2026-11', '2027-01')).toEqual(['2026-11', '2026-12', '2027-01']);
        expect(monthRange('2027-01', '2026-11')).toEqual([]);
        expect(() => monthIndex('nope')).toThrow();
    });

    it('formats for a locale', () => {
        expect(formatMonth('2026-09', 'en-US')).toBe('Sep 2026');
        expect(formatMonth('2026-09', 'en-US', 'long')).toBe('September 2026');
        expect(monthNames('en-US')[0]).toBe('Jan');
        expect(monthNames('de-DE')[2]).toBe('Mär');
        expect(currentMonth(new Date(2026, 8, 29))).toBe('2026-09');
    });
});
