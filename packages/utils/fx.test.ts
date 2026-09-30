import { convertMinor, isRateTable, rateBetween, type RateTable, RateUnavailableError } from './fx';

const table: RateTable = { base: 'EUR', date: '2026-09-25', rates: { USD: 1.14, INR: 109.26, JPY: 179.7, GBP: 0.86 } };

describe('rateBetween', () => {
    it('handles base, cross and identity rates', () => {
        expect(rateBetween(table, 'EUR', 'INR')).toBe(109.26);
        expect(rateBetween(table, 'INR', 'EUR')).toBeCloseTo(1 / 109.26, 12);
        expect(rateBetween(table, 'USD', 'INR')).toBeCloseTo(109.26 / 1.14, 10); // ≈ 95.84
        expect(rateBetween(table, 'INR', 'INR')).toBe(1);
    });

    it('refuses unknown currencies', () => {
        expect(() => rateBetween(table, 'XYZ', 'INR')).toThrow(RateUnavailableError);
    });
});

describe('convertMinor', () => {
    it('converts minor units with one rounding', () => {
        const usdToInr = rateBetween(table, 'USD', 'INR');
        expect(convertMinor(12000, usdToInr, 'USD', 'INR')).toBe(Math.round(12000 * usdToInr));
        expect(convertMinor(10000, 95.82, 'USD', 'INR')).toBe(958200);
    });

    it('handles currencies with different decimal places', () => {
        // ¥1,000 (no minor unit) → euro cents.
        expect(convertMinor(1000, rateBetween(table, 'JPY', 'EUR'), 'JPY', 'EUR')).toBe(556); // €5.56
        // €10.00 → whole yen.
        expect(convertMinor(1000, 179.7, 'EUR', 'JPY')).toBe(1797);
    });
});

describe('isRateTable', () => {
    it('accepts well-formed tables and rejects junk', () => {
        expect(isRateTable(table)).toBe(true);
        expect(isRateTable({ ...table, rates: { USD: -1 } })).toBe(false);
        expect(isRateTable({ ...table, rates: { usd: 1 } })).toBe(false);
        expect(isRateTable({ ...table, date: 'yesterday' })).toBe(false);
        expect(isRateTable(null)).toBe(false);
    });
});
