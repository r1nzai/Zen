import { CSSProperties, useCallback, useEffect, useId, useRef, useState } from 'react';

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
        style: { anchorName: `--${id}` } as CSSProperties,
    };

    const popupProps = {
        ref: popupRef,
        id,
        popover: 'auto' as const,
        style: {
            positionAnchor: `--${id}`,
            // Below the trigger, lined up with its start (or end) edge; above it if there's no room below.
            positionArea: align === 'start' ? 'block-end span-inline-end' : 'block-end span-inline-start',
            positionTryFallbacks: 'flip-block',
            inset: 'auto',
            margin: `${offset}px 0`,
            ...(matchWidth && { minWidth: 'anchor-size(width)' }),
        } as CSSProperties,
    };

    return { id, open, setOpen, triggerProps, popupProps, popupRef };
}

export interface AnchoredPopupOptions {
    /** Line the popup up with the trigger's start (default) or end edge. */
    align?: 'start' | 'end';
    /** Gap below the trigger, in px. */
    offset?: number;
    /** At least as wide as the trigger (e.g. a select's list). */
    matchWidth?: boolean;
    onOpenChange?: (open: boolean) => void;
}
