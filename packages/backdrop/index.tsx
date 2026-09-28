import { CSSProperties, useEffect } from 'react';

/**
 * Fixed page background: slow aurora glows over a faint pattern (topographic
 * contours or a dot grid), with a light that follows the pointer. It also
 * lights `.glow-edge` borders (cards, outline buttons, dialogs) near the
 * pointer. Render once, behind everything.
 */
export default function Backdrop({ pattern, topoSrc }: BackdropProps) {
    const kind = pattern ?? (topoSrc ? 'contours' : 'dots');

    useEffect(() => {
        const root = document.documentElement;
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
        const REACH = 400; // the edge glow's gradient radius is 360px
        const parked = new WeakSet<HTMLElement>();
        let out = true;
        const apply = () => {
            frame = 0;
            // Pointer gone: the background lights fade out where they are (CSS, data-pointer).
            root.dataset.pointer = out ? 'out' : 'in';
            if (!out) {
                root.style.setProperty('--mx', `${x}px`);
                root.style.setProperty('--my', `${y}px`);
            }
            const els = Array.from(document.querySelectorAll<HTMLElement>('.glow-edge'));
            const rects = els.map((el) => el.getBoundingClientRect());
            els.forEach((el, i) => {
                const r = rects[i];
                const near = x > r.left - REACH && x < r.right + REACH && y > r.top - REACH && y < r.bottom + REACH;
                if (near) {
                    el.style.setProperty('--gx', `${x - r.left}px`);
                    el.style.setProperty('--gy', `${y - r.top}px`);
                    parked.delete(el);
                } else if (!parked.has(el)) {
                    el.style.setProperty('--gx', '-9999px');
                    el.style.setProperty('--gy', '-9999px');
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
        if (window.matchMedia?.('(hover: none), (pointer: coarse)').matches) return;
        window.addEventListener('pointermove', onMove, { passive: true });
        root.addEventListener('pointerleave', onLeave);
        // Content moves under a still pointer when scrolling or resizing.
        window.addEventListener('scroll', schedule, { passive: true, capture: true });
        window.addEventListener('resize', schedule, { passive: true });
        return () => {
            window.removeEventListener('pointermove', onMove);
            root.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('scroll', schedule, { capture: true });
            window.removeEventListener('resize', schedule);
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div
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
