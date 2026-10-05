import { cx } from '@zen/utils/cx';
import { applyGraphicsMode } from '@zen/utils/graphics';
import { CSSProperties, useEffect, useRef } from 'react';

/**
 * Fixed page background: slow aurora glows over a faint pattern (topographic
 * contours or a dot grid), with a light that follows the pointer. It also
 * lights `.glow-edge` and `.glow-border` borders (cards, outline buttons,
 * dialogs, fields) near the pointer. Render once, behind everything.
 */
export default function Backdrop({ pattern, topoSrc, className, style }: BackdropProps) {
    const kind = pattern ?? (topoSrc ? 'contours' : 'dots');

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = document.documentElement;
        const backdrop = ref.current;
        let frame = 0;
        let x = -9999;
        let y = -9999;
        // Moves the backdrop's pointer light (the .zen-light box) and publishes the pointer,
        // for every .glow-edge/.glow-border element, in that element's own coordinates
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
            const els = Array.from(document.querySelectorAll<HTMLElement>('.glow-edge, .glow-border'));
            const rects = els.map((el) => el.getBoundingClientRect());
            const box = backdrop?.getBoundingClientRect();
            // The backdrop's own light is a small box moved to the pointer: only the
            // box changes, so only where it was and is gets repainted. (A change on the
            // backdrop itself would repaint the whole full-screen layer.) Positioned in
            // the backdrop's own box, which is the viewport unless an ancestor contains
            // it (a transformed frame, as in the docs examples). Pointer gone: the light
            // fades out where it is (CSS, data-pointer).
            if (backdrop && box) {
                const state = out ? 'out' : 'in';
                if (backdrop.dataset.pointer !== state) backdrop.dataset.pointer = state;
                const light = backdrop.querySelector<HTMLElement>('.zen-light');
                if (light && !out)
                    write(light, `${Math.round(x - box.left)}px`, `${Math.round(y - box.top)}px`, 'left', 'top');
            }
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

    // The aurora drifts in steps, about 6 a second (theme.css), but a running CSS
    // animation of custom properties restyles the page on every frame, 60 a second,
    // to find nothing changed in between. So its animations are held paused and moved
    // on 6 times a second instead: the same keyframes, the same look. Asked for each
    // time, as CSS switches them off and on (phones, lite graphics); ones that end
    // (reduced motion) are left to CSS.
    useEffect(() => {
        const aurora = ref.current?.querySelector('.zen-aurora');
        if (!aurora?.getAnimations) return;
        let last = performance.now();
        const tick = () => {
            const now = performance.now();
            // All read first, then moved: reading after a move would restyle again.
            const drifting = aurora
                .getAnimations()
                .filter((a) => a.effect?.getTiming().iterations === Infinity)
                .map((a) => [a, a.playState === 'paused' ? Number(a.currentTime ?? 0) : null] as const);
            for (const [a, time] of drifting) {
                if (time === null) a.pause();
                else a.currentTime = time + (now - last);
            }
            last = now;
        };
        tick();
        const timer = window.setInterval(tick, 1000 / 6);
        return () => clearInterval(timer);
    }, []);

    // The contour image is drawn once into a bitmap at the backdrop's exact pixel
    // size (again after a resize) and used as the mask from then on. Otherwise a
    // vector image (thousands of path segments) is re-drawn every time the lit
    // layer repaints, i.e. on every pointer move; at 1440p that took ~20ms of GPU.
    // Same pixels: the image is fitted the way the CSS mask fits it (centre, cover).
    useEffect(() => {
        const el = ref.current;
        if (!topoSrc || !el || typeof document === 'undefined') return;
        let bitmapUrl = '';
        let cancelled = false;
        let timer = 0;
        const image = new Image();
        image.src = topoSrc;
        const render = async () => {
            try {
                await image.decode();
                const dpr = window.devicePixelRatio || 1;
                const w = Math.round(el.clientWidth * dpr);
                const h = Math.round(el.clientHeight * dpr);
                if (!w || !h) return;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const nw = image.naturalWidth || w;
                const nh = image.naturalHeight || h;
                const scale = Math.max(w / nw, h / nh);
                canvas
                    .getContext('2d')
                    ?.drawImage(image, (w - nw * scale) / 2, (h - nh * scale) / 2, nw * scale, nh * scale);
                const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done));
                if (cancelled || !blob) return;
                const next = URL.createObjectURL(blob);
                el.style.setProperty('--zen-topo', `url("${next}")`);
                if (bitmapUrl) URL.revokeObjectURL(bitmapUrl);
                bitmapUrl = next;
            } catch {
                // Not drawable (e.g. a cross-origin image): keep using it as it is.
            }
        };
        render();
        const resizes =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(() => {
                      clearTimeout(timer);
                      timer = window.setTimeout(render, 200);
                  });
        resizes?.observe(el);
        return () => {
            cancelled = true;
            clearTimeout(timer);
            resizes?.disconnect();
            if (bitmapUrl) URL.revokeObjectURL(bitmapUrl);
            el.style.setProperty('--zen-topo', `url("${topoSrc}")`);
        };
    }, [topoSrc]);

    return (
        <div
            ref={ref}
            className={cx('zen-backdrop', className)}
            data-pattern={kind}
            aria-hidden
            style={{ ...(topoSrc && ({ '--zen-topo': `url("${topoSrc}")` } as CSSProperties)), ...style }}
        >
            <div className="zen-aurora" />
            {kind === 'contours' ? (
                <>
                    <div className="zen-topo" />
                    <div className="zen-topo zen-topo--lit">
                        <div className="zen-light" />
                    </div>
                </>
            ) : (
                <>
                    <div className="zen-dots" />
                    <div className="zen-dots zen-dots--ambient" />
                    <div className="zen-dots zen-dots--lit">
                        <div className="zen-light" />
                    </div>
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
    /** Classes for the backdrop layer (e.g. a view-transition-name). */
    className?: string;
    style?: CSSProperties;
}
