// Ported from Sora's money model tests.
import {
    currencySymbol,
    formatAmount,
    formatMoney,
    minorDigits,
    MoneyParseError,
    parseMoney,
    parseMoneyInput,
} from './money';

/** Whole units to minor units (2 decimals). */
const major = (n: number) => n * 100;

describe('money', () => {
    it('knows each currency’s decimals', () => {
        expect(minorDigits('INR')).toBe(2);
        expect(minorDigits('JPY')).toBe(0);
    });

    it('formats with Indian and Western grouping', () => {
        expect(formatMoney(15200000, 'INR', 'en-IN')).toBe('₹1,52,000.00');
        expect(formatMoney(-3274000, 'INR', 'en-IN', { showDecimals: false })).toBe('-₹32,740');
        expect(formatMoney(15200000, 'USD', 'en-US')).toBe('$152,000.00');
        expect(formatMoney(1234567890, 'INR', 'en-IN', { showDecimals: false })).toBe('₹1,23,45,679');
    });

    it('parses input exactly, without float error', () => {
        expect(parseMoney('1,52,000', 'INR')).toBe(15200000);
        expect(parseMoney('₹ 32,740.50', 'INR')).toBe(3274050);
        expect(parseMoney('-7000', 'INR')).toBe(-700000);
        expect(parseMoney('0.1', 'INR')).toBe(10);
        expect(parseMoney('0.29', 'USD')).toBe(29); // 0.29 * 100 in floats is 28.999…
        expect(parseMoney('.5', 'INR')).toBe(50);
        expect(parseMoney('1 000 000', 'EUR')).toBe(100000000);
        expect(parseMoney('500', 'JPY')).toBe(500);
    });

    it('rejects malformed input', () => {
        for (const bad of ['', 'abc', '1.234', '1.2.3', '--5', '.', '1e5', '500.5']) {
            const currency = bad === '500.5' ? 'JPY' : 'INR';
            expect(() => parseMoney(bad, currency)).toThrow(MoneyParseError);
        }
    });
});

describe('parseMoneyInput shorthand', () => {
    it('scales lakh, crore, thousand and million exactly', () => {
        expect(parseMoneyInput('1.5L', 'INR')).toBe(major(150_000));
        expect(parseMoneyInput('1.52 lakh', 'INR')).toBe(major(152_000));
        expect(parseMoneyInput('2cr', 'INR')).toBe(major(20_000_000));
        expect(parseMoneyInput('10k', 'INR')).toBe(major(10_000));
        expect(parseMoneyInput('1.2m', 'USD')).toBe(major(1_200_000));
        expect(parseMoneyInput('-32.74k', 'INR')).toBe(-major(32_740));
        expect(parseMoneyInput('0.123456L', 'INR')).toBe(1234560); // ₹12,345.60
    });

    it('falls back to plain parsing and rejects junk', () => {
        expect(parseMoneyInput('1,52,000', 'INR')).toBe(major(152_000));
        expect(() => parseMoneyInput('5 bananas', 'INR')).toThrow(MoneyParseError);
        expect(() => parseMoneyInput('L', 'INR')).toThrow(MoneyParseError);
        expect(parseMoneyInput('1.2345678L', 'INR')).toBe(12345678); // ₹1,23,456.78, exact
        expect(() => parseMoneyInput('1.23456789L', 'INR')).toThrow(MoneyParseError); // finer than a paisa
    });
});

describe('parseMoneyInput sums', () => {
    it('adds and takes away exactly, shorthand and symbols too', () => {
        expect(parseMoneyInput('120 + 45.50', 'USD')).toBe(16550);
        expect(parseMoneyInput('0.10+0.20', 'USD')).toBe(30);
        expect(parseMoneyInput('1,200 - 300 + 12.25', 'USD')).toBe(91225);
        expect(parseMoneyInput('10k+1.5k', 'INR')).toBe(major(11_500));
        expect(parseMoneyInput('$100 − $25', 'USD')).toBe(7500);
        expect(parseMoneyInput('-20 + 5', 'USD')).toBe(-1500);
    });

    it('multiplies and divides by plain numbers before adding, rounding to the cent', () => {
        expect(parseMoneyInput('3 * 12.99', 'USD')).toBe(3897);
        expect(parseMoneyInput('12.99 × 3 + 5', 'USD')).toBe(4397);
        expect(parseMoneyInput('100 / 3', 'USD')).toBe(3333);
        expect(parseMoneyInput('200 ÷ 3', 'USD')).toBe(6667);
        expect(parseMoneyInput('10.01 * 0.5', 'USD')).toBe(501); // 5.005 rounds half away from zero
        expect(parseMoneyInput('1500 / 4', 'JPY')).toBe(375);
    });

    it('rejects a sum that is not one', () => {
        expect(() => parseMoneyInput('100 +', 'USD')).toThrow(MoneyParseError);
        expect(() => parseMoneyInput('100 / 0', 'USD')).toThrow(MoneyParseError);
        expect(() => parseMoneyInput('100 * $2', 'USD')).toThrow(MoneyParseError);
        expect(() => parseMoneyInput('5 bananas + 2', 'USD')).toThrow(MoneyParseError);
    });
});

describe('formatAmount', () => {
    it('omits the symbol and shows decimals only when needed', () => {
        expect(formatAmount(major(152_000), 'INR', 'en-IN')).toBe('1,52,000');
        expect(formatAmount(3274050, 'INR', 'en-IN')).toBe('32,740.50');
        expect(formatAmount(-major(1_000_000), 'USD', 'en-US')).toBe('-1,000,000');
        expect(currencySymbol('INR', 'en-IN')).toBe('₹');
        expect(currencySymbol('EUR', 'de-DE')).toBe('€');
    });
});
