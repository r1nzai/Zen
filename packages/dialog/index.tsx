import { cx } from '@zen/utils/cx';
import Button, { ButtonProps } from '@zen/button';
import { useToastHost } from '@zen/toast';
import { useGraphicsMode } from '@zen/utils/graphics';
import {
    ComponentProps,
    createContext,
    MouseEvent,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
    useId,
    useRef,
} from 'react';

/** Closes the dialog; DialogClose calls it. */
const CloseContext = createContext<() => void>(() => {});

/**
 * Modal dialog on the native <dialog> element: focus is trapped and restored,
 * the page behind is inert, and Escape closes it. `dismissible={false}` is for
 * flows the user must finish (no Escape or outside-click close). With `side`,
 * it's a sheet that slides in from that edge: a bottom sheet on phones, a side
 * panel for filters or details. On touch, a sheet swipes back to its edge to close.
 */
export default function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    dismissible = true,
    initialFocus,
    size = 'md',
    side,
    className,
    role,
}: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    useSheetSwipe(ref, dismissible && open ? side : undefined, () => onOpenChange?.(false));
    useModal(ref, open, initialFocus);

    return (
        <dialog
            ref={ref}
            role={role}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            data-side={side}
            className={cx(
                'zen__dialog glass glass-blur glow-edge text-card-foreground bg-card/90! overflow-visible p-0',
                !side && 'm-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-xl',
                !side && (size === 'lg' ? 'w-[60rem]' : 'w-[28rem]'),
                side === 'bottom' && 'mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-2xl rounded-t-2xl',
                (side === 'left' || side === 'right') && 'my-0 h-dvh max-h-dvh w-[24rem] max-w-[calc(100vw-2.5rem)]',
                side === 'right' && 'mr-0 ml-auto rounded-l-2xl',
                side === 'left' && 'mr-auto ml-0 rounded-r-2xl',
                'backdrop:bg-[color:var(--backdrop-scrim,oklch(0_0_0/0.5))] backdrop:backdrop-blur-sm pointer-coarse:backdrop:backdrop-blur-none',
                className,
            )}
            onCancel={(e) => {
                // Escape: keep our `open` prop the source of truth.
                e.preventDefault();
                if (dismissible) onOpenChange?.(false);
            }}
            onClick={(e) => {
                // Only the backdrop hits the <dialog> itself; the content fills it edge to edge.
                if (e.target === e.currentTarget && dismissible) onOpenChange?.(false);
            }}
        >
            <div
                className={cx(
                    'flex flex-col gap-4 overflow-x-hidden overflow-y-auto p-6',
                    !side ? 'max-h-[calc(100dvh-2rem)]' : side === 'bottom' ? 'max-h-[85dvh] pt-3' : 'h-full',
                )}
            >
                {/* A bottom sheet's grip: says it came up from the edge. */}
                {side === 'bottom' && <div aria-hidden className="bg-tint/20 mx-auto h-1 w-10 shrink-0 rounded-full" />}
                <div className="flex flex-col gap-2">
                    <h2 id={titleId} className="text-lg font-semibold tracking-tight text-balance">
                        {title}
                    </h2>
                    {description && (
                        <p id={descriptionId} className="text-muted-foreground mt-0! text-sm leading-5">
                            {description}
                        </p>
                    )}
                </div>
                <CloseContext.Provider value={() => onOpenChange?.(false)}>{children}</CloseContext.Provider>
            </div>
        </dialog>
    );
}

/**
 * Opens and closes a <dialog> as a modal with `open`: focus moves in (to
 * `initialFocus` if given) and back after, the page behind is inert and
 * doesn't scroll, and toasts show inside it while it's open. For your own
 * modal on a <dialog> (Dialog and CommandPalette use it); give the element
 * the zen__dialog class for the open and close animation.
 */
export function useModal(
    ref: RefObject<HTMLDialogElement | null>,
    open: boolean,
    initialFocus?: RefObject<HTMLElement | null>,
): void {
    useGraphicsMode();
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            // Whether the page shows a scrollbar, measured before opening hides it (see theme.css).
            const root = document.documentElement;
            root.toggleAttribute('data-zen-scrollbar', window.innerWidth > root.clientWidth);
            // It grows out of what opened it, and shrinks back into it (theme.css). Set before
            // it opens: its first style is what it grows from.
            const trigger =
                document.activeElement !== document.body ? document.activeElement?.getBoundingClientRect() : null;
            const from = !!trigger && !dialog.dataset.side;
            dialog.toggleAttribute('data-zen-from', from);
            dialog.showModal();
            if (from) {
                const x = trigger.left + trigger.width / 2 - dialog.offsetLeft;
                const y = trigger.top + trigger.height / 2 - dialog.offsetTop;
                dialog.style.transformOrigin = `${Math.round(x)}px ${Math.round(y)}px`;
            }
            initialFocus?.current?.focus();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [ref, open, initialFocus]);
    // While open, toasts render in here: outside a modal dialog they'd be inert.
    useToastHost(ref, open);
}

/** A swipe this far (share of the sheet), or a flick this fast (px/ms), closes a sheet. */
const SWIPE_SHARE = 0.3;
const SWIPE_SPEED = 0.5;
/** A flick's speed is measured over this long (ms) before letting go. */
const FLICK_WINDOW = 100;
/** How far a finger moves before it counts as a swipe or not. */
const SLOP = 8;

/**
 * A sheet follows a finger swiping it back to its edge, and closes when let go
 * far enough along or flicked; otherwise it springs back. Only a deliberate
 * swipe: one finger, mostly along the closing direction, not starting in a text
 * field or on something that handles its own touch gestures (its touch-action
 * says so), and not while what's under the finger can still scroll that way.
 */
function useSheetSwipe(ref: RefObject<HTMLDialogElement | null>, side: DialogProps['side'], close: () => void) {
    const closeRef = useRef(close);
    useEffect(() => {
        closeRef.current = close;
    });
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        dialog.style.removeProperty('--zen-swipe');
        dialog.style.removeProperty('--zen-swipe-progress');
        if (!side) return;
        const axis = side === 'bottom' ? 'y' : 'x';
        const sign = side === 'left' ? -1 : 1;
        // Recent [time, distance] points: a flick's speed is over the last moments, as one event's step is uneven.
        let drag: { id: number; x: number; y: number; points: [number, number][]; on: boolean } | null = null;
        let swallowClick = false;

        const size = () => (axis === 'y' ? dialog.offsetHeight : dialog.offsetWidth);
        const along = (e: PointerEvent) => (axis === 'y' ? e.clientY - drag!.y : e.clientX - drag!.x) * sign;
        const across = (e: PointerEvent) => (axis === 'y' ? e.clientX - drag!.x : e.clientY - drag!.y);
        const show = (d: number) => {
            const moved = d > 0 ? d : d / 6;
            dialog.style.setProperty('--zen-swipe', axis === 'y' ? `0 ${moved}px` : `${moved * sign}px 0`);
            dialog.style.setProperty('--zen-swipe-progress', String(Math.max(0, Math.min(1, d / size()))));
        };
        const end = (closing: boolean) => {
            const swiped = drag?.on;
            drag = null;
            if (!swiped) return;
            delete dialog.dataset.swiping;
            swallowClick = true;
            if (closing) return closeRef.current();
            dialog.style.removeProperty('--zen-swipe');
            dialog.style.removeProperty('--zen-swipe-progress');
        };

        const onDown = (e: PointerEvent) => {
            swallowClick = false;
            if (e.pointerType !== 'touch') return;
            // A second finger (a pinch): not a swipe after all.
            if (!e.isPrimary) return end(false);
            if (startsElsewhere(e.target as Element, dialog, axis)) return;
            drag = { id: e.pointerId, x: e.clientX, y: e.clientY, points: [[e.timeStamp, 0]], on: false };
        };
        const onMove = (e: PointerEvent) => {
            if (!drag || e.pointerId !== drag.id) return;
            const d = along(e);
            if (!drag.on) {
                if (Math.hypot(d, across(e)) < SLOP) return;
                if (d <= 0 || Math.abs(across(e)) * 1.5 > d || scrollsFirst(e.target as Element, dialog, axis, sign)) {
                    drag = null;
                    return;
                }
                drag.on = true;
                dialog.dataset.swiping = '';
                dialog.setPointerCapture?.(e.pointerId);
            }
            drag.points = [...drag.points.filter(([t]) => e.timeStamp - t < FLICK_WINDOW), [e.timeStamp, d]];
            show(d);
        };
        const onUp = (e: PointerEvent) => {
            if (!drag || e.pointerId !== drag.id) return;
            const d = along(e);
            const [t0, d0] = drag.points.find(([t]) => e.timeStamp - t < FLICK_WINDOW) ?? [e.timeStamp, d];
            const speed = (d - d0) / Math.max(1, e.timeStamp - t0);
            end(e.type === 'pointerup' && (d > size() * SWIPE_SHARE || (d > 0 && speed > SWIPE_SPEED)));
        };
        // Once it's a swipe, the page mustn't scroll or zoom with it (pointer events can't stop that).
        const onTouchMove = (e: TouchEvent) => {
            if (drag?.on) e.preventDefault();
        };
        // A swipe that started on a button or link isn't a tap on it, nor on the backdrop.
        const onClick = (e: Event) => {
            if (!swallowClick) return;
            swallowClick = false;
            e.stopPropagation();
            e.preventDefault();
        };

        dialog.addEventListener('pointerdown', onDown);
        dialog.addEventListener('pointermove', onMove);
        dialog.addEventListener('pointerup', onUp);
        dialog.addEventListener('pointercancel', onUp);
        dialog.addEventListener('touchmove', onTouchMove, { passive: false });
        dialog.addEventListener('click', onClick, true);
        return () => {
            dialog.removeEventListener('pointerdown', onDown);
            dialog.removeEventListener('pointermove', onMove);
            dialog.removeEventListener('pointerup', onUp);
            dialog.removeEventListener('pointercancel', onUp);
            dialog.removeEventListener('touchmove', onTouchMove);
            dialog.removeEventListener('click', onClick, true);
            delete dialog.dataset.swiping;
        };
    }, [ref, side]);
}

/** A text field, or something that takes touch gestures in this axis itself (by its touch-action). */
function startsElsewhere(target: Element, dialog: HTMLElement, axis: 'x' | 'y'): boolean {
    if (target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true;
    const pans = axis === 'y' ? /pan-(y|up|down)/ : /pan-(x|left|right)/;
    for (let el: Element | null = target; el && el !== dialog; el = el.parentElement) {
        const action = getComputedStyle(el).touchAction;
        if (action && action !== 'auto' && action !== 'manipulation' && !pans.test(action)) return true;
    }
    return false;
}

/** Whether something under the finger would still scroll with this swipe. */
function scrollsFirst(target: Element, dialog: HTMLElement, axis: 'x' | 'y', sign: number): boolean {
    for (let el: Element | null = target; el; el = el === dialog ? null : el.parentElement) {
        const style = getComputedStyle(el);
        if (!/auto|scroll/.test(axis === 'y' ? style.overflowY : style.overflowX)) continue;
        const pos = axis === 'y' ? el.scrollTop : el.scrollLeft;
        const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
        if (max <= 0) continue;
        if (sign > 0 ? pos > 0 : pos < max - 1) return true;
    }
    return false;
}

/** The row of actions at the end of a dialog, right-aligned. */
export function DialogFooter({ className, ...rest }: ComponentProps<'div'>) {
    return <div className={cx('flex justify-end gap-2', className)} {...rest} />;
}

/**
 * A button that closes its dialog (after its own onClick, unless that calls
 * preventDefault). Takes every Button prop: variant, size, asChild…
 */
export function DialogClose({ onClick, ...rest }: ButtonProps) {
    const close = useContext(CloseContext);
    return (
        <Button
            {...rest}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                onClick?.(e);
                if (!e.defaultPrevented) close();
            }}
        />
    );
}

export interface DialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    dismissible?: boolean;
    /** Element to focus when the dialog opens (default: the first focusable one). */
    initialFocus?: RefObject<HTMLElement | null>;
    /** "lg" for dialogs holding a whole tool rather than a short form. */
    size?: 'md' | 'lg';
    /** Slide in from this edge as a sheet, instead of appearing in the middle. */
    side?: 'bottom' | 'left' | 'right';
    className?: string;
    role?: ComponentProps<'dialog'>['role'];
}
