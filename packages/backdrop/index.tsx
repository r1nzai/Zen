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
        // A pointer move does as little as it can, so a page of thousands of lit
        // elements (a big table's cells) costs what a few do:
        // - The lit elements are looked up again only after the page's elements change.
        // - Only those on screen, or within the light's reach of it, are followed
        //   (an IntersectionObserver); the rest are parked once.
        // - Their boxes are measured once and kept until the layout may have changed:
        //   a scroll, a resize, a lit element resizing, the page's elements or
        //   attributes changing, or a transition or animation ending.
        // Values are only written when they change: each write restyles and repaints
        // the element.
        const REACH = 400; // the edge glow's gradient radius is 360px
        const SELECTOR = '.glow-edge, .glow-border';
        let out = true;
        let lit = new Set<HTMLElement>();
        let relist = true;
        const near = new Set<HTMLElement>();
        const parked = new WeakSet<HTMLElement>();
        const rects = new Map<HTMLElement, DOMRect>();
        const written = new WeakMap<HTMLElement, string>();
        const ours = new Set<Element>();
        const write = (el: HTMLElement, gx: string, gy: string, xName = '--gx', yName = '--gy') => {
            const key = gx + ' ' + gy;
            if (written.get(el) === key) return;
            written.set(el, key);
            ours.add(el);
            el.style.setProperty(xName, gx);
            el.style.setProperty(yName, gy);
        };
        const park = (el: HTMLElement) => {
            if (parked.has(el)) return;
            write(el, '-9999px', '-9999px');
            parked.add(el);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(apply);
        };
        const nearby =
            typeof IntersectionObserver === 'undefined'
                ? null
                : new IntersectionObserver(
                      (entries) => {
                          for (const { target, isIntersecting } of entries) {
                              const el = target as HTMLElement;
                              if (isIntersecting) near.add(el);
                              else {
                                  near.delete(el);
                                  rects.delete(el);
                                  park(el);
                              }
                          }
                          if (!out) schedule();
                      },
                      { rootMargin: `${REACH}px` },
                  );
        const resized = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => rects.clear());
        // Anything but the lights' own writes (their --gx/--gy, the light box) may
        // have moved things: measure again. New or removed elements, or classes: look
        // the lit elements up again.
        const onMutations = (records: MutationRecord[]) => {
            for (const r of records) {
                if (backdrop?.contains(r.target)) continue;
                if (r.type === 'attributes' && r.attributeName === 'style' && ours.has(r.target as Element)) continue;
                rects.clear();
                if (r.type === 'childList' || r.attributeName === 'class') relist = true;
            }
        };
        const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(onMutations);
        const listed = () => {
            if (!relist) return;
            relist = false;
            const next = new Set(document.querySelectorAll<HTMLElement>(SELECTOR));
            for (const el of lit) {
                if (next.has(el)) continue;
                nearby?.unobserve(el);
                resized?.unobserve(el);
                near.delete(el);
                rects.delete(el);
            }
            for (const el of next) {
                if (lit.has(el)) continue;
                // Until it's known to be near, it's parked.
                park(el);
                nearby?.observe(el);
                resized?.observe(el);
            }
            lit = next;
        };
        const apply = () => {
            frame = 0;
            listed();
            // Without an IntersectionObserver, every lit element is followed.
            const els = nearby ? [...near] : [...lit];
            // Measured first, then written: interleaving the two forces a layout per element.
            for (const el of els) if (!rects.has(el)) rects.set(el, el.getBoundingClientRect());
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
            for (const el of els) {
                const r = rects.get(el)!;
                if (x > r.left - REACH && x < r.right + REACH && y > r.top - REACH && y < r.bottom + REACH) {
                    write(el, `${Math.round(x - r.left)}px`, `${Math.round(y - r.top)}px`);
                    parked.delete(el);
                } else park(el);
            }
            // The records of these writes are the lights' own: set aside, not acted on.
            onMutations(mutations?.takeRecords() ?? []);
            ours.clear();
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
        mutations?.observe(document.body, { subtree: true, childList: true, attributes: true });
        window.addEventListener('pointermove', onMove, { passive: true });
        root.addEventListener('pointerleave', onLeave);
        // Content moves under a still pointer when scrolling. Re-aim the lights once
        // the scroll settles, not on every frame: each update repaints the edge of every
        // card near the pointer, which made long pages stutter. Meanwhile the light
        // simply rides along with the card.
        let settle = 0;
        const onScroll = () => {
            rects.clear();
            clearTimeout(settle);
            settle = window.setTimeout(schedule, 120);
        };
        const onResize = () => {
            rects.clear();
            schedule();
        };
        // Parts that move by CSS (a card lifting, a dialog opening) are measured again once they stop.
        const onMoved = () => rects.clear();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', onResize, { passive: true });
        document.addEventListener('transitionend', onMoved, true);
        document.addEventListener('animationend', onMoved, true);
        return () => {
            window.removeEventListener('pointermove', onMove);
            root.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('scroll', onScroll, { capture: true });
            clearTimeout(settle);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('transitionend', onMoved, true);
            document.removeEventListener('animationend', onMoved, true);
            mutations?.disconnect();
            nearby?.disconnect();
            resized?.disconnect();
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
