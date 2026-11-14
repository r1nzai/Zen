import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle, anchorFor, useAnchorFallback } from '@zen/utils/useAnchoredPopup';
import { type HoverPopup, useHoverPopup } from '@zen/utils/useHoverPopup';
import { ComponentProps, createContext, ReactNode, useContext, useRef } from 'react';

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

/**
 * The hint: glass, below the trigger (above it if there's no room), centred on
 * it by default. `side="beside"` puts it after the trigger instead (before it
 * if there's no room), as for the icons of a collapsed sidebar.
 */
export function TooltipContent({
    side = 'below',
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
    const ref = useRef<HTMLDivElement>(null);
    useAnchorFallback(ref);
    return (
        <div
            {...rest}
            ref={ref}
            id={tip.id}
            role="tooltip"
            // Manual: it doesn't close other popovers, and the trigger decides when it shows.
            popover="manual"
            {...tip.contentProps({ onPointerEnter, onPointerLeave })}
            // Beside, the gap is across (theme.css), and it slides out sideways.
            data-zen-beside={side === 'beside' ? '' : undefined}
            style={{
                ...anchoredStyle(tip.id, { side, align, offset, width: side === 'beside' ? undefined : 'at-least' }),
                ...(side === 'beside' && { marginBlock: 0 }),
                ...style,
            }}
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
    /** Below the trigger (default; above if there's no room), or beside it (after it; before if there's no room). */
    side?: 'below' | 'beside';
    /** Centred on the trigger (default), or lined up with its start or end edge (beside: its top or bottom). */
    align?: 'start' | 'end' | 'center';
    /** Gap from the trigger, in px. */
    offset?: number;
}
