import { cx } from './cx';

/**
 * cx builds its output by prepending a space before each emitted token, and the
 * object-entry sub-reducer does the same.  A call like cx({ foo: true }) therefore
 * returns '  foo' (two leading spaces) and mixing string args with object args
 * produces double spaces between tokens.  All assertions below normalise the
 * result with `n()` so they read as plain class-name strings.
 */
const n = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('cx', () => {
    // ─── string args ────────────────────────────────────────────────────────────

    describe('string args', () => {
        it('returns a single string arg unchanged', () => {
            expect(cx('foo').trim()).toBe('foo');
        });

        it('joins two string args with a single space', () => {
            expect(n(cx('foo', 'bar'))).toBe('foo bar');
        });

        it('joins multiple string args preserving order', () => {
            expect(n(cx('a', 'b', 'c', 'd'))).toBe('a b c d');
        });

        it('returns empty string when called with no arguments', () => {
            expect(cx()).toBe('');
        });
    });

    // ─── falsy values ────────────────────────────────────────────────────────────

    describe('falsy values', () => {
        it('skips null', () => {
            expect(n(cx('foo', null, 'bar'))).toBe('foo bar');
        });

        it('skips undefined', () => {
            expect(n(cx('foo', undefined, 'bar'))).toBe('foo bar');
        });

        it('skips false', () => {
            expect(n(cx('foo', false, 'bar'))).toBe('foo bar');
        });

        it('skips a leading falsy arg', () => {
            expect(n(cx(null, 'foo'))).toBe('foo');
        });

        it('skips a trailing falsy arg', () => {
            expect(n(cx('foo', undefined))).toBe('foo');
        });

        it('returns empty string when every arg is falsy', () => {
            expect(n(cx(null, undefined, false))).toBe('');
        });
    });

    // ─── number args ─────────────────────────────────────────────────────────────

    describe('number args', () => {
        it('includes a positive integer', () => {
            expect(n(cx(42))).toBe('42');
        });

        it('includes zero (0 is not falsy for cx)', () => {
            expect(n(cx(0))).toBe('0');
        });

        it('mixes a number with a string arg', () => {
            expect(n(cx('col', 4))).toBe('col 4');
        });
    });

    // ─── array args ──────────────────────────────────────────────────────────────

    describe('array args', () => {
        it('flattens a flat array of strings', () => {
            expect(n(cx(['foo', 'bar']))).toBe('foo bar');
        });

        it('flattens a singly-nested array', () => {
            expect(n(cx(['foo', ['bar', 'baz']]))).toBe('foo bar baz');
        });

        it('flattens a deeply-nested array', () => {
            expect(n(cx(['a', ['b', ['c', 'd']]]))).toBe('a b c d');
        });

        it('skips falsy values inside arrays', () => {
            expect(n(cx(['foo', null, undefined, false, 'bar']))).toBe('foo bar');
        });

        it('treats an empty array as contributing nothing', () => {
            expect(n(cx([]))).toBe('');
        });

        it('flattens multiple top-level array args', () => {
            expect(n(cx(['foo', 'bar'], ['baz']))).toBe('foo bar baz');
        });
    });

    // ─── object args ─────────────────────────────────────────────────────────────

    describe('object args', () => {
        it('emits the key when its value is true', () => {
            expect(n(cx({ foo: true }))).toBe('foo');
        });

        it('suppresses the key when its value is false', () => {
            expect(n(cx({ foo: false }))).toBe('');
        });

        it('suppresses the key when its value is null', () => {
            expect(n(cx({ foo: null }))).toBe('');
        });

        it('suppresses the key when its value is undefined', () => {
            expect(n(cx({ foo: undefined }))).toBe('');
        });

        it('emits "key-value" when the value is a string', () => {
            expect(n(cx({ foo: 'bar' }))).toBe('foo-bar');
        });

        it('emits "key-value" when the value is a number', () => {
            expect(n(cx({ col: 4 }))).toBe('col-4');
        });

        it('handles multiple keys: truthy, falsy, and string-valued', () => {
            expect(n(cx({ active: true, disabled: false, size: 'sm' }))).toBe('active size-sm');
        });

        it('handles an object with all falsy values', () => {
            expect(n(cx({ a: false, b: null, c: undefined }))).toBe('');
        });
    });

    // ─── mixed args ──────────────────────────────────────────────────────────────

    describe('mixed args', () => {
        it('combines strings, arrays, and objects in order', () => {
            expect(n(cx('btn', ['text-sm', 'font-bold'], { active: true, disabled: false }))).toBe(
                'btn text-sm font-bold active',
            );
        });

        it('ignores falsy entries among otherwise valid args', () => {
            expect(n(cx('a', false, null, undefined, 'b'))).toBe('a b');
        });

        it('combines a number with an object', () => {
            expect(n(cx(1, { active: true }))).toBe('1 active');
        });
    });
});
