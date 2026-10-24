import { formatDuration } from './duration';

describe('formatDuration', () => {
    it('reads like a clock, with hours only when there are some', () => {
        expect(formatDuration(0)).toBe('0:00');
        expect(formatDuration(187.9)).toBe('3:07');
        expect(formatDuration(3727)).toBe('1:02:07');
        expect(formatDuration(-4)).toBe('0:00');
    });
});
