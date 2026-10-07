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

export interface Snapping {
    /** The other items. */
    others: readonly CanvasRect[];
    /** How close counts, in surface units. */
    threshold: number;
}

/** The lines an item snaps to: the surface's edges and centre, and the other items' edges and centres. */
function targets(axis: 'x' | 'y', bounds: Bounds, others: readonly CanvasRect[]) {
    const size = axis === 'x' ? bounds.width : bounds.height;
    const lines = [0, size / 2, size];
    for (const o of others) {
        const [start, length] = axis === 'x' ? [o.x, o.w] : [o.y, o.h];
        lines.push(start, start + length / 2, start + length);
    }
    return lines;
}

/** The smallest shift (within threshold) that puts one of `points` on a target, and that target. */
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

/** `start` moved by dx, dy: snapped (its edges or centre to a line), kept on the surface, in whole units. */
export function moveRect(
    start: CanvasRect,
    dx: number,
    dy: number,
    bounds: Bounds,
    snap?: Snapping,
): { rect: CanvasRect; guides: CanvasGuide[] } {
    let x = start.x + dx;
    let y = start.y + dy;
    const guides: CanvasGuide[] = [];
    if (snap) {
        const sx = nearest([x, x + start.w / 2, x + start.w], targets('x', bounds, snap.others), snap.threshold);
        if (sx) {
            x += sx.by;
            guides.push({ axis: 'x', at: sx.at });
        }
        const sy = nearest([y, y + start.h / 2, y + start.h], targets('y', bounds, snap.others), snap.threshold);
        if (sy) {
            y += sy.by;
            guides.push({ axis: 'y', at: sy.at });
        }
    }
    x = Math.round(Math.min(Math.max(0, x), bounds.width - start.w));
    y = Math.round(Math.min(Math.max(0, y), bounds.height - start.h));
    return { rect: { x, y, w: start.w, h: start.h }, guides };
}

/**
 * `start` resized by dragging `handle` by dx, dy: its moving edges snapped to a
 * line, no smaller than `min`, kept on the surface, in whole units. With
 * `keepRatio`, its shape stays the same (and it doesn't snap).
 */
export function resizeRect(
    start: CanvasRect,
    handle: CanvasHandle,
    dx: number,
    dy: number,
    bounds: Bounds,
    { keepRatio = false, snap }: { keepRatio?: boolean; snap?: Snapping } = {},
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

    if (snap && !keepRatio) {
        const edge = (axis: 'x' | 'y', at: number) => {
            const s = nearest([at], targets(axis, bounds, snap.others), snap.threshold);
            if (!s) return at;
            guides.push({ axis, at: s.at });
            return s.at;
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
        guides: keepRatio ? [] : guides,
    };
}
