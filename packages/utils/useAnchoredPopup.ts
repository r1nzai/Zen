import { CSSProperties, RefObject, useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * A popup anchored to a trigger, on the native Popover API: opens below the
 * trigger (flipping above if there's no room), closes on outside click and
 * Escape, and returns focus to the trigger. Spread `triggerProps` on the
 * trigger button and `popupProps` on the popup element.
 */
export function useAnchoredPopup<T extends HTMLElement = HTMLDivElement>({
    align = 'start',
    offset = 4,
    matchWidth = false,
    onOpenChange,
}: AnchoredPopupOptions = {}) {
    const id = `zen__popup-${useId().replace(/[^\w-]/g, '')}`;
    const popupRef = useRef<T>(null);
    const [open, setOpenState] = useState(false);
    const onOpenChangeRef = useRef(onOpenChange);
    onOpenChangeRef.current = onOpenChange;
    // Opening from code and the browser's toggle event both report here; repeats are ignored.
    const lastOpen = useRef(false);
    const report = useCallback((next: boolean) => {
        setOpenState(next);
        if (lastOpen.current === next) return;
        lastOpen.current = next;
        onOpenChangeRef.current?.(next);
    }, []);

    const setOpen = useCallback(
        (next: boolean) => {
            const popup = popupRef.current;
            if (!popup) return;
            try {
                if (next) popup.showPopover?.();
                else popup.hidePopover?.();
            } catch {
                // Already in that state.
            }
            // The toggle event reports it too, but asynchronously (and not at all in older browsers).
            report(next);
        },
        [report],
    );

    useAnchorFallback(popupRef);

    useEffect(() => {
        const popup = popupRef.current;
        if (!popup) return;
        const onToggle = (e: Event) => report((e as ToggleEvent).newState === 'open');
        popup.addEventListener('toggle', onToggle);
        return () => popup.removeEventListener('toggle', onToggle);
    }, [report]);

    const triggerProps = {
        popoverTarget: id,
        'aria-expanded': open,
        'aria-controls': id,
        'data-popup-open': open || undefined,
        ...anchorFor(id),
    };

    const popupProps = {
        ref: popupRef,
        id,
        popover: 'auto' as const,
        style: anchoredStyle(id, { align, offset, width: matchWidth ? 'at-least' : undefined }),
    };

    return { id, open, setOpen, triggerProps, popupProps, popupRef };
}

/** Makes an element the anchor its popup (`id`) is placed against. Spread it on the trigger. */
export function anchorFor(id: string) {
    return { 'data-zen-anchor': id, style: { anchorName: `--${id}` } as CSSProperties };
}

/**
 * The popup's position: below the trigger (above it if there's no room below),
 * lined up with its start or end edge, or centred on it; `width` makes it as
 * wide as the trigger, or at least as wide. For parts that take their own
 * `align`/`offset` (PopoverContent, MenuContent). The same choices are kept as
 * custom properties, for placing it where anchor positioning isn't supported.
 */
export function anchoredStyle(id: string, { align = 'start', offset = 4, width }: AnchorOptions = {}): CSSProperties {
    const area = {
        start: 'block-end span-inline-end',
        end: 'block-end span-inline-start',
        center: 'block-end center',
    }[align];
    return {
        positionAnchor: `--${id}`,
        positionArea: area,
        positionTryFallbacks: 'flip-block',
        inset: 'auto',
        // As wide as its content, and at least as wide as the trigger.
        ...(width === 'at-least' && { width: 'max-content', minWidth: 'anchor-size(width)' }),
        ...(width === 'match' && { width: 'anchor-size(width)', minWidth: 0 }),
        '--zen-anchor': id,
        '--zen-anchor-align': align,
        '--zen-anchor-offset': offset,
        '--zen-anchor-width': width ?? 'auto',
    } as CSSProperties;
}

interface AnchorOptions {
    align?: 'start' | 'end' | 'center';
    offset?: number;
    width?: 'match' | 'at-least';
}

/*
 * Browsers without CSS anchor positioning (Safari before 26, Chrome before 129,
 * which only had part of it) would leave a popup away from its trigger. There,
 * it's placed from the trigger's box instead, the way the CSS would: below it,
 * or above when there's no room below, aligned and sized as anchoredStyle says,
 * kept on screen, and following scrolls and resizes while open.
 */
let native: boolean | undefined;
const nativeAnchors = () => (native ??= typeof CSS !== 'undefined' && !!CSS.supports?.('position-area: block-end'));

/** Places the popup in `ref` against its trigger while it's open, where the browser can't. */
export function useAnchorFallback(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const popup = ref.current;
        if (!popup || nativeAnchors()) return;
        let frame = 0;
        const schedule = () => {
            frame ||= requestAnimationFrame(() => {
                frame = 0;
                placeAgainstTrigger(popup);
            });
        };
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
        const stop = () => {
            window.removeEventListener('scroll', schedule, { capture: true });
            window.removeEventListener('resize', schedule);
            resizes?.disconnect();
            cancelAnimationFrame(frame);
            frame = 0;
        };
        const onToggle = (e: Event) => {
            stop();
            if ((e as ToggleEvent).newState !== 'open') return;
            placeAgainstTrigger(popup);
            window.addEventListener('scroll', schedule, { capture: true, passive: true });
            window.addEventListener('resize', schedule, { passive: true });
            resizes?.observe(popup);
        };
        popup.addEventListener('toggle', onToggle);
        return () => {
            popup.removeEventListener('toggle', onToggle);
            stop();
        };
    }, [ref]);
}

const EDGE = 8; // kept this far inside the viewport

function placeAgainstTrigger(popup: HTMLElement) {
    const id = popup.style.getPropertyValue('--zen-anchor').trim();
    const trigger = id ? document.querySelector(`[data-zen-anchor="${id}"]`) : null;
    if (!trigger) return;
    const align = popup.style.getPropertyValue('--zen-anchor-align').trim() || 'start';
    const offset = Number(popup.style.getPropertyValue('--zen-anchor-offset')) || 0;
    const width = popup.style.getPropertyValue('--zen-anchor-width').trim();
    const t = trigger.getBoundingClientRect();
    const s = popup.style;
    // Where only part of anchor positioning exists, what there is would fight this placement.
    for (const prop of ['position-anchor', 'position-area', 'position-try-fallbacks']) s.removeProperty(prop);
    // Measured at the viewport's corner, so its own width isn't squeezed by where it was.
    s.inset = '0 auto auto 0';
    if (width === 'match') s.width = `${t.width}px`;
    if (width === 'at-least') s.minWidth = `${t.width}px`;
    const p = { width: popup.offsetWidth, height: popup.offsetHeight };
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const flip = t.bottom + offset + p.height > vh - EDGE && t.top - offset - p.height >= EDGE;
    const rtl = getComputedStyle(trigger).direction === 'rtl';
    const start = rtl ? t.right - p.width : t.left;
    const end = rtl ? t.left : t.right - p.width;
    const left = align === 'center' ? t.left + (t.width - p.width) / 2 : align === 'end' ? end : start;
    // Placed by the edge nearest the trigger; its margin (theme.css) is the gap, and slides as it opens.
    s.top = flip ? 'auto' : `${t.bottom}px`;
    s.bottom = flip ? `${vh - t.top}px` : 'auto';
    s.left = `${Math.max(EDGE, Math.min(left, vw - p.width - EDGE))}px`;
}

export interface AnchoredPopupOptions {
    /** Line the popup up with the trigger's start (default) or end edge, or centre it. */
    align?: 'start' | 'end' | 'center';
    /** Gap below the trigger, in px. */
    offset?: number;
    /** At least as wide as the trigger (e.g. a select's list). */
    matchWidth?: boolean;
    onOpenChange?: (open: boolean) => void;
}
