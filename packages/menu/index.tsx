import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, createContext, KeyboardEvent, MouseEvent, ReactNode, useContext } from 'react';

/** Closes the menu; items call it when chosen. */
const CloseContext = createContext<() => void>(() => {});

/**
 * A button that opens a menu: a native popover, so outside clicks and Escape
 * close it and focus returns to the button. Arrow keys, Home and End move
 * between items. Fill it with MenuItem, MenuSeparator and MenuHeader; the
 * trigger's content is yours (an icon, an avatar, a label).
 */
export default function Menu({
    label,
    trigger,
    triggerClassName,
    align = 'end',
    offset = 6,
    className,
    children,
}: MenuProps) {
    useGraphicsMode();
    const popup = useAnchoredPopup<HTMLDivElement>({
        align,
        offset,
        // Focus the menu itself, so arrow keys work without highlighting an item for mouse users.
        onOpenChange: (open) => open && popup.popupRef.current?.focus(),
    });

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
        <>
            <button
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                {...popup.triggerProps}
                className={triggerClassName}
            >
                {trigger}
            </button>
            <div
                {...popup.popupProps}
                role="menu"
                aria-label={label}
                tabIndex={-1}
                onKeyDown={onKeyDown}
                className={cx(
                    'zen__popover glass glass-blur text-foreground min-w-44 rounded-xl p-1.5 outline-hidden',
                    className,
                )}
            >
                <CloseContext.Provider value={() => popup.setOpen(false)}>{children}</CloseContext.Provider>
            </div>
        </>
    );
}

const ITEM =
    'flex w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-hidden select-none hover:bg-tint/[0.07] focus:bg-tint/[0.07]';

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
        className: cx(
            ITEM,
            destructive && 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10',
            className,
        ),
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
    /** Accessible name for the button and the menu, e.g. "Account menu". */
    label: string;
    /** What the button shows: an icon, an avatar, text. */
    trigger: ReactNode;
    /** Classes for the button. */
    triggerClassName?: string;
    /** Which edge of the button the menu lines up with. */
    align?: 'start' | 'end';
    /** Gap between the button and the menu, in px. */
    offset?: number;
    /** Classes for the menu panel (width, shadow…). */
    className?: string;
    children: ReactNode;
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
