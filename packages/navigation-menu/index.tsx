import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { useGraphicsMode } from '@zen/utils/graphics';
import { useMergedRefs } from '@zen/utils/refs';
import { Slot } from '@zen/utils/slot';
import { POPUP } from '@zen/utils/styles';
import { anchoredStyle, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, createContext, PointerEvent, RefObject, useContext, useEffect, useRef } from 'react';

interface ItemContextValue {
    popup: ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;
    triggerRef: RefObject<HTMLButtonElement | null>;
    /** Opens it after the hover delay, or at once when another of the menu's panels is already open. */
    pointIn: (e: PointerEvent<HTMLElement>) => void;
    pointOut: () => void;
    /** A click: opens or closes it, but keeps one the pointer just opened. */
    toggle: () => void;
}

const ItemContext = createContext<ItemContextValue | null>(null);
const DelayContext = createContext({ openDelay: 150, closeDelay: 200 });
/** Inside a panel, a link is a row; at the top, it's one of the bar's labels. */
const InPanel = createContext(false);

function useItem(part: string) {
    const ctx = useContext(ItemContext);
    if (!ctx) throw new Error(`<${part}> must be inside <NavigationMenuItem>`);
    return ctx;
}

const LABEL =
    'text-muted-foreground hover:text-foreground focus-ring inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm transition-colors outline-hidden select-none data-popup-open:bg-tint/[0.07] data-popup-open:text-foreground aria-[current=page]:text-foreground';

/**
 * A site's navigation: links, and labels that open panels of links below
 * them, on hover (after `openDelay`; at once while another is open) or with a
 * click or Enter. Escape, a click outside or Tab moving on closes it. Fill it
 * with NavigationMenuItems, each a NavigationMenuLink, or a
 * NavigationMenuTrigger and a NavigationMenuContent. Name it with
 * `aria-label` when there's more than one nav on the page.
 */
export default function NavigationMenu({
    openDelay = 150,
    closeDelay = 200,
    className,
    children,
    ...rest
}: NavigationMenuProps) {
    useGraphicsMode();
    return (
        <DelayContext.Provider value={{ openDelay, closeDelay }}>
            <nav {...rest} className={cx('zen__navigation-menu relative', className)}>
                <ul className="flex items-center gap-0.5">{children}</ul>
            </nav>
        </DelayContext.Provider>
    );
}

/** One place in the menu: a link, or a label with its panel. */
export function NavigationMenuItem({ className, onBlur, children, ...rest }: ComponentProps<'li'>) {
    const { openDelay, closeDelay } = useContext(DelayContext);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const byHover = useRef(false);
    const timer = useRef(0);
    const popup = useAnchoredPopup<HTMLDivElement>({
        onOpenChange: (open) => {
            if (open) return;
            byHover.current = false;
            // Opened from code, the browser won't give focus back on Escape: it goes back to the label.
            const active = document.activeElement;
            if (!active || active === document.body || popup.popupRef.current?.contains(active))
                triggerRef.current?.focus();
        },
    });
    useEffect(() => () => clearTimeout(timer.current), []);
    const pointIn = (e: PointerEvent<HTMLElement>) => {
        clearTimeout(timer.current);
        if (e.pointerType === 'touch' || popup.open || !triggerRef.current) return;
        const another = triggerRef.current.closest('nav')?.querySelector('[data-popup-open]');
        const open = () => {
            byHover.current = true;
            popup.setOpen(true);
        };
        if (another) open();
        else timer.current = window.setTimeout(open, openDelay);
    };
    const toggle = () => {
        const keep = popup.open && byHover.current;
        byHover.current = false;
        if (!keep) popup.setOpen(!popup.open);
    };
    const pointOut = () => {
        clearTimeout(timer.current);
        if (popup.open && byHover.current) timer.current = window.setTimeout(() => popup.setOpen(false), closeDelay);
    };
    return (
        <ItemContext.Provider value={{ popup, triggerRef, pointIn, pointOut, toggle }}>
            <li
                {...rest}
                className={cx('relative', className)}
                // Tab moving on past the panel closes it.
                onBlur={(e) => {
                    onBlur?.(e);
                    if (popup.open && !e.currentTarget.contains(e.relatedTarget)) popup.setOpen(false);
                }}
            >
                {children}
            </li>
        </ItemContext.Provider>
    );
}

/** The label that opens its item's panel; a chevron after it turns over while it's open. */
export function NavigationMenuTrigger({
    className,
    style,
    onClick,
    onPointerEnter,
    onPointerLeave,
    children,
    ref,
    ...rest
}: ComponentProps<'button'>) {
    const item = useItem('NavigationMenuTrigger');
    const refs = useMergedRefs(item.triggerRef, ref);
    // Its own toggling: a native popover target would shut a panel the pointer just opened.
    const { popoverTarget: _, ...wiring } = item.popup.triggerProps;
    return (
        <button
            type="button"
            {...rest}
            ref={refs}
            {...wiring}
            style={{ ...wiring.style, ...style }}
            className={cx(LABEL, className)}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) item.toggle();
            }}
            onPointerEnter={(e) => {
                onPointerEnter?.(e);
                item.pointIn(e);
            }}
            onPointerLeave={(e) => {
                onPointerLeave?.(e);
                item.pointOut();
            }}
        >
            {children}
            <FieldChevron open={item.popup.open} />
        </button>
    );
}

/** The panel: glass, below its label (above it if there's no room), lined up with its start. Lay out its links as you like. */
export function NavigationMenuContent({
    align = 'start',
    offset = 8,
    className,
    style,
    onPointerEnter,
    onPointerLeave,
    ref,
    ...rest
}: NavigationMenuContentProps) {
    const item = useItem('NavigationMenuContent');
    const refs = useMergedRefs(item.popup.popupRef, ref);
    return (
        <InPanel.Provider value={true}>
            <div
                {...rest}
                {...item.popup.popupProps}
                ref={refs}
                style={{ ...anchoredStyle(item.popup.id, { align, offset }), ...style }}
                className={cx('zen__popover fixed z-50 p-2', POPUP, className)}
                onPointerEnter={(e) => {
                    onPointerEnter?.(e);
                    item.pointIn(e);
                }}
                onPointerLeave={(e) => {
                    onPointerLeave?.(e);
                    item.pointOut();
                }}
            />
        </InPanel.Provider>
    );
}

/**
 * A link: one of the bar's labels at the top, or a row in a panel (with an
 * optional `description` under its text). `active` marks the page you're on.
 * With `asChild`, your router's link instead of an `<a>`.
 */
export function NavigationMenuLink({
    active,
    description,
    asChild,
    className,
    children,
    ...rest
}: NavigationMenuLinkProps) {
    const inPanel = useContext(InPanel);
    const props = {
        'aria-current': active ? ('page' as const) : undefined,
        ...rest,
        className: cx(
            inPanel
                ? 'focus-ring hover:bg-tint/[0.06] aria-[current=page]:bg-primary/10 flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm outline-hidden transition-colors'
                : LABEL,
            className,
        ),
    };
    if (asChild) return <Slot {...props}>{children}</Slot>;
    return (
        <a {...props}>
            {inPanel && description ? (
                <>
                    <span className="font-medium">{children}</span>
                    <span className="text-muted-foreground text-xs leading-snug">{description}</span>
                </>
            ) : (
                children
            )}
        </a>
    );
}

export interface NavigationMenuProps extends ComponentProps<'nav'> {
    /** How long the pointer rests on a label before its panel opens, in ms. */
    openDelay?: number;
    /** How long a panel opened by the pointer stays after it leaves, in ms (time to reach the panel). */
    closeDelay?: number;
}

export interface NavigationMenuContentProps extends ComponentProps<'div'> {
    align?: 'start' | 'end' | 'center';
    /** Gap below the label, in px. */
    offset?: number;
}

export interface NavigationMenuLinkProps extends ComponentProps<'a'> {
    /** The page it leads to is the one you're on. */
    active?: boolean;
    /** In a panel, a line under the link's text. */
    description?: string;
    /** Put its props on your own link (the single child), e.g. a router's Link. */
    asChild?: boolean;
}
