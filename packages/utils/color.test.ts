import { describe, expect, it } from 'vite-plus/test';

import { formatHex, hexToHsv, hexToOklch, hsvToHex, oklchToHex, parseHex } from './color';

describe('hex', () => {
    it('reads every hex form, and nothing else', () => {
        expect(parseHex('#ff8000')).toEqual([1, 128 / 255, 0, 1]);
        expect(parseHex('F80')).toEqual([1, 136 / 255, 0, 1]);
        expect(parseHex('#ff800080')?.[3]).toBeCloseTo(128 / 255);
        expect(parseHex('#f808')?.[3]).toBeCloseTo(136 / 255);
        for (const bad of ['', '#12', '#12345', 'red', '#gggggg']) expect(parseHex(bad)).toBeNull();
    });

    it('writes #rrggbb, adding alpha only when not opaque', () => {
        expect(formatHex([1, 0.5, 0, 1])).toBe('#ff8000');
        expect(formatHex([1, 0.5, 0, 0.5])).toBe('#ff800080');
        expect(formatHex([2, -1, 0])).toBe('#ff0000');
    });
});

describe('hsv', () => {
    it('goes there and back', () => {
        for (const hex of ['#7c5cff', '#000000', '#ffffff', '#12ab34', '#ff800080']) {
            expect(hsvToHex(hexToHsv(hex)!)).toBe(hex);
        }
    });

    it('reads hue, saturation and value', () => {
        expect(hexToHsv('#ff0000')).toEqual({ h: 0, s: 1, v: 1, a: 1 });
        expect(hexToHsv('#0000ff')).toMatchObject({ h: 240, s: 1, v: 1 });
        expect(hexToHsv('#808080')).toMatchObject({ h: 0, s: 0 });
    });
});

describe('oklch', () => {
    it('matches known values', () => {
        const white = hexToOklch('#ffffff')!;
        expect(white.l).toBeCloseTo(1, 3);
        expect(white.c).toBeCloseTo(0, 3);
        const red = hexToOklch('#ff0000')!;
        expect(red.l).toBeCloseTo(0.628, 3);
        expect(red.c).toBeCloseTo(0.2577, 3);
        expect(red.h).toBeCloseTo(29.23, 1);
    });

    it('goes there and back, alpha included', () => {
        for (const hex of ['#7c5cff', '#12ab34', '#000000', '#ffffff', '#ff800080']) {
            expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
        }
    });

    it('clamps colours outside sRGB', () => {
        expect(oklchToHex({ l: 0.7, c: 0.4, h: 150 })).toMatch(/^#[\da-f]{6}$/);
    });

    it('is null for anything that is not hex', () => {
        expect(hexToOklch('violet')).toBeNull();
    });
});
