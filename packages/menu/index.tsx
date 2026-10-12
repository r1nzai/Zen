import CheckMicro from '@zen/icons/micro/check';
import ChevronRightMicro from '@zen/icons/micro/chevron-right';
import { cx } from '@zen/utils/cx';
import { readingKey } from '@zen/utils/direction';
import { createPortal } from 'react-dom';
import { useTypeahead } from '@zen/utils/typeahead';
import { useGraphicsMode } from '@zen/utils/graphics';
import { useMergedRefs } from '@zen/utils/refs';
import { Slot } from '@zen/utils/slot';
import { useControllable } from '@zen/utils/useControllable';
import { anchoredStyle, anchorFor, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import {
    ComponentProps,
    createContext,
    KeyboardEvent,
    MouseEvent,
    PointerEvent,
    ReactNode,
    RefObject,
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
    const { popup, triggerId, point } = useMenu('MenuTrigger');
    const props = {
        id: triggerId,
        'aria-haspopup': 'menu' as const,
        ...popup.triggerProps,
        // Opened by a MenuContextTrigger, not by this button.
        ...(point && { 'aria-expanded': false, 'data-popup-open': undefined }),
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
export function MenuContent({ align, offset, ref, className, style, children, ...rest }: MenuContentProps) {
    const { popup, triggerId, point } = useMenu('MenuContent');
    const refs = useMergedRefs(popup.popupRef, ref);
    align ??= point ? 'start' : 'end';
    offset ??= point ? 2 : 6;
    const onKeyDown = useMenuKeys();

    return (
        <div
            aria-labelledby={point ? undefined : triggerId}
            {...rest}
            {...popup.popupProps}
            ref={refs}
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

/** Items of this menu, not of a submenu inside it. */
function itemsOf(menu: HTMLElement) {
    return Array.from(menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
        (item) => item.closest('[role="menu"]') === menu && !item.matches(':disabled, [aria-disabled="true"]'),
    );
}

/** Arrow keys, Home, End and typing move between a menu's own items; a submenu's keys are its own. */
function useMenuKeys() {
    const typeahead = useTypeahead();
    return (e: KeyboardEvent<HTMLDivElement>) => {
        const menu = e.currentTarget;
        if ((e.target as Element).closest('[role="menu"]') !== menu) return;
        const items = itemsOf(menu);
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
}

const ITEM =
    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start text-sm outline-hidden select-none hover:bg-tint/[0.07] focus:bg-tint/[0.07] disabled:cursor-not-allowed disabled:opacity-50';

/**
 * One choice in a Menu: closes the menu, then runs `onSelect`. An `icon` sits
 * before the label (muted, or red with the label when `tone` is negative). With
 * `asChild`, the item's role and styles go onto your own element instead, such
 * as a router's Link.
 */
export function MenuItem({
    icon,
    tone = 'default',
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
        className: cx(ITEM, tone === 'negative' && 'text-destructive', className),
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
                <span aria-hidden className={cx('flex shrink-0', tone !== 'negative' && 'text-muted-foreground')}>
                    {icon}
                </span>
            )}
            {children}
        </button>
    );
}

const MARK = 'flex size-4 shrink-0 items-center justify-center';

/**
 * A choice that's on or off, e.g. a column to show: choosing it flips
 * `checked` and leaves the menu open, so several can be set at once. A tick
 * shows while it's on.
 */
export function MenuCheckboxItem({
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    className,
    children,
    onClick,
    ...rest
}: MenuCheckboxItemProps) {
    const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange);
    return (
        <button
            type="button"
            {...rest}
            role="menuitemcheckbox"
            aria-checked={checked}
            tabIndex={-1}
            className={cx(ITEM, className)}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) setChecked(!checked);
            }}
        >
            <span aria-hidden className={MARK}>
                {checked && <CheckMicro className="size-3.5" />}
            </span>
            {children}
        </button>
    );
}

const RadioContext = createContext<{ value: string | null; select: (value: string) => void } | null>(null);

/** One choice out of several, e.g. how to sort: put MenuRadioItems inside. Choosing one leaves the menu open. */
export function MenuRadioGroup({ value: valueProp, defaultValue = null, onValueChange, ...rest }: MenuRadioGroupProps) {
    const [value, setValue] = useControllable<string | null, string>(valueProp, defaultValue, onValueChange);
    return (
        <RadioContext.Provider value={{ value, select: setValue }}>
            <div role="group" {...rest} />
        </RadioContext.Provider>
    );
}

/** One of a MenuRadioGroup's choices; a dot marks the chosen one. */
export function MenuRadioItem({ value, className, children, onClick, ...rest }: MenuRadioItemProps) {
    const group = useContext(RadioContext);
    if (!group) throw new Error('<MenuRadioItem> must be inside <MenuRadioGroup>');
    const checked = group.value === value;
    return (
        <button
            type="button"
            {...rest}
            role="menuitemradio"
            aria-checked={checked}
            tabIndex={-1}
            className={cx(ITEM, className)}
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) group.select(value);
            }}
        >
            <span aria-hidden className={MARK}>
                {checked && <span className="size-1.5 rounded-full bg-current" />}
            </span>
            {children}
        </button>
    );
}

interface SubContextValue {
    popup: ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;
    triggerRef: RefObject<HTMLButtonElement | null>;
    triggerId: string;
    /** Opens it; from the keyboard, its first item takes focus. */
    show: (focusFirst: boolean) => void;
    /** Closes it, after a moment when the pointer may only be passing over something else on its way in. */
    hideSoon: () => void;
    stay: () => void;
}

const SubContext = createContext<SubContextValue | null>(null);

function useSub(part: string) {
    const ctx = useContext(SubContext);
    if (!ctx) throw new Error(`<${part}> must be inside <MenuSub>`);
    return ctx;
}

/** Long enough to cross another item on the way into a submenu. */
const PASSING = 250;

const shown = (el: Element | null) => {
    try {
        return !!el?.matches(':popover-open');
    } catch {
        return true; // no Popover API to ask
    }
};

/**
 * A menu inside a menu, opening beside its item: on hover, or with Enter,
 * Space or the arrow towards it; the arrow back (or Escape) closes it. Put a
 * MenuSubTrigger and a MenuSubContent inside, in a MenuContent.
 */
export function MenuSub({ onOpenChange, children }: MenuProps) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const triggerId = useId();
    const timer = useRef(0);
    const focusFirst = useRef(false);
    const popup = useAnchoredPopup<HTMLDivElement>({
        onOpenChange: (open) => {
            const sub = popup.popupRef.current;
            const trigger = triggerRef.current;
            if (open && focusFirst.current && sub) itemsOf(sub)[0]?.focus();
            focusFirst.current = false;
            // Back to its item, unless the whole menu closed.
            if (!open && trigger && shown(trigger.closest('[role="menu"]'))) {
                const active = document.activeElement;
                if (!active || active === document.body || sub?.contains(active)) trigger.focus();
            }
            onOpenChange?.(open);
        },
    });
    const stay = () => clearTimeout(timer.current);
    useEffect(() => stay, []);
    const value: SubContextValue = {
        popup,
        triggerRef,
        triggerId,
        show: (first) => {
            stay();
            if (popup.open) {
                if (first && popup.popupRef.current) itemsOf(popup.popupRef.current)[0]?.focus();
                return;
            }
            focusFirst.current = first;
            popup.setOpen(true);
        },
        hideSoon: () => {
            stay();
            timer.current = window.setTimeout(() => popup.setOpen(false), PASSING);
        },
        stay,
    };
    return <SubContext.Provider value={value}>{children}</SubContext.Provider>;
}

/** Leaving for somewhere else in the menu it's in (not off the menu altogether, nor into the submenu). */
function leavingForMenu(e: PointerEvent<HTMLElement>, menu: Element | null) {
    const to = e.relatedTarget;
    return to instanceof Node && !!menu?.contains(to);
}

/** The item a submenu opens from; a chevron after its label points the way. */
export function MenuSubTrigger({
    icon,
    ref,
    className,
    children,
    onClick,
    onKeyDown,
    onPointerEnter,
    onPointerLeave,
    style,
    ...rest
}: MenuSubTriggerProps) {
    const sub = useSub('MenuSubTrigger');
    const refs = useMergedRefs(sub.triggerRef, ref);
    const { popoverTarget: _, ...wiring } = sub.popup.triggerProps;
    return (
        <button
            type="button"
            id={sub.triggerId}
            {...rest}
            ref={refs}
            {...wiring}
            role="menuitem"
            aria-haspopup="menu"
            tabIndex={-1}
            style={{ ...wiring.style, ...style }}
            className={cx(ITEM, 'data-popup-open:bg-tint/[0.07]', className)}
            // From the keyboard (no pointer: detail 0) the submenu's first item takes focus.
            onClick={(e) => {
                onClick?.(e);
                if (!e.defaultPrevented) sub.show(e.detail === 0);
            }}
            onKeyDown={(e) => {
                onKeyDown?.(e);
                if (e.defaultPrevented || readingKey(e.key, e.currentTarget) !== 'ArrowRight') return;
                e.preventDefault();
                sub.show(true);
            }}
            onPointerEnter={(e) => {
                onPointerEnter?.(e);
                if (e.pointerType !== 'touch') sub.show(false);
            }}
            onPointerLeave={(e) => {
                onPointerLeave?.(e);
                if (leavingForMenu(e, e.currentTarget.closest('[role="menu"]'))) sub.hideSoon();
            }}
        >
            {icon && (
                <span aria-hidden className="text-muted-foreground flex shrink-0">
                    {icon}
                </span>
            )}
            {children}
            <ChevronRightMicro aria-hidden className="text-muted-foreground ms-auto size-4 shrink-0 rtl:-scale-x-100" />
        </button>
    );
}

/** The submenu's panel, beside its item (on the other side if there's no room), its first item level with it. */
export function MenuSubContent({
    offset = 8,
    ref,
    className,
    style,
    onKeyDown,
    onPointerEnter,
    onPointerLeave,
    children,
    ...rest
}: MenuSubContentProps) {
    const sub = useSub('MenuSubContent');
    const refs = useMergedRefs(sub.popup.popupRef, ref);
    const keys = useMenuKeys();
    return (
        <div
            aria-labelledby={sub.triggerId}
            {...rest}
            {...sub.popup.popupProps}
            ref={refs}
            role="menu"
            tabIndex={-1}
            data-zen-beside=""
            onKeyDown={(e) => {
                onKeyDown?.(e);
                if (e.defaultPrevented) return;
                keys(e);
                if (
                    (e.target as Element).closest('[role="menu"]') === e.currentTarget &&
                    readingKey(e.key, e.currentTarget) === 'ArrowLeft'
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    sub.popup.setOpen(false);
                    sub.triggerRef.current?.focus();
                }
            }}
            onPointerEnter={(e) => {
                onPointerEnter?.(e);
                sub.stay();
            }}
            onPointerLeave={(e) => {
                onPointerLeave?.(e);
                const parent = sub.triggerRef.current?.closest('[role="menu"]') ?? null;
                if (leavingForMenu(e, parent) && !sub.triggerRef.current?.contains(e.relatedTarget as Node))
                    sub.hideSoon();
            }}
            // Level with its item: back up by the menu's padding.
            style={{ ...anchoredStyle(sub.popup.id, { side: 'beside', offset }), marginBlock: -6, ...style }}
            className={cx(
                'zen__popover glass glass-blur text-foreground min-w-44 rounded-xl p-1.5 outline-hidden',
                className,
            )}
        >
            {children}
        </div>
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
    /** `negative` for a destructive choice: red. */
    tone?: 'default' | 'negative';
    /** Runs after the menu closes. */
    onSelect?: () => void;
    /** Put the item's role and styles on the single child element (a link) instead of a button. */
    asChild?: boolean;
}

export interface MenuCheckboxItemProps extends ComponentProps<'button'> {
    /** On (ticked); give it to control the item, or `defaultChecked` to start it. */
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export interface MenuRadioGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
    /** The chosen item's `value`; give it to control the group, or `defaultValue` to start it. */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string) => void;
}

export interface MenuRadioItemProps extends Omit<ComponentProps<'button'>, 'value'> {
    value: string;
}

export interface MenuSubTriggerProps extends ComponentProps<'button'> {
    /** Shown before the label; size it yourself (e.g. size-4). */
    icon?: ReactNode;
}

export interface MenuSubContentProps extends ComponentProps<'div'> {
    /** Gap between the item and the submenu, in px (counting the menu's own padding). */
    offset?: number;
}
