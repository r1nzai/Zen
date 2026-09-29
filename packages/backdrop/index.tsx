import { applyGraphicsMode } from '@zen/utils/graphics';
import { CSSProperties, useEffect, useRef } from 'react';

/**
 * Fixed page background: slow aurora glows over a faint pattern (topographic
 * contours or a dot grid), with a light that follows the pointer. It also
 * lights `.glow-edge` borders (cards, outline buttons, dialogs) near the
 * pointer. Render once, behind everything.
 */
export default function Backdrop({ pattern, topoSrc }: BackdropProps) {
    const kind = pattern ?? (topoSrc ? 'contours' : 'dots');

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        const backdrop = ref.current;
        let frame = 0;
        let x = -9999;
        let y = -9999;
        // Publishes the pointer for the backdrop light (--mx/--my on <html>) and,
        // for every .glow-edge element, in that element's own coordinates
        // (--gx/--gy). Per-element values stay exact inside transformed, masked
        // or scrolling containers, where viewport-fixed backgrounds don't.
        //
        // Per frame: read every element's box first, then write (interleaving the two
        // forces a layout per element). Only elements within reach of the light are
        // updated; the rest are parked once, so they aren't repainted every frame.
        // Values are only written when they change: scrolling fires this every
        // frame, and each write restyles and repaints the element.
        const REACH = 400; // the edge glow's gradient radius is 360px
        const parked = new WeakSet<HTMLElement>();
        let out = true;
        const written = new WeakMap<HTMLElement, string>();
        const write = (el: HTMLElement, gx: string, gy: string, xName = '--gx', yName = '--gy') => {
            const key = gx + ' ' + gy;
            if (written.get(el) === key) return;
            written.set(el, key);
            el.style.setProperty(xName, gx);
            el.style.setProperty(yName, gy);
        };
        const apply = () => {
            frame = 0;
            // The backdrop's own light: its variables live on the backdrop (not <html>,
            // where a change would restyle the whole page). Pointer gone: the lights
            // fade out where they are (CSS, data-pointer).
            if (backdrop) {
                const state = out ? 'out' : 'in';
                if (backdrop.dataset.pointer !== state) backdrop.dataset.pointer = state;
                if (!out) write(backdrop, `${x}px`, `${y}px`, '--mx', '--my');
            }
            const els = Array.from(document.querySelectorAll<HTMLElement>('.glow-edge'));
            const rects = els.map((el) => el.getBoundingClientRect());
            els.forEach((el, i) => {
                const r = rects[i];
                const near = x > r.left - REACH && x < r.right + REACH && y > r.top - REACH && y < r.bottom + REACH;
                if (near) {
                    write(el, `${Math.round(x - r.left)}px`, `${Math.round(y - r.top)}px`);
                    parked.delete(el);
                } else if (!parked.has(el)) {
                    write(el, '-9999px', '-9999px');
                    parked.add(el);
                }
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(apply);
        };
        const onMove = (e: PointerEvent) => {
            x = e.clientX;
            y = e.clientY;
            out = false;
            schedule();
        };
        const onLeave = () => {
            x = y = -9999;
            out = true;
            schedule();
        };
        // Touch screens have no hovering pointer to follow; tracking it would just
        // re-measure every card on each scroll frame, which makes phones stutter.
        // Without a GPU (lite graphics) the lights are off, so there's nothing to track either.
        if (window.matchMedia?.('(hover: none), (pointer: coarse)').matches || applyGraphicsMode() === 'lite') return;
        window.addEventListener('pointermove', onMove, { passive: true });
        root.addEventListener('pointerleave', onLeave);
        // Content moves under a still pointer when scrolling. Re-aim the lights once
        // the scroll settles, not on every frame: each update repaints the edge of every
        // card near the pointer, which made long pages stutter. Meanwhile the light
        // simply rides along with the card.
        let settle = 0;
        const onScroll = () => {
            clearTimeout(settle);
            settle = window.setTimeout(schedule, 120);
        };
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', schedule, { passive: true });
        return () => {
            window.removeEventListener('pointermove', onMove);
            root.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('scroll', onScroll, { capture: true });
            clearTimeout(settle);
            window.removeEventListener('resize', schedule);
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div
            ref={ref}
            className="zen-backdrop"
            aria-hidden
            style={topoSrc ? ({ '--zen-topo': `url("${topoSrc}")` } as CSSProperties) : undefined}
        >
            <div className="zen-aurora zen-aurora--a" />
            <div className="zen-aurora zen-aurora--b" />
            <div className="zen-aurora zen-aurora--c" />
            {kind === 'contours' ? (
                <>
                    <div className="zen-topo" />
                    <div className="zen-topo zen-topo--lit" />
                </>
            ) : (
                <>
                    <div className="zen-dots" />
                    <div className="zen-dots zen-dots--ambient" />
                    <div className="zen-dots zen-dots--lit" />
                </>
            )}
            <div className="zen-vignette" />
        </div>
    );
}

export interface BackdropProps {
    /** Background pattern. Defaults to contours when `topoSrc` is given, dots otherwise. */
    pattern?: 'contours' | 'dots';
    /** URL of a contour-line image (strokes on transparent), used as a mask. */
    topoSrc?: string;
}
