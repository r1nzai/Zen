import { describe, expect, it } from 'vite-plus/test';

import { moveRect, resizeRect } from './geometry';

const bounds = { width: 400, height: 120, min: 8 };
const box = { x: 100, y: 40, w: 80, h: 40 };

describe('moveRect', () => {
    it('moves, in whole units', () => {
        expect(moveRect(box, 10.4, -5.6, bounds).rect).toEqual({ x: 110, y: 34, w: 80, h: 40 });
    });

    it('stays on the surface', () => {
        expect(moveRect(box, -500, 500, bounds).rect).toEqual({ x: 0, y: 80, w: 80, h: 40 });
        expect(moveRect(box, 500, -500, bounds).rect).toEqual({ x: 320, y: 0, w: 80, h: 40 });
    });

    it('snaps an edge or the centre to the surface and to other items, with guides', () => {
        const snap = { others: [{ x: 250, y: 0, w: 50, h: 20 }], threshold: 4 };
        // Its right edge, at 247, goes to the other item's left edge.
        const near = moveRect(box, 67, 0, bounds, snap);
        expect(near.rect.x).toBe(170);
        expect(near.guides).toContainEqual({ axis: 'x', at: 250 });
        // Centre 60+2 → 60, the surface's middle.
        const middle = moveRect(box, 0, 2, bounds, snap);
        expect(middle.rect.y).toBe(40);
        expect(middle.guides).toContainEqual({ axis: 'y', at: 60 });
    });

    it('does not snap beyond the threshold', () => {
        const r = moveRect(box, 0, 10, bounds, { others: [], threshold: 4 });
        expect(r.rect.y).toBe(50);
        expect(r.guides).toEqual([]);
    });
});

describe('resizeRect', () => {
    it('moves only the dragged edges', () => {
        expect(resizeRect(box, 'se', 20, 10, bounds).rect).toEqual({ x: 100, y: 40, w: 100, h: 50 });
        expect(resizeRect(box, 'nw', -20, -10, bounds).rect).toEqual({ x: 80, y: 30, w: 100, h: 50 });
        expect(resizeRect(box, 'e', 20, 99, bounds).rect).toEqual({ x: 100, y: 40, w: 100, h: 40 });
    });

    it('keeps the minimum size, the opposite edge staying put', () => {
        expect(resizeRect(box, 'w', 200, 0, bounds).rect).toEqual({ x: 172, y: 40, w: 8, h: 40 });
    });

    it('stays on the surface', () => {
        expect(resizeRect(box, 'se', 999, 999, bounds).rect).toEqual({ x: 100, y: 40, w: 300, h: 80 });
        expect(resizeRect(box, 'nw', -999, -999, bounds).rect).toEqual({ x: 0, y: 0, w: 180, h: 80 });
    });

    it('keeps its shape with keepRatio, and still fits', () => {
        expect(resizeRect(box, 'se', 40, 0, bounds, { keepRatio: true }).rect).toEqual({
            x: 100,
            y: 40,
            w: 120,
            h: 60,
        });
        expect(resizeRect(box, 's', 0, 10, bounds, { keepRatio: true }).rect).toEqual({ x: 100, y: 40, w: 100, h: 50 });
        // Only 80 tall fits below y=40: 160 by 80.
        expect(resizeRect(box, 'se', 999, 0, bounds, { keepRatio: true }).rect).toEqual({
            x: 100,
            y: 40,
            w: 160,
            h: 80,
        });
    });

    it('snaps a dragged edge, with a guide', () => {
        const r = resizeRect(box, 'e', 17, 0, bounds, { snap: { others: [], threshold: 4 } });
        expect(r.rect.w).toBe(100);
        expect(r.guides).toEqual([{ axis: 'x', at: 200 }]);
    });
});
