import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { anchoredStyle, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, createContext, KeyboardEvent, MouseEvent, ReactNode, useContext, useId } from 'react';

/** Closes the menu; items call it when chosen. */
const CloseContext = createContext<() => void>(() => {});

interface MenuContextValue {
    popup: ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;
    triggerId: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenu(part: string) {
    const ctx = useContext(MenuContext);
    if (!ctx) throw new Error(`<${part}> must be inside <Menu>`);
    return ctx;
}

/**
 * A list of actions that opens from a button: a native popover, so outside
 * clicks and Escape close it and focus returns to the button. Arrow keys, Home
 * and End move between items. Put a MenuTrigger (its content is yours: an icon,
 * an avatar, a label) and a MenuContent inside; fill the content with MenuItem,
 * MenuSeparator and MenuHeader.
 */
export default function Menu({ onOpenChange, children }: MenuProps) {
    useGraphicsMode();
    const triggerId = useId();
    const popup = useAnchoredPopup<HTMLDivElement>({
        onOpenChange: (open) => {
            // Focus the menu itself, so arrow keys work without highlighting an item for mouse users.
            if (open) popup.popupRef.current?.focus();
            onOpenChange?.(open);
        },
    });
    return (
        <MenuContext.Provider value={{ popup, triggerId }}>
            <CloseContext.Provider value={() => popup.setOpen(false)}>{children}</CloseContext.Provider>
        </MenuContext.Provider>
    );
}

/**
 * The button that opens the menu. Give it an `aria-label` when it shows only an
 * icon or avatar; the menu is named after it. With `asChild`, your own button instead.
 */
export function MenuTrigger({ asChild, style, children, ...rest }: MenuTriggerProps) {
    const { popup, triggerId } = useMenu('MenuTrigger');
    const props = {
        id: triggerId,
        'aria-haspopup': 'menu' as const,
        ...popup.triggerProps,
        ...rest,
        style: { ...popup.triggerProps.style, ...style },
    };
    if (asChild) return <Slot {...(props as ComponentProps<'a'>)}>{children}</Slot>;
    return (
        <button type="button" {...props}>
            {children}
        </button>
    );
}

/** The menu panel: glass, below the button (above it if there's no room), lined up with its end edge by default. */
export function MenuContent({ align = 'end', offset = 6, className, style, children, ...rest }: MenuContentProps) {
    const { popup, triggerId } = useMenu('MenuContent');

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const items = Array.from(popup.popupRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        const last = items.length - 1;
        // Nothing focused yet (just opened): Down starts at the top, Up at the bottom.
        const next = { ArrowDown: i + 1, ArrowUp: i === -1 ? last : i - 1, Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        items[(next + items.length) % items.length]?.focus();
    };

    return (
        <div
            aria-labelledby={triggerId}
            {...rest}
            {...popup.popupProps}
            role="menu"
            tabIndex={-1}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                onKeyDown(e);
            }}
            style={{ ...anchoredStyle(popup.id, { align, offset }), ...style }}
            className={cx(
                'zen__popover glass glass-blur text-foreground min-w-44 rounded-xl p-1.5 outline-hidden',
                className,
            )}
        >
            {children}
        </div>
    );
}

const ITEM =
    'flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-hidden select-none hover:bg-tint/[0.07] focus:bg-tint/[0.07]';

/**
 * One choice in a Menu: closes the menu, then runs `onSelect`. An `icon` sits
 * before the label (muted, or red with the label when `destructive`). With
 * `asChild`, the item's role and styles go onto your own element instead, such
 * as a router's Link.
 */
export function MenuItem({
    icon,
    destructive,
    onSelect,
    asChild,
    className,
    children,
    onClick,
    ...rest
}: MenuItemProps) {
    const close = useContext(CloseContext);
    const props = {
        ...rest,
        role: 'menuitem',
        tabIndex: -1,
        className: cx(ITEM, destructive && 'text-destructive', className),
        onClick: (e: MouseEvent<HTMLElement>) => {
            onClick?.(e as MouseEvent<HTMLButtonElement>);
            close();
            onSelect?.();
        },
    };
    if (asChild) return <Slot {...(props as ComponentProps<'a'>)}>{children}</Slot>;
    return (
        <button type="button" {...props}>
            {icon && (
                <span aria-hidden className={cx('flex shrink-0', !destructive && 'text-muted-foreground')}>
                    {icon}
                </span>
            )}
            {children}
        </button>
    );
}

/** A hairline between groups of items. */
export function MenuSeparator({ className }: { className?: string }) {
    return <div role="separator" className={cx('bg-tint/[0.07] mx-2 my-1 h-px', className)} />;
}

/** Content at the top of a menu that isn't a choice, e.g. who is signed in. */
export function MenuHeader({ className, ...rest }: ComponentProps<'div'>) {
    return <div className={cx('flex items-center gap-3 px-3 py-2.5', className)} {...rest} />;
}

export interface MenuProps {
    /** Every open and close: the trigger, choosing an item, outside clicks, Escape. */
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export interface MenuTriggerProps extends ComponentProps<'button'> {
    /** Put the trigger's props on your own button element instead of rendering one. */
    asChild?: boolean;
}

export interface MenuContentProps extends ComponentProps<'div'> {
    /** Which edge of the button the menu lines up with (default end), or centred on it. */
    align?: 'start' | 'end' | 'center';
    /** Gap between the button and the menu, in px. */
    offset?: number;
}

export interface MenuItemProps extends Omit<ComponentProps<'button'>, 'onSelect'> {
    /** Shown before the label; size it yourself (e.g. size-4). */
    icon?: ReactNode;
    /** Red, for actions that remove or leave something. */
    destructive?: boolean;
    /** Runs after the menu closes. */
    onSelect?: () => void;
    /** Put the item's role and styles on the single child element (a link) instead of a button. */
    asChild?: boolean;
}
