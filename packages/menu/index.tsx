import { cx } from '@zen/utils/cx';
import { createPortal } from 'react-dom';
import { useTypeahead } from '@zen/utils/typeahead';
import { useGraphicsMode } from '@zen/utils/graphics';
import { Slot } from '@zen/utils/slot';
import { anchoredStyle, anchorFor, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    MouseEvent,
    PointerEvent,
    ReactNode,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Closes the menu; items call it when chosen. */
const CloseContext = createContext<() => void>(() => {});

interface MenuContextValue {
    popup: ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;
    triggerId: string;
    /** Where a context menu was asked for; it opens there instead of under a button. */
    point: Point | null;
    openAt: (point: Point) => void;
}

interface Point {
    x: number;
    y: number;
    /** The MenuContextTrigger it was asked from. */
    from: string;
    /** The pointer still pressing, when it opens on a press. */
    pointerId?: number;
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
 * MenuSeparator and MenuHeader. For a context menu, put a MenuContextTrigger
 * around what it's for instead of a MenuTrigger.
 */
export default function Menu({ onOpenChange, children }: MenuProps) {
    useGraphicsMode();
    const triggerId = useId();
    const [point, setPoint] = useState<Point | null>(null);
    // Opened at a point, nothing gets focus back natively: whatever had it does.
    const returnTo = useRef<HTMLElement | null>(null);
    const isOpen = useRef(false);
    const popup = useAnchoredPopup<HTMLDivElement>({
        onOpenChange: (open) => {
            isOpen.current = open;
            // Focus the menu itself, so arrow keys work without highlighting an item for mouse users.
            if (open) popup.popupRef.current?.focus();
            else forgetPoint();
            if (!open && returnTo.current) {
                const active = document.activeElement;
                if (!active || active === document.body || popup.popupRef.current?.contains(active))
                    returnTo.current.focus();
                returnTo.current = null;
            }
            onOpenChange?.(open);
        },
    });
    // Without its anchor while fading out, it would jump to the page's corner.
    const forgetPoint = () => {
        const menu = popup.popupRef.current;
        const fading = menu?.getAnimations?.() ?? [];
        void Promise.allSettled(fading.map((a) => a.finished)).then(() => {
            if (!isOpen.current) setPoint(null);
        });
    };
    // Opens once the point it's anchored to is on the page.
    useIsoLayoutEffect(() => {
        if (!point) return;
        popup.setOpen(true);
        // Else letting go counts as a click outside, and closes it.
        if (point.pointerId !== undefined) {
            try {
                popup.popupRef.current?.setPointerCapture(point.pointerId);
            } catch {
                // Already let go.
            }
        }
    }, [point]);
    const openAt = (at: Point) => {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setPoint({ ...at });
    };
    return (
        <MenuContext.Provider value={{ popup, triggerId, point, openAt }}>
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
        <button type="button" {...props} className={cx('cursor-pointer', props.className)}>
            {children}
        </button>
    );
}

/**
 * The menu panel: glass, below the button (above it if there's no room), lined
 * up with its end edge by default. A context menu opens from the pointer
 * instead; name it with `aria-label`.
 */
export function MenuContent({ align, offset, className, style, children, ...rest }: MenuContentProps) {
    const { popup, triggerId, point } = useMenu('MenuContent');
    align ??= point ? 'start' : 'end';
    offset ??= point ? 2 : 6;
    const typeahead = useTypeahead();

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const items = Array.from(
            popup.popupRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
        );
        const i = items.indexOf(document.activeElement as HTMLElement);
        const last = items.length - 1;
        // Type to jump to the first item whose label starts with what's typed.
        const text = typeahead(e);
        if (text) {
            items.find((item) => item.textContent?.trim().toLowerCase().startsWith(text))?.focus();
            return;
        }
        // Nothing focused yet (just opened): Down starts at the top, Up at the bottom.
        const next = { ArrowDown: i + 1, ArrowUp: i === -1 ? last : i - 1, Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        items[(next + items.length) % items.length]?.focus();
    };

    return (
        <div
            aria-labelledby={point ? undefined : triggerId}
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

/** How long a finger rests before a context menu opens, where the browser doesn't open one (iOS). */
const LONG_PRESS = 500;
const SLOP = 8;

/**
 * What a context menu is for, e.g. a row or a card: right-click (or the
 * keyboard's menu key, or Shift+F10) opens the Menu where the pointer is, and
 * so does a long press on a phone. While its menu is open it has
 * `data-popup-open`, to show what the menu is for. With `asChild`, your own
 * element instead of a div.
 */
export function MenuContextTrigger({
    asChild,
    disabled,
    className,
    onContextMenu,
    onPointerDown,
    onClickCapture,
    children,
    ...rest
}: MenuContextTriggerProps) {
    const { popup, point, openAt } = useMenu('MenuContextTrigger');
    const id = useId();
    const asked = point?.from === id;
    const press = useRef<{ x: number; y: number; timer: number } | null>(null);
    const pressed = useRef(false);
    const endPress = () => {
        if (press.current) clearTimeout(press.current.timer);
        press.current = null;
    };
    useEffect(() => endPress, []);

    const props = {
        ...rest,
        className: cx('[-webkit-touch-callout:none]', className),
        'data-popup-open': (asked && popup.open) || undefined,
        onContextMenu: (e: MouseEvent<HTMLElement>) => {
            onContextMenu?.(e as MouseEvent<HTMLDivElement>);
            if (disabled || e.defaultPrevented) return;
            e.preventDefault();
            endPress();
            if (popup.open) return;
            // From the keyboard there's no pointer: open at what's focused.
            if (e.clientX === 0 && e.clientY === 0) {
                const box = (e.target as Element).getBoundingClientRect();
                openAt({ x: box.left, y: box.bottom, from: id });
            } else {
                const native = e.nativeEvent;
                const pointerId =
                    'pointerId' in native && e.buttons ? (native as globalThis.PointerEvent).pointerId : undefined;
                openAt({ x: e.clientX, y: e.clientY, from: id, pointerId });
            }
        },
        onPointerDown: (e: PointerEvent<HTMLElement>) => {
            onPointerDown?.(e as PointerEvent<HTMLDivElement>);
            pressed.current = false;
            if (disabled || e.pointerType !== 'touch' || !e.isPrimary) return;
            const at = { x: e.clientX, y: e.clientY, from: id, pointerId: e.pointerId };
            const el = e.currentTarget;
            const move = (m: globalThis.PointerEvent) => {
                if (Math.hypot(m.clientX - at.x, m.clientY - at.y) > SLOP) stop();
            };
            const stop = () => {
                endPress();
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', stop);
                el.removeEventListener('pointercancel', stop);
            };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', stop);
            el.addEventListener('pointercancel', stop);
            press.current = {
                ...at,
                timer: window.setTimeout(() => {
                    stop();
                    pressed.current = true;
                    if (!popup.open) openAt(at);
                }, LONG_PRESS),
            };
        },
        // A long press isn't a tap on what's under the finger.
        onClickCapture: (e: MouseEvent<HTMLElement>) => {
            onClickCapture?.(e as MouseEvent<HTMLDivElement>);
            if (!pressed.current) return;
            pressed.current = false;
            e.preventDefault();
            e.stopPropagation();
        },
    };
    // On the body: inside a transformed or glass ancestor, fixed wouldn't be the viewport.
    const anchor =
        point &&
        asked &&
        createPortal(
            <span
                aria-hidden
                {...anchorFor(popup.id)}
                style={{ ...anchorFor(popup.id).style, position: 'fixed', left: point.x, top: point.y }}
            />,
            document.body,
        );
    return (
        <>
            {asChild ? <Slot {...(props as ComponentProps<'a'>)}>{children}</Slot> : <div {...props}>{children}</div>}
            {anchor}
        </>
    );
}

const ITEM =
    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-hidden select-none hover:bg-tint/[0.07] focus:bg-tint/[0.07] disabled:cursor-not-allowed disabled:opacity-50';

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

export interface MenuContextTriggerProps extends ComponentProps<'div'> {
    /** Put its props on your own element (the single child) instead of a div. */
    asChild?: boolean;
    /** Leave the browser's own context menu. */
    disabled?: boolean;
}

export interface MenuContentProps extends ComponentProps<'div'> {
    /** Which edge of the button the menu lines up with (default end; a context menu starts at the pointer), or centred on it. */
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
