export interface CanvasRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** A snap line: a vertical one at x, or a horizontal one at y. */
export interface CanvasGuide {
    axis: 'x' | 'y';
    at: number;
}

/** Which corner or edge a resize handle is on. */
export type CanvasHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface Bounds {
    width: number;
    height: number;
    /** Smallest width and height. */
    min: number;
}

export interface SnapOptions {
    /** Rects to line up with, besides the surface. */
    others?: readonly CanvasRect[];
    /** How close counts for lines, in surface units; 0 or left out, no lines. */
    threshold?: number;
    /** Round to multiples of this when no line is in reach. */
    grid?: number;
}

/** The box around several rects. */
export function boundsOf(rects: readonly CanvasRect[]): CanvasRect {
    const x = Math.min(...rects.map((r) => r.x));
    const y = Math.min(...rects.map((r) => r.y));
    return {
        x,
        y,
        w: Math.max(...rects.map((r) => r.x + r.w)) - x,
        h: Math.max(...rects.map((r) => r.y + r.h)) - y,
    };
}

/** Whether two rects overlap. */
export function intersects(a: CanvasRect, b: CanvasRect): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** The lines an item snaps to: the surface's edges and centre, and the other rects' edges and centres. */
function targets(axis: 'x' | 'y', bounds: Bounds, others: readonly CanvasRect[]) {
    const size = axis === 'x' ? bounds.width : bounds.height;
    const lines = [0, size / 2, size];
    for (const o of others) {
        const [start, length] = axis === 'x' ? [o.x, o.w] : [o.y, o.h];
        lines.push(start, start + length / 2, start + length);
    }
    return lines;
}

/** The smallest shift (within threshold) that puts one of `points` on a line, and that line. */
function nearest(points: readonly number[], lines: readonly number[], threshold: number) {
    let best: { by: number; at: number } | null = null;
    for (const p of points) {
        for (const at of lines) {
            const by = at - p;
            if (Math.abs(by) <= threshold && (!best || Math.abs(by) < Math.abs(best.by))) best = { by, at };
        }
    }
    return best;
}

const toGrid = (v: number, grid?: number) => (grid ? Math.round(v / grid) * grid : v);

/**
 * `start` moved by dx, dy, then snapped: an edge or its centre onto a line in
 * reach, otherwise its corner onto the grid. Kept on the surface, in whole units.
 */
export function moveRect(
    start: CanvasRect,
    dx: number,
    dy: number,
    bounds: Bounds,
    snap: SnapOptions = {},
): { rect: CanvasRect; guides: CanvasGuide[] } {
    const guides: CanvasGuide[] = [];
    const axis = (a: 'x' | 'y', p: number, size: number) => {
        const hit =
            snap.threshold &&
            nearest([p, p + size / 2, p + size], targets(a, bounds, snap.others ?? []), snap.threshold);
        if (!hit) return toGrid(p, snap.grid);
        guides.push({ axis: a, at: hit.at });
        return p + hit.by;
    };
    const x = axis('x', start.x + dx, start.w);
    const y = axis('y', start.y + dy, start.h);
    return {
        rect: {
            x: Math.round(Math.min(Math.max(0, x), bounds.width - start.w)),
            y: Math.round(Math.min(Math.max(0, y), bounds.height - start.h)),
            w: start.w,
            h: start.h,
        },
        guides,
    };
}

/**
 * `start` resized by dragging `handle` by dx, dy: its moving edges snapped to a
 * line or the grid, no smaller than `min`, kept on the surface, in whole units.
 * With `keepRatio`, its shape stays the same (and it doesn't snap).
 */
export function resizeRect(
    start: CanvasRect,
    handle: CanvasHandle,
    dx: number,
    dy: number,
    bounds: Bounds,
    { keepRatio = false, ...snap }: SnapOptions & { keepRatio?: boolean } = {},
): { rect: CanvasRect; guides: CanvasGuide[] } {
    const west = handle.includes('w');
    const east = handle.includes('e');
    const north = handle.includes('n');
    const south = handle.includes('s');
    const right0 = start.x + start.w;
    const bottom0 = start.y + start.h;
    let left = start.x + (west ? dx : 0);
    let right = right0 + (east ? dx : 0);
    let top = start.y + (north ? dy : 0);
    let bottom = bottom0 + (south ? dy : 0);
    const guides: CanvasGuide[] = [];

    if (!keepRatio) {
        const edge = (axis: 'x' | 'y', at: number) => {
            const hit = snap.threshold && nearest([at], targets(axis, bounds, snap.others ?? []), snap.threshold);
            if (!hit) return toGrid(at, snap.grid);
            guides.push({ axis, at: hit.at });
            return hit.at;
        };
        if (west) left = edge('x', left);
        if (east) right = edge('x', right);
        if (north) top = edge('y', top);
        if (south) bottom = edge('y', bottom);
    }

    // The room each way from the edges that stay put.
    const maxW = west ? right0 : bounds.width - start.x;
    const maxH = north ? bottom0 : bounds.height - start.y;
    let w = Math.min(maxW, Math.max(bounds.min, right - left));
    let h = Math.min(maxH, Math.max(bounds.min, bottom - top));

    if (keepRatio) {
        const ratio = start.w / start.h;
        const sideways = west || east;
        const upDown = north || south;
        // The edge dragged further, relative to its size, leads.
        const byWidth = sideways && (!upDown || Math.abs(w / start.w - 1) >= Math.abs(h / start.h - 1));
        if (byWidth) h = w / ratio;
        else w = h * ratio;
        const fit = Math.min(1, maxW / w, maxH / h);
        const grow = Math.max(1, bounds.min / w, bounds.min / h);
        const k = fit < 1 ? fit : grow;
        w *= k;
        h *= k;
    }

    w = Math.round(w);
    h = Math.round(h);
    return {
        rect: { x: west ? right0 - w : start.x, y: north ? bottom0 - h : start.y, w, h },
        guides,
    };
}
