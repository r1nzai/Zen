import { DependencyList, RefObject, useLayoutEffect, useState } from 'react';

/** Where an item sits in its track, in the track's own coordinates. */
export interface IndicatorBox {
    x: number;
    y: number;
    w: number;
    h: number;
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
                    : next,
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
