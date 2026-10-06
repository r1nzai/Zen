import { RefObject, useEffect, useRef } from 'react';

/** A flick at least this fast (px/ms) counts, however short. */
export const FLICK_SPEED = 0.5;
/** A flick's speed is measured over this long (ms) before letting go. */
const FLICK_WINDOW = 100;
/** How far a finger moves before it counts as a swipe or not. */
const SLOP = 8;

export interface SwipeDirection {
    axis: 'x' | 'y';
    /** 1 for right or down, -1 for left or up. */
    sign: 1 | -1;
}

export interface SwipeHandlers {
    /** The finger moved; `d` is how far along the direction (negative once it's come back past the start). */
    move: (d: number) => void;
    /** Let go `d` along, moving at `speed` (px/ms) just before. */
    release: (d: number, speed: number) => void;
    /** Interrupted (a second finger, or the browser took the touch): put things back. */
    cancel: () => void;
}

/**
 * A finger swiping `ref` in `direction`. Only a deliberate swipe: one finger,
 * mostly along the direction, not starting in a text field or on something
 * that handles its own touch gestures (its touch-action says so), and not
 * while what's under the finger can still scroll that way. While swiping, the
 * element has data-swiping, the page doesn't scroll, and the click that ends
 * it is swallowed.
 */
export function useSwipe(
    ref: RefObject<HTMLElement | null>,
    direction: SwipeDirection | undefined,
    handlers: SwipeHandlers,
) {
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    });
    const axis = direction?.axis;
    const sign = direction?.sign;
    useEffect(() => {
        const el = ref.current;
        if (!el || !axis || !sign) return;
        // Recent [time, distance] points: a flick's speed is over the last moments, as one event's step is uneven.
        let drag: { id: number; x: number; y: number; points: [number, number][]; on: boolean } | null = null;
        let swallowClick = false;

        const along = (e: PointerEvent) => (axis === 'y' ? e.clientY - drag!.y : e.clientX - drag!.x) * sign;
        const across = (e: PointerEvent) => (axis === 'y' ? e.clientX - drag!.x : e.clientY - drag!.y);
        const stop = () => {
            const swiped = drag?.on;
            drag = null;
            if (!swiped) return false;
            delete el.dataset.swiping;
            swallowClick = true;
            return true;
        };

        const onDown = (e: PointerEvent) => {
            swallowClick = false;
            if (e.pointerType !== 'touch') return;
            // A second finger (a pinch): not a swipe after all.
            if (!e.isPrimary) {
                if (stop()) handlersRef.current.cancel();
                return;
            }
            if (startsElsewhere(e.target as Element, el, axis)) return;
            drag = { id: e.pointerId, x: e.clientX, y: e.clientY, points: [[e.timeStamp, 0]], on: false };
        };
        const onMove = (e: PointerEvent) => {
            if (!drag || e.pointerId !== drag.id) return;
            const d = along(e);
            if (!drag.on) {
                if (Math.hypot(d, across(e)) < SLOP) return;
                if (d <= 0 || Math.abs(across(e)) * 1.5 > d || scrollsFirst(e.target as Element, axis, sign)) {
                    drag = null;
                    return;
                }
                drag.on = true;
                el.dataset.swiping = '';
                el.setPointerCapture?.(e.pointerId);
            }
            drag.points = [...drag.points.filter(([t]) => e.timeStamp - t < FLICK_WINDOW), [e.timeStamp, d]];
            handlersRef.current.move(d);
        };
        const onUp = (e: PointerEvent) => {
            if (!drag || e.pointerId !== drag.id) return;
            const d = along(e);
            const [t0, d0] = drag.points.find(([t]) => e.timeStamp - t < FLICK_WINDOW) ?? [e.timeStamp, d];
            const speed = (d - d0) / Math.max(1, e.timeStamp - t0);
            if (!stop()) return;
            if (e.type === 'pointerup') handlersRef.current.release(d, speed);
            else handlersRef.current.cancel();
        };
        // Once it's a swipe, the page mustn't scroll or zoom with it (pointer events can't stop that).
        const onTouchMove = (e: TouchEvent) => {
            if (drag?.on) e.preventDefault();
        };
        // A swipe that started on a button or link isn't a tap on it.
        const onClick = (e: Event) => {
            if (!swallowClick) return;
            swallowClick = false;
            e.stopPropagation();
            e.preventDefault();
        };

        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('click', onClick, true);
        return () => {
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onUp);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('click', onClick, true);
            delete el.dataset.swiping;
        };
    }, [ref, axis, sign]);
}

/** A text field, or something that takes touch gestures in this axis itself (by its touch-action). */
function startsElsewhere(target: Element, root: HTMLElement, axis: 'x' | 'y'): boolean {
    if (target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true;
    const pans = axis === 'y' ? /pan-(y|up|down)/ : /pan-(x|left|right)/;
    for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
        const action = getComputedStyle(el).touchAction;
        if (action && action !== 'auto' && action !== 'manipulation' && !pans.test(action)) return true;
    }
    return false;
}

/** Whether something under the finger (up to the page) would still scroll with this swipe. */
function scrollsFirst(target: Element, axis: 'x' | 'y', sign: number): boolean {
    for (let el: Element | null = target; el; el = el.parentElement) {
        const overflow = getComputedStyle(el)[axis === 'y' ? 'overflowY' : 'overflowX'];
        // The page scrolls unless it's locked (as it is under a modal dialog).
        const page = el === el.ownerDocument.scrollingElement;
        if (page ? overflow === 'hidden' || overflow === 'clip' : !/auto|scroll/.test(overflow)) continue;
        const pos = axis === 'y' ? el.scrollTop : el.scrollLeft;
        const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
        if (max <= 0) continue;
        // Swiping one way scrolls content the other way.
        if (sign > 0 ? pos > 0 : pos < max - 1) return true;
    }
    return false;
}
