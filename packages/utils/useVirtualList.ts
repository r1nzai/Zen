import { RefObject, useLayoutEffect, useState } from 'react';

export interface VirtualItem {
    index: number;
    /** Offset from the top of the list, in px. */
    start: number;
    size: number;
}

/**
 * Windowing for a scrolling list whose rows all have the same height: only the
 * rows in view (plus `overscan` either side) are rendered. Position each item
 * absolutely at `start` inside a container `totalSize` px tall.
 */
export function useVirtualList({ count, itemHeight, scrollRef, overscan = 6 }: VirtualListOptions) {
    const [viewport, setViewport] = useState({ scrollTop: 0, height: 0 });

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const update = () => setViewport({ scrollTop: el.scrollTop, height: el.clientHeight });
        update();
        el.addEventListener('scroll', update, { passive: true });
        // Height changes when the list opens (a closed popover measures 0) or resizes.
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
        resizes?.observe(el);
        return () => {
            el.removeEventListener('scroll', update);
            resizes?.disconnect();
        };
        // `count`: a shorter list (e.g. after filtering) clamps the scroll position.
    }, [scrollRef, count]);

    // Until the list can be measured (hidden, or rendering on the server), assume ten rows.
    const height = viewport.height || itemHeight * 10;
    const first = Math.max(0, Math.floor(viewport.scrollTop / itemHeight) - overscan);
    const last = Math.min(count, Math.ceil((viewport.scrollTop + height) / itemHeight) + overscan);

    const items: VirtualItem[] = [];
    for (let index = first; index < last; index++) {
        items.push({ index, start: index * itemHeight, size: itemHeight });
    }
    const totalSize = count * itemHeight;
    return {
        items,
        totalSize,
        /** Space above the rendered rows (for a table: a TableSpacerRow of this height). */
        paddingTop: items.length ? items[0].start : 0,
        /** Space below the rendered rows. */
        paddingBottom: items.length ? totalSize - (items[items.length - 1].start + itemHeight) : 0,
    };
}

export interface VirtualListOptions {
    count: number;
    /** Height of every row, in px. */
    itemHeight: number;
    /** The element that scrolls. */
    scrollRef: RefObject<HTMLElement | null>;
    /** Extra rows rendered above and below the visible ones, so fast scrolling doesn't show gaps. */
    overscan?: number;
}
