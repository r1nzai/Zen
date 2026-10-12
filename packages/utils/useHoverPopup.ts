import { FocusEvent, KeyboardEvent, PointerEvent, useCallback, useEffect, useId, useMemo, useRef } from 'react';

import { useAnchorFallback } from './useAnchoredPopup';

export type HoverPopup = ReturnType<typeof useHoverPopup>;

/**
 * A manual popover shown while its trigger is pointed at or has keyboard
 * focus (Tooltip's, HoverCard's): after `openDelay` for the pointer, hidden
 * `closeDelay` after it leaves (so it can move onto the popup), on blur and
 * on Escape. Spread `triggerProps` and `contentProps` from it.
 */
export function useHoverPopup(prefix: string, { openDelay = 0, closeDelay = 100 } = {}) {
    const id = `${prefix}-${useId().replace(/[^\w-]/g, '')}`;
    const ref = useRef<HTMLDivElement>(null);
    const timer = useRef(0);

    const set = useCallback((open: boolean) => {
        clearTimeout(timer.current);
        try {
            if (open) ref.current?.showPopover?.();
            else ref.current?.hidePopover?.();
        } catch {
            // Already so.
        }
    }, []);
    const after = useCallback(
        (open: boolean, delay: number) => {
            clearTimeout(timer.current);
            if (delay) timer.current = window.setTimeout(() => set(open), delay);
            else set(open);
        },
        [set],
    );
    useEffect(() => () => clearTimeout(timer.current), []);
    useAnchorFallback(ref);

    return useMemo(() => {
        const show = () => set(true);
        const hide = () => set(false);
        const hideSoon = () => after(false, closeDelay);
        // Focus moving between the trigger and the popup (a link in a hover card) keeps it.
        const leaving = (e: FocusEvent) => {
            const to = e.relatedTarget as Node | null;
            if (!to || !ref.current?.contains(to)) hide();
        };
        return {
            id,
            ref,
            show,
            hide,
            triggerProps: <E extends Element>(own: TriggerHandlers<E>) => ({
                onPointerEnter: (e: PointerEvent<E>) => {
                    own.onPointerEnter?.(e);
                    if (e.pointerType === 'mouse') after(true, openDelay);
                },
                onPointerLeave: (e: PointerEvent<E>) => {
                    own.onPointerLeave?.(e);
                    hideSoon();
                },
                onFocus: (e: FocusEvent<E>) => {
                    own.onFocus?.(e);
                    // Keyboard focus only: a click focusing the trigger shouldn't pop it open.
                    if (e.currentTarget.matches(':focus-visible')) show();
                },
                onBlur: (e: FocusEvent<E>) => {
                    own.onBlur?.(e);
                    leaving(e);
                },
                onKeyDown: (e: KeyboardEvent<E>) => {
                    own.onKeyDown?.(e);
                    if (e.key === 'Escape') hide();
                },
            }),
            contentProps: (own: TriggerHandlers<HTMLDivElement>) => ({
                onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
                    own.onPointerEnter?.(e);
                    show();
                },
                onPointerLeave: (e: PointerEvent<HTMLDivElement>) => {
                    own.onPointerLeave?.(e);
                    hideSoon();
                },
                onBlur: (e: FocusEvent<HTMLDivElement>) => {
                    own.onBlur?.(e);
                    if (!e.currentTarget.contains(e.relatedTarget)) hide();
                },
                onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                    own.onKeyDown?.(e);
                    if (e.key === 'Escape') hide();
                },
            }),
        };
    }, [id, set, after, openDelay, closeDelay]);
}

interface TriggerHandlers<E extends Element> {
    onPointerEnter?: (e: PointerEvent<E>) => void;
    onPointerLeave?: (e: PointerEvent<E>) => void;
    onFocus?: (e: FocusEvent<E>) => void;
    onBlur?: (e: FocusEvent<E>) => void;
    onKeyDown?: (e: KeyboardEvent<E>) => void;
}
