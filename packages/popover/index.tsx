import Button, { ButtonProps } from '@zen/button';
import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, createContext, MouseEvent, ReactNode, useContext, useEffect } from 'react';

type Popup = ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;

const PopoverContext = createContext<Popup | null>(null);

function usePopover(part: string) {
    const popup = useContext(PopoverContext);
    if (!popup) throw new Error(`<${part}> must be inside <Popover>`);
    return popup;
}

/**
 * A panel that opens from a button: a small form, a profile card, settings. A
 * native popover, so outside clicks and Escape close it and focus returns to
 * the button. Put a PopoverTrigger and a PopoverContent inside. Opens and closes
 * on its own, or follows `open` (with `onOpenChange` to hear the user close it).
 * For a hint on hover or focus, use Tooltip; for a list of actions, Menu.
 */
export default function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
    useGraphicsMode();
    const popup = useAnchoredPopup<HTMLDivElement>({ onOpenChange });
    const { setOpen } = popup;

    useEffect(() => {
        if (open !== undefined) setOpen(open);
    }, [open, setOpen]);
    useEffect(() => {
        // Only when it first appears.
        if (defaultOpen) setOpen(true);
    }, []);

    return <PopoverContext.Provider value={popup}>{children}</PopoverContext.Provider>;
}

/** The button that opens and closes the popover. With `asChild`, your own button (e.g. a Button) instead. */
export function PopoverTrigger({ asChild, style, children, ...rest }: PopoverTriggerProps) {
    const popup = usePopover('PopoverTrigger');
    const props = {
        ...popup.triggerProps,
        'aria-haspopup': 'dialog' as const,
        ...rest,
        style: { ...popup.triggerProps.style, ...style },
    };
    if (asChild) return <Slot {...(props as ComponentProps<'a'>)}>{children}</Slot>;
    return (
        <button type="button" {...props} className={cx('cursor-pointer', props.className)}>
            {children}
        </button>
    );
}

/**
 * The panel: glass, below the trigger (above it if there's no room), centred on
 * it by default. A dialog to assistive tech; give it `aria-label` or a heading
 * it's labelled by when it holds a form.
 */
export function PopoverContent({
    align = 'center',
    offset = 5,
    className,
    style,
    children,
    ...rest
}: PopoverContentProps) {
    const popup = usePopover('PopoverContent');
    return (
        <div
            role="dialog"
            {...rest}
            {...popup.popupProps}
            style={{ ...anchoredStyle(popup.id, { align, offset, width: 'at-least' }), ...style }}
            className={cx('zen__popover fixed z-50 overflow-visible p-0', POPUP, className)}
        >
            {children}
        </div>
    );
}

/**
 * A button that closes its popover (after its own onClick, unless that calls
 * preventDefault). Takes every Button prop: variant, size, asChild…
 */
export function PopoverClose({ onClick, ...rest }: ButtonProps) {
    const popup = usePopover('PopoverClose');
    return (
        <Button
            {...rest}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                onClick?.(e);
                if (!e.defaultPrevented) popup.setOpen(false);
            }}
        />
    );
}

export interface PopoverProps {
    /** Open or close it from your state; leave it out to let the trigger do it. */
    open?: boolean;
    /** Open when it first appears. */
    defaultOpen?: boolean;
    /** Every open and close: the trigger, outside clicks, Escape, PopoverClose. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export interface PopoverTriggerProps extends ComponentProps<'button'> {
    /** Put the trigger's props on your own button element instead of rendering one. */
    asChild?: boolean;
}

export interface PopoverContentProps extends ComponentProps<'div'> {
    /** Centred on the trigger (default), or lined up with its start or end edge. */
    align?: 'start' | 'end' | 'center';
    /** Gap from the trigger, in px. */
    offset?: number;
}
