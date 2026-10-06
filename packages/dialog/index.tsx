import XMarkMicro from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import Button, { ButtonProps } from '@zen/button';
import { useToastHost } from '@zen/toast';
import { useGraphicsMode } from '@zen/utils/graphics';
import { FLICK_SPEED, useSwipe } from '@zen/utils/swipe';
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
 * flows the user must finish (no Escape, outside-click or close button). With `side`,
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
    closeLabel = 'Close',
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
                <div className={cx('flex flex-col gap-2', dismissible && 'pe-8')}>
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
            {/* Last, so the dialog's own first field still gets focus when it opens. */}
            {dismissible && (
                <button
                    type="button"
                    aria-label={closeLabel}
                    onClick={() => onOpenChange?.(false)}
                    className={cx(
                        'text-muted-foreground hover:bg-tint/[0.07] hover:text-foreground focus-visible:ring-ring/50 absolute end-4 grid size-8 cursor-pointer place-items-center rounded-lg outline-hidden transition-colors focus-visible:ring-2',
                        // Level with the title (lower in a bottom sheet, under its grip).
                        side === 'bottom' ? 'top-7.5' : 'top-5.5',
                    )}
                >
                    <XMarkMicro className="size-4" />
                </button>
            )}
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

/** A swipe this far along (share of the sheet), or a flick, closes a sheet. */
const SWIPE_SHARE = 0.3;

/**
 * A sheet follows a finger swiping it back to its edge, and closes when let go
 * far enough along or flicked; otherwise it springs back.
 */
function useSheetSwipe(ref: RefObject<HTMLDialogElement | null>, side: DialogProps['side'], close: () => void) {
    const axis = side === 'bottom' ? 'y' : 'x';
    const sign = side === 'left' ? -1 : 1;
    const size = () => (axis === 'y' ? ref.current!.offsetHeight : ref.current!.offsetWidth);
    const reset = () => {
        ref.current?.style.removeProperty('--zen-swipe');
        ref.current?.style.removeProperty('--zen-swipe-progress');
    };
    useEffect(reset, [ref, side]);
    useSwipe(ref, side ? { axis, sign } : undefined, {
        move: (d) => {
            const moved = d > 0 ? d : d / 6;
            ref.current!.style.setProperty('--zen-swipe', axis === 'y' ? `0 ${moved}px` : `${moved * sign}px 0`);
            ref.current!.style.setProperty('--zen-swipe-progress', String(Math.max(0, Math.min(1, d / size()))));
        },
        release: (d, speed) => {
            if (d > size() * SWIPE_SHARE || (d > 0 && speed > FLICK_SPEED)) close();
            else reset();
        },
        cancel: reset,
        threshold: () => size() * SWIPE_SHARE,
    });
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
    /** The close button's accessible name. */
    closeLabel?: string;
}
