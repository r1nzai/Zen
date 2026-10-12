import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle, anchorFor } from '@zen/utils/useAnchoredPopup';
import { type HoverPopup, useHoverPopup } from '@zen/utils/useHoverPopup';
import { ComponentProps, createContext, ReactNode, useContext } from 'react';

const TooltipContext = createContext<HoverPopup | null>(null);

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
    const tip = useHoverPopup('zen__tooltip');
    return <TooltipContext.Provider value={tip}>{children}</TooltipContext.Provider>;
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
        ...anchorFor(tip.id),
        style: { ...anchorFor(tip.id).style, ...style },
        ...tip.triggerProps<HTMLButtonElement>({ onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown }),
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
            {...tip.contentProps({ onPointerEnter, onPointerLeave })}
            style={{ ...anchoredStyle(tip.id, { align, offset, width: 'at-least' }), ...style }}
            className={cx('zen__popover fixed z-50 overflow-visible p-0', POPUP, className)}
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
