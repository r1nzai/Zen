import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { createContext, CSSProperties, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
    leaving?: boolean;
}

const DEFAULT_TIMEOUT = 5000;
const LIMIT = 3;
const EXIT_MS = 300;

const ToastContext = createContext<((title: string, options?: ToastOptions) => number) | null>(null);

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

/** Mount once near the root; `useToast()` works anywhere inside. */
export default function ToastProvider({ children, offset, viewportClassName }: ToastProviderProps) {
    useGraphicsMode();
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    // Where the toasts render: the page, or the open modal dialog (see below).
    const [host, setHost] = useState<HTMLElement | null>(null);
    const nextId = useRef(0);

    /*
     * Toasts sit in the browser's top layer (a manual popover), so they show above
     * dialogs instead of dimmed behind them. A modal dialog also makes everything
     * outside it inert, top layer included, so while one is open the toasts render
     * inside it: still positioned against the viewport (the top layer ignores the
     * dialog's box), and clickable.
     */
    useEffect(() => {
        let current: HTMLElement | null = null;
        const isModal = (d: HTMLDialogElement) => {
            try {
                return d.matches(':modal');
            } catch {
                return true; // No :modal support (e.g. jsdom): any open dialog.
            }
        };
        const pick = () => {
            const modals = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].filter(isModal);
            current = modals.at(-1) ?? document.body;
            setHost(current);
        };
        pick();
        // A dialog opening or closing changes its open attribute; one removed from the
        // page while open (unmounted by React) doesn't, so removals re-pick too, but only
        // when they took the current host with them.
        const watch = new MutationObserver((records) => {
            if (records.some((r) => r.type === 'attributes') || !current?.isConnected) pick();
        });
        watch.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['open'],
        });
        return () => watch.disconnect();
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), EXIT_MS);
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

    const visible = toasts.slice(-LIMIT);

    return (
        <ToastContext.Provider value={add}>
            {children}
            {host &&
                createPortal(
                    <section
                        ref={showInTopLayer}
                        popover="manual"
                        aria-label="Notifications"
                        className={cx(
                            // The popover's own defaults (centred, bordered, opaque) reset to a plain corner column.
                            'zen__toast-viewport fixed top-auto right-4 bottom-[calc(var(--zen-toast-offset,1rem)+env(safe-area-inset-bottom))] left-auto z-50 m-0 flex w-[calc(100vw-2rem)] flex-col-reverse gap-2.5 overflow-visible border-0 bg-transparent p-0 text-inherit md:bottom-5 md:w-[24rem]',
                            viewportClassName,
                        )}
                        style={offset ? ({ '--zen-toast-offset': offset } as CSSProperties) : undefined}
                    >
                        {visible.map((t) => (
                            <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                        ))}
                    </section>,
                    host,
                )}
        </ToastContext.Provider>
    );
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
        glow: 'shadow-[0_18px_50px_-18px_oklch(var(--glow)/0.55)]',
    },
    error: {
        icon: AlertIcon,
        ring: 'border-destructive/40',
        badge: 'bg-destructive/15 text-destructive',
        bar: 'bg-destructive',
        glow: 'shadow-[0_18px_50px_-18px_oklch(var(--destructive)/0.55)]',
    },
    info: {
        icon: InfoIcon,
        ring: 'border-tint/10',
        badge: 'bg-tint/[0.08] text-foreground',
        bar: 'bg-muted-foreground',
        glow: 'shadow-[var(--toast-shadow)]',
    },
} as const;

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
    const tone = TONE[toast.tone] ?? TONE.info;
    const Icon = tone.icon;
    const [paused, setPaused] = useState(false);
    const remaining = useRef(toast.timeout);

    // Counts down only while not hovered, like the timer bar.
    useEffect(() => {
        if (!toast.timeout || paused || toast.leaving) return;
        const started = Date.now();
        const timer = setTimeout(onDismiss, remaining.current);
        return () => {
            clearTimeout(timer);
            remaining.current -= Date.now() - started;
        };
    }, [paused, toast.timeout, toast.leaving, onDismiss]);

    return (
        <div
            role={toast.tone === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={cx(
                'zen__toast group glass glass-blur text-card-foreground relative flex items-start gap-3 overflow-hidden rounded-2xl border p-3.5 pr-10 select-none',
                'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                'starting:translate-y-3 starting:scale-[0.97] starting:opacity-0',
                toast.leaving && 'translate-x-6 opacity-0',
                tone.ring,
                tone.glow,
            )}
        >
            <span className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', tone.badge)} aria-hidden>
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
                            onDismiss();
                        }}
                        className="border-tint/10 bg-tint/[0.06] hover:bg-tint/[0.12] focus-visible:ring-ring/50 mt-2 self-start rounded-lg border px-3 py-1 text-xs font-medium outline-hidden transition-colors focus-visible:ring-2"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismiss}
                className="text-muted-foreground hover:bg-tint/[0.07] hover:text-foreground focus-visible:ring-ring/50 absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg outline-hidden transition-colors focus-visible:ring-2"
            >
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="size-3.5"
                    aria-hidden
                >
                    <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
            </button>
            {/* Time left before it goes away; pauses while hovered, like the toast itself. */}
            {toast.timeout > 0 && (
                <span
                    aria-hidden
                    className={cx(
                        'zen__toast-timer absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-60 group-hover:[animation-play-state:paused]',
                        tone.bar,
                    )}
                    style={{ animationDuration: `${toast.timeout}ms` }}
                />
            )}
        </div>
    );
}
