import XMarkMicro from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import {
    createContext,
    CSSProperties,
    PointerEvent,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import { AlertIcon, CheckIcon, InfoIcon } from '@zen/utils/status-icons';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
    description?: string;
    tone?: ToastTone;
    /** e.g. { label: "Undo", onClick } */
    action?: { label: string; onClick: () => void };
    /** Milliseconds before it goes away; 0 keeps it until dismissed. */
    timeout?: number;
}

interface ToastItem extends ToastOptions {
    id: number;
    title: string;
    tone: ToastTone;
    timeout: number;
    leaving?: 'fade' | 'swipe';
}

const DEFAULT_TIMEOUT = 5000;
/** Toasts shown in the deck; older ones wait, hidden, behind them. */
const LIMIT = 3;
const EXIT_MS = 300;
/** How far each card behind peeks out above the one in front, and how much smaller it is. */
const PEEK = 14;
const SHRINK = 0.05;
/** Space between toasts once the deck fans out. */
const GAP = 10;
/** A drag this far (px), or this fast (px/ms), throws a toast away. */
const SWIPE_DISTANCE = 60;
const SWIPE_SPEED = 0.45;

const ToastContext = createContext<((title: string, options?: ToastOptions) => number) | null>(null);

/** Registers an element the toasts should render in; returns the unregister function. */
const ToastHostContext = createContext<((el: HTMLElement) => () => void) | null>(null);

export interface ToastProviderProps {
    children: ReactNode;
    /**
     * Gap between the toasts and the bottom of the screen on phones (a CSS
     * length, default 1rem), e.g. "5.5rem" to clear a bottom tab bar.
     */
    offset?: string;
    /** Classes for the column the toasts stack in (position, width…). */
    viewportClassName?: string;
}

/**
 * Mount once near the root; `useToast()` works anywhere inside. Toasts stack in
 * a deck in the corner, newest in front with up to two peeking out behind; it
 * fans out while pointed at or focused, and the countdowns wait meanwhile.
 * Swipe a toast right to dismiss it.
 */
export default function ToastProvider({ children, offset, viewportClassName }: ToastProviderProps) {
    useGraphicsMode();
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);
    // Per toast, kept here so they survive moving between hosts (which remounts them):
    // its countdown, and whether it has already made its entrance.
    const clocks = useRef(new Map<number, Clock>());
    const entered = useRef(new Set<number>());

    /*
     * Toasts sit in the browser's top layer (a manual popover), so they show above
     * dialogs instead of dimmed behind them. A modal dialog also makes everything
     * outside it inert, top layer included, so the toasts must render inside the open
     * dialog to stay clickable: dialogs register themselves as hosts while open (Zen's
     * Dialog does; others use useToastHost), and the latest one wins. Inside a dialog
     * they're still placed against the viewport, as the top layer ignores the dialog's box.
     */
    const [hosts, setHosts] = useState<HTMLElement[]>([]);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const registerHost = useCallback((el: HTMLElement) => {
        setHosts((h) => [...h, el]);
        return () => setHosts((h) => h.filter((x) => x !== el));
    }, []);
    const host = hosts.at(-1) ?? (mounted ? document.body : null);

    // Each toast's natural height, so the deck can fan them out and match the card in front.
    const [heights, setHeights] = useState<Record<number, number>>({});
    const setHeight = useCallback(
        (id: number, h: number) => setHeights((hs) => (hs[id] === h ? hs : { ...hs, [id]: h })),
        [],
    );

    // The deck fans out while pointed at or focused, and the countdowns wait meanwhile.
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    // F8 moves focus to the notifications (while there are any), as in Radix and native apps:
    // a keyboard user can reach a toast's action or close button from anywhere.
    const viewport = useRef<HTMLElement | null>(null);
    const setViewport = useCallback((el: HTMLElement | null) => {
        viewport.current = el;
        showInTopLayer(el);
    }, []);
    useEffect(() => {
        const onKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'F8' || !viewport.current?.querySelector('.zen__toast:not([inert])')) return;
            e.preventDefault();
            viewport.current.focus();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    const dismiss = useCallback((id: number, how: 'fade' | 'swipe' = 'fade') => {
        setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: how } : t)));
        setTimeout(() => {
            setToasts((ts) => {
                const rest = ts.filter((t) => t.id !== id);
                // The deck is gone from under the pointer, so no leave event will come.
                if (!rest.length) setHovered(false);
                return rest;
            });
            setHeights(({ [id]: _gone, ...hs }) => hs); // eslint-disable-line @typescript-eslint/no-unused-vars
            clocks.current.delete(id);
            entered.current.delete(id);
        }, EXIT_MS);
    }, []);

    const add = useCallback((title: string, { description, tone = 'info', action, timeout }: ToastOptions = {}) => {
        const id = nextId.current++;
        const item: ToastItem = {
            id,
            title,
            description,
            tone,
            action,
            timeout: timeout ?? (action ? 10_000 : DEFAULT_TIMEOUT),
        };
        setToasts((ts) => [...ts, item]);
        return id;
    }, []);

    /*
     * The deck, newest in front. A toast's place counts the staying toasts newer than
     * it, so one on its way out keeps its place while the rest close up at once.
     */
    const staying = toasts.filter((t) => !t.leaving);
    const expanded = (hovered || focused) && staying.length > 0;
    const front = staying.at(-1);
    const frontHeight = front ? heights[front.id] : undefined;
    const shown = staying.slice(-LIMIT);
    const deckHeight = expanded
        ? shown.reduce((sum, t) => sum + (heights[t.id] ?? 0), 0) + GAP * (shown.length - 1)
        : (frontHeight ?? 0) + PEEK * (shown.length - 1);
    const layout = (t: ToastItem): Layout => {
        const newer = staying.filter((o) => o.id > t.id);
        const index = newer.length;
        return {
            index,
            front: index === 0,
            hidden: index >= LIMIT,
            y: expanded
                ? -(newer.reduce((sum, o) => sum + (heights[o.id] ?? 0), 0) + GAP * index)
                : -PEEK * Math.min(index, LIMIT - 1),
            scale: expanded ? 1 : 1 - SHRINK * Math.min(index, LIMIT - 1),
            // Collapsed, the cards behind take the front one's size, so only their edges show.
            height: !expanded && index > 0 ? frontHeight : undefined,
        };
    };

    return (
        <ToastContext.Provider value={add}>
            <ToastHostContext.Provider value={registerHost}>{children}</ToastHostContext.Provider>
            {host &&
                createPortal(
                    <section
                        ref={setViewport}
                        popover="manual"
                        tabIndex={-1}
                        aria-label="Notifications (F8)"
                        data-expanded={expanded || undefined}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onFocus={() => setFocused(true)}
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
                        }}
                        className={cx(
                            // The popover's own defaults (centred, bordered, opaque) reset to a plain corner box.
                            'zen__toast-viewport fixed top-auto right-4 bottom-[calc(var(--zen-toast-offset,1rem)+env(safe-area-inset-bottom))] left-auto z-50 m-0 w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 text-inherit outline-hidden md:bottom-5 md:w-[24rem]',
                            // Its height follows the deck, so hovering the gaps between fanned-out toasts keeps it open.
                            'ease-out-soft transition-[height] duration-300',
                            viewportClassName,
                        )}
                        style={{
                            height: deckHeight,
                            ...(offset && ({ '--zen-toast-offset': offset } as CSSProperties)),
                        }}
                    >
                        {toasts.map((t, i) => (
                            <Toast
                                key={t.id}
                                toast={t}
                                layout={layout(t)}
                                z={i + 1}
                                paused={expanded}
                                onDismiss={dismiss}
                                onHeight={setHeight}
                                clocks={clocks.current}
                                entered={entered.current}
                            />
                        ))}
                    </section>,
                    host,
                )}
        </ToastContext.Provider>
    );
}

/**
 * Makes an element (a modal dialog, while it's open) the place toasts render, so
 * they stay above it and clickable. Zen's Dialog does this itself; call it for
 * other modal dialogs. Does nothing outside a ToastProvider.
 */
export function useToastHost(ref: RefObject<HTMLElement | null>, active: boolean) {
    const register = useContext(ToastHostContext);
    useEffect(() => {
        const el = ref.current;
        if (!register || !active || !el) return;
        return register(el);
    }, [register, active, ref]);
}

/** Shows the toast column in the top layer as soon as it mounts (where the Popover API exists). */
function showInTopLayer(el: HTMLElement | null) {
    if (!el?.showPopover) return;
    try {
        el.showPopover();
    } catch {
        // Already showing.
    }
}

/** Returns `toast(title, options)`, which shows a toast and returns its id. */
export function useToast() {
    const add = useContext(ToastContext);
    if (!add) throw new Error('useToast() needs a <ToastProvider> above it');
    return add;
}

const TONE = {
    success: {
        icon: CheckIcon,
        ring: 'border-primary/30',
        badge: 'bg-primary/15 text-primary',
        bar: 'bg-primary',
        glow: 'shadow-[0_18px_50px_-18px_oklch(var(--glow)/calc(0.55*var(--glow-k)))]',
    },
    error: {
        icon: AlertIcon,
        ring: 'border-destructive/40',
        badge: 'bg-destructive/10 text-destructive',
        bar: 'bg-destructive',
        glow: 'shadow-[0_18px_50px_-18px_oklch(var(--destructive)/calc(0.55*var(--glow-k)))]',
    },
    info: {
        icon: InfoIcon,
        ring: 'border-tint/10',
        badge: 'bg-tint/[0.08] text-foreground',
        bar: 'bg-muted-foreground',
        glow: 'shadow-[var(--toast-shadow)]',
    },
} as const;

/** A toast's countdown: time already used up, and when the current stretch began (null while paused). */
interface Clock {
    spent: number;
    since: number | null;
}

/** Where a toast sits in the deck. */
interface Layout {
    /** 0 for the newest (in front), counting back. */
    index: number;
    front: boolean;
    /** Waiting behind the shown ones. */
    hidden: boolean;
    /** Lift from the bottom of the deck, in px. */
    y: number;
    scale: number;
    /** Set on cards behind the front one while collapsed. */
    height?: number;
}

function Toast({
    toast,
    layout,
    z,
    paused,
    onDismiss,
    onHeight,
    clocks,
    entered,
}: {
    toast: ToastItem;
    layout: Layout;
    z: number;
    paused: boolean;
    /** The provider's, the same function every render, so the countdown isn't restarted by others coming and going. */
    onDismiss: (id: number, how?: 'fade' | 'swipe') => void;
    onHeight: (id: number, height: number) => void;
    clocks: Map<number, Clock>;
    entered: Set<number>;
}) {
    const tone = TONE[toast.tone] ?? TONE.info;
    const Icon = tone.icon;
    const ref = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    // Its entrance plays once, not again when it moves to another host.
    const [firstShow] = useState(() => !entered.has(toast.id));
    useEffect(() => {
        if (ref.current?.isConnected) entered.add(toast.id);
    }, [entered, toast.id]);
    /*
     * Read out by a live region of its own, empty when it mounts and filled a frame
     * later: screen readers miss text that arrives together with its live region.
     * Once: not again when it moves to another host.
     */
    const [announced, setAnnounced] = useState(false);
    useEffect(() => {
        if (!firstShow) return;
        let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setAnnounced(true))));
        return () => cancelAnimationFrame(frame);
    }, [firstShow]);
    if (!clocks.has(toast.id)) clocks.set(toast.id, { spent: 0, since: null });
    const clock = clocks.get(toast.id)!;
    // Time used when this copy mounted, including a stretch still running (a move renders
    // the new copy before the old one's countdown stops). Fixed from then on: the timer
    // bar's animation runs from it, and a changed delay would make the bar jump.
    const [usedAtMount] = useState(() => clock.spent + (clock.since === null ? 0 : Date.now() - clock.since));

    // Its natural height (the body's; the card itself may be squeezed to the front one's).
    useEffect(() => {
        const el = body.current;
        if (!el) return;
        const report = () => onHeight(toast.id, el.offsetHeight);
        report();
        const observer = new ResizeObserver(report);
        observer.observe(el);
        return () => observer.disconnect();
    }, [onHeight, toast.id]);

    // Counts down only while the deck is closed, like the timer bar; the provider keeps
    // the clock, so moving between hosts doesn't restart it.
    useEffect(() => {
        if (!toast.timeout || paused || toast.leaving) return;
        clock.since = Date.now();
        const timer = setTimeout(() => onDismiss(toast.id), Math.max(0, toast.timeout - clock.spent));
        return () => {
            clearTimeout(timer);
            if (clock.since !== null) clock.spent += Date.now() - clock.since;
            clock.since = null;
        };
    }, [paused, toast.id, toast.timeout, toast.leaving, onDismiss, clock]);

    /*
     * Swipe right to throw it away. The drag moves the card through a CSS variable,
     * outside React, and the transition is off meanwhile so it follows the finger.
     * Dragging left only gives a little, as there's nowhere to go.
     */
    // Where it started, and the latest move, whose speed decides a flick.
    const drag = useRef<{ x: number; dx: number; t: number; speed: number } | null>(null);
    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (toast.leaving || e.button !== 0 || (e.target as Element).closest('button')) return;
        drag.current = { x: e.clientX, dx: 0, t: e.timeStamp, speed: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.dataset.swiping = '';
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        const d = drag.current;
        const dx = e.clientX - d.x;
        d.speed = (dx - d.dx) / Math.max(1, e.timeStamp - d.t);
        d.dx = dx;
        d.t = e.timeStamp;
        e.currentTarget.style.setProperty('--zen-swipe', `${dx > 0 ? dx : dx / 6}px`);
    };
    const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        delete e.currentTarget.dataset.swiping;
        if (d.dx > SWIPE_DISTANCE || (d.dx > 0 && d.speed > SWIPE_SPEED)) onDismiss(toast.id, 'swipe');
        else e.currentTarget.style.setProperty('--zen-swipe', '0px');
    };

    return (
        <>
            <div
                ref={ref}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                // Announced by the live region beside it instead (see above).
                aria-live="off"
                data-front={layout.front || undefined}
                data-behind={(!layout.front && layout.height !== undefined) || undefined}
                inert={layout.hidden || !!toast.leaving}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={cx(
                    'zen__toast group glass glass-blur glow-edge text-card-foreground absolute! inset-x-0 bottom-0 origin-bottom touch-pan-y overflow-hidden rounded-2xl border select-none',
                    'ease-out-soft transition-[transform,translate,opacity,height] duration-400 data-swiping:transition-none',
                    firstShow && 'starting:translate-y-full starting:opacity-0',
                    layout.hidden && 'opacity-0',
                    toast.leaving === 'fade' && 'translate-y-[35%] opacity-0',
                    toast.leaving === 'swipe' && 'translate-x-full opacity-0',
                    tone.ring,
                    tone.glow,
                )}
                style={{
                    zIndex: z,
                    height: layout.height,
                    transform: `translateX(var(--zen-swipe, 0px)) translateY(${layout.y}px) scale(${layout.scale})`,
                }}
            >
                {/* Faded out on the cards behind, whose edges are all that show. */}
                <div
                    ref={body}
                    className="flex items-start gap-3 p-3.5 pr-10 transition-opacity duration-300 group-data-behind:opacity-0"
                >
                    <span
                        className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', tone.badge)}
                        aria-hidden
                    >
                        <Icon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                        <div className="text-sm font-semibold">{toast.title}</div>
                        {toast.description && (
                            <div className="text-muted-foreground text-sm leading-5">{toast.description}</div>
                        )}
                        {toast.action && (
                            <button
                                type="button"
                                onClick={() => {
                                    toast.action?.onClick();
                                    onDismiss(toast.id);
                                }}
                                className="border-tint/10 bg-tint/[0.06] hover:bg-tint/[0.12] focus-visible:ring-ring/50 mt-2 cursor-pointer self-start rounded-lg border px-3 py-1 text-xs font-medium outline-hidden transition-colors focus-visible:ring-2"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="Dismiss"
                        onClick={() => onDismiss(toast.id)}
                        className="text-muted-foreground hover:bg-tint/[0.07] hover:text-foreground focus-visible:ring-ring/50 absolute top-2.5 right-2.5 grid size-7 cursor-pointer place-items-center rounded-lg outline-hidden transition-colors focus-visible:ring-2"
                    >
                        <XMarkMicro className="size-3.5" />
                    </button>
                </div>
                {/* Time left before it goes away; waits while the deck is open, like the toast itself. */}
                {toast.timeout > 0 && (
                    <span
                        aria-hidden
                        className={cx(
                            'zen__toast-timer absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-60 transition-opacity group-data-behind:opacity-0',
                            tone.bar,
                        )}
                        // Picks up where it was after a move between hosts.
                        style={{
                            animationDuration: `${toast.timeout}ms`,
                            animationDelay: `${-usedAtMount}ms`,
                            animationPlayState: paused ? 'paused' : undefined,
                        }}
                    />
                )}
            </div>
            <span className="sr-only" aria-live={toast.tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
                {announced && [toast.title, toast.description].filter(Boolean).join('. ')}
            </span>
        </>
    );
}
