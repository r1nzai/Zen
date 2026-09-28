import { cx } from '@zen/utils/cx';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

/** Mount once near the root; `useToast()` works anywhere inside. */
export default function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const nextId = useRef(0);
    useEffect(() => setMounted(true), []);

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
            {mounted &&
                createPortal(
                    <section
                        aria-label="Notifications"
                        className="zen__toast-viewport fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex w-[calc(100vw-2rem)] flex-col-reverse gap-2.5 md:bottom-5 md:w-[24rem]"
                    >
                        {visible.map((t) => (
                            <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                        ))}
                    </section>,
                    document.body,
                )}
        </ToastContext.Provider>
    );
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

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <path d="m3.5 8.5 3 3 6-7" />
        </svg>
    );
}

function AlertIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <path d="M8 2.2 1.6 13.3h12.8L8 2.2Z" />
            <path d="M8 6.5v3M8 11.6v.1" />
        </svg>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <circle cx="8" cy="8" r="6.3" />
            <path d="M8 7.3v3.8M8 4.9v.1" />
        </svg>
    );
}
