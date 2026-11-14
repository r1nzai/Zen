import { describeRepeat, nextOccurrences } from './repeat';

describe('describeRepeat', () => {
    it('says it plainly', () => {
        expect(describeRepeat({ every: 1, unit: 'day' }, 'en-US')).toBe('Every day');
        expect(describeRepeat({ every: 2, unit: 'week', weekdays: [4, 1] }, 'en-US')).toBe('Every 2 weeks on Mon, Thu');
        expect(describeRepeat({ every: 1, unit: 'month', day: 5 }, 'en-US')).toBe('Every month on day 5');
        expect(describeRepeat({ every: 3, unit: 'month', day: -1 }, 'en-US')).toBe('Every 3 months on the last day');
        expect(describeRepeat({ every: 1, unit: 'year' }, 'en-US', '2026-09-03')).toBe('Every year on Sep 3');
    });
});

describe('nextOccurrences', () => {
    it('steps days and weeks from the start', () => {
        expect(nextOccurrences({ every: 3, unit: 'day' }, '2026-03-30', 3)).toEqual([
            '2026-03-30',
            '2026-04-02',
            '2026-04-05',
        ]);
        // 2026-03-04 is a Wednesday: every 2 weeks on Mon and Thu.
        expect(nextOccurrences({ every: 2, unit: 'week', weekdays: [1, 4] }, '2026-03-04', 4)).toEqual([
            '2026-03-05',
            '2026-03-16',
            '2026-03-19',
            '2026-03-30',
        ]);
    });

    it('keeps a monthly day inside short months, and can mean the last day', () => {
        expect(nextOccurrences({ every: 1, unit: 'month' }, '2026-01-31', 3)).toEqual([
            '2026-01-31',
            '2026-02-28',
            '2026-03-31',
        ]);
        expect(nextOccurrences({ every: 1, unit: 'month', day: -1 }, '2026-01-10', 2)).toEqual([
            '2026-01-31',
            '2026-02-28',
        ]);
        expect(nextOccurrences({ every: 1, unit: 'month', day: 5 }, '2026-01-10', 2)).toEqual([
            '2026-02-05',
            '2026-03-05',
        ]);
    });

    it('lands a leap day on Feb 28 in other years, and starts from `from`', () => {
        expect(nextOccurrences({ every: 1, unit: 'year' }, '2028-02-29', 2)).toEqual(['2028-02-29', '2029-02-28']);
        expect(nextOccurrences({ every: 1, unit: 'month', day: 5 }, '2026-01-05', 2, '2026-06-01')).toEqual([
            '2026-06-05',
            '2026-07-05',
        ]);
    });

    it('finds dates far past the start quickly', () => {
        expect(nextOccurrences({ every: 1, unit: 'day' }, '2020-01-01', 2, '2026-10-06')).toEqual([
            '2026-10-06',
            '2026-10-07',
        ]);
        expect(nextOccurrences({ every: 2, unit: 'week' }, '2020-01-01', 1, '2026-10-06')).toEqual(['2026-10-14']);
    });
});
