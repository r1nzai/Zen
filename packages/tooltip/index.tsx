import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle } from '@zen/utils/useAnchoredPopup';
import {
    ComponentProps,
    createContext,
    CSSProperties,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
} from 'react';

interface TooltipContextValue {
    id: string;
    ref: RefObject<HTMLDivElement | null>;
    show: () => void;
    /** Hides after a moment, so the pointer can move onto the tooltip. */
    hideSoon: () => void;
    hide: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltip(part: string) {
    const ctx = useContext(TooltipContext);
    if (!ctx) throw new Error(`<${part}> must be inside <Tooltip>`);
    return ctx;
}

/**
 * A short hint shown while the pointer is over its trigger or the trigger has
 * keyboard focus; Escape hides it. The trigger is described by it for screen
 * readers. Put a TooltipTrigger and a TooltipContent inside. For anything to
 * click or fill in, use Popover.
 */
export default function Tooltip({ children }: { children?: ReactNode }) {
    useGraphicsMode();
    const id = `zen__tooltip-${useId().replace(/[^\w-]/g, '')}`;
    const ref = useRef<HTMLDivElement>(null);
    const timer = useRef(0);

    const show = useCallback(() => {
        clearTimeout(timer.current);
        try {
            ref.current?.showPopover?.();
        } catch {
            // Already showing.
        }
    }, []);
    const hide = useCallback(() => {
        clearTimeout(timer.current);
        try {
            ref.current?.hidePopover?.();
        } catch {
            // Already hidden.
        }
    }, []);
    const hideSoon = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = window.setTimeout(hide, 100);
    }, [hide]);
    useEffect(() => () => clearTimeout(timer.current), []);

    const value = useMemo(() => ({ id, ref, show, hide, hideSoon }), [id, show, hide, hideSoon]);
    return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

/** What the tooltip describes: a button by default. With `asChild`, your own focusable element instead. */
export function TooltipTrigger({
    asChild,
    style,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onKeyDown,
    children,
    ...rest
}: TooltipTriggerProps) {
    const tip = useTooltip('TooltipTrigger');
    const props = {
        'aria-describedby': tip.id,
        ...rest,
        style: { anchorName: `--${tip.id}`, ...style } as CSSProperties,
        onPointerEnter: (e: React.PointerEvent<HTMLButtonElement>) => {
            onPointerEnter?.(e);
            if (e.pointerType === 'mouse') tip.show();
        },
        onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
            onPointerLeave?.(e);
            tip.hideSoon();
        },
        onFocus: (e: React.FocusEvent<HTMLButtonElement>) => {
            onFocus?.(e);
            // Keyboard focus only: a click focusing the button shouldn't pop a hint.
            if (e.currentTarget.matches(':focus-visible')) tip.show();
        },
        onBlur: (e: React.FocusEvent<HTMLButtonElement>) => {
            onBlur?.(e);
            tip.hide();
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
            onKeyDown?.(e);
            if (e.key === 'Escape') tip.hide();
        },
    };
    if (asChild) return <Slot {...(props as unknown as ComponentProps<'a'>)}>{children}</Slot>;
    return (
        <button type="button" {...props}>
            {children}
        </button>
    );
}

/** The hint: glass, below the trigger (above it if there's no room), centred on it by default. */
export function TooltipContent({
    align = 'center',
    offset = 5,
    className,
    style,
    onPointerEnter,
    onPointerLeave,
    children,
    ...rest
}: TooltipContentProps) {
    const tip = useTooltip('TooltipContent');
    return (
        <div
            {...rest}
            ref={tip.ref}
            id={tip.id}
            role="tooltip"
            // Manual: it doesn't close other popovers, and the trigger decides when it shows.
            popover="manual"
            onPointerEnter={(e) => {
                onPointerEnter?.(e);
                tip.show();
            }}
            onPointerLeave={(e) => {
                onPointerLeave?.(e);
                tip.hideSoon();
            }}
            style={{ ...anchoredStyle(tip.id, { align, offset }), ...style }}
            className={cx(
                'zen__popover fixed z-50 w-[anchor-size(width)] min-w-max overflow-visible p-0',
                POPUP,
                className,
            )}
        >
            {children}
        </div>
    );
}

export interface TooltipTriggerProps extends ComponentProps<'button'> {
    /** Put the trigger's props on your own focusable element instead of rendering a button. */
    asChild?: boolean;
}

export interface TooltipContentProps extends ComponentProps<'div'> {
    /** Centred on the trigger (default), or lined up with its start or end edge. */
    align?: 'start' | 'end' | 'center';
    /** Gap from the trigger, in px. */
    offset?: number;
}
