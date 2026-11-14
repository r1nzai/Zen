import { CSSProperties, DependencyList, RefObject, useLayoutEffect, useState } from 'react';

/** Where an item sits in its track, in the track's own coordinates. */
export interface IndicatorBox {
    x: number;
    y: number;
    w: number;
    h: number;
    /** Which way it last moved, each axis: toward the end (1), the start (-1), or not at all. */
    toward?: { x: number; y: number };
}

/**
 * The props that place an indicator (with the class zen__indicator) on `box`: its edges go on their
 * own, the one toward the new item first and the far one a beat after, so it stretches across and
 * catches up (theme.css). With `axis` 'x' it only travels along the row, its own classes placing
 * it up and down (a Tab's underline).
 */
export function indicatorProps(
    box: IndicatorBox,
    axis?: 'x',
): { style: CSSProperties; 'data-axis'?: 'x'; 'data-toward-x'?: string; 'data-toward-y'?: string } {
    const dir = (n = 0) => (n > 0 ? 'end' : n < 0 ? 'start' : undefined);
    return {
        style: {
            '--zen-ind-l': `${box.x}px`,
            '--zen-ind-t': `${box.y}px`,
            '--zen-ind-r': `${box.x + box.w}px`,
            '--zen-ind-b': `${box.y + box.h}px`,
        } as CSSProperties,
        'data-axis': axis,
        'data-toward-x': dir(box.toward?.x),
        'data-toward-y': dir(box.toward?.y),
    };
}

/**
 * Where the active item of a track is, for an indicator that slides to it
 * (Pills, Tabs, Segmented). `selector` finds the active item inside the track;
 * null while none matches, and until measured (e.g. in server HTML).
 *
 * Measures again when the track resizes (labels change width as fonts load; a
 * row can wrap), when items are added or removed or their aria-current or
 * aria-selected changes (a router marking the current link itself), and when
 * `deps` change (state the DOM doesn't show as an attribute, like a checked radio).
 *
 * Call it in the component that renders the track element: React attaches a
 * parent's refs after its children's effects run, so a child measuring a
 * parent's track would find nothing.
 */
export function useIndicator(
    trackRef: RefObject<HTMLElement | null>,
    selector: string,
    deps: DependencyList = [],
): IndicatorBox | null {
    const [box, setBox] = useState<IndicatorBox | null>(null);

    useLayoutEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const measure = () => {
            // A hidden track (a closed dialog's) measures 0×0: the indicator would grow from nothing when shown.
            const el = track.checkVisibility?.() !== false ? track.querySelector<HTMLElement>(selector) : null;
            const next = el && { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
            // Only on a change: the indicator appearing is itself a mutation of the track.
            setBox((prev) =>
                prev && next && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
                    ? prev
                    : next && {
                          ...next,
                          toward: prev ? { x: Math.sign(next.x - prev.x), y: Math.sign(next.y - prev.y) } : undefined,
                      },
            );
        };
        measure();
        const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(measure);
        mutations?.observe(track, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['aria-current', 'aria-selected'],
        });
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        resizes?.observe(track);
        return () => {
            mutations?.disconnect();
            resizes?.disconnect();
        };
    }, [trackRef, selector, ...deps]);

    return box;
}
