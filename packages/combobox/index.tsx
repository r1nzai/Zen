import Badge from '@zen/badge';
import Button from '@zen/button';
import Collapse from '@zen/collapse';
import { useField } from '@zen/field';
import Search from '@zen/icons/search';
import XMark from '@zen/icons/x-mark';
import { InputGroupAddon, InputGroupInput } from '@zen/input-group';
import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { CheckIcon } from '@zen/utils/status-icons';
import { POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { anchoredStyle, useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { useVirtualList } from '@zen/utils/useVirtualList';
import {
    ChangeEvent,
    ComponentProps,
    createContext,
    KeyboardEvent,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

interface ComboboxContextValue<T = unknown> {
    multiple: boolean;
    keyOf: (item: T) => string;
    textOf: (item: T) => string;
    /** All items, and those matching the search. */
    items: readonly T[];
    /** Chosen items that may not be in `items` (for showing the value). */
    selectedItems: readonly T[];
    matches: readonly T[];
    /** Chosen keys, in the order they were chosen. */
    chosen: readonly string[];
    toggle: (key: string) => void;
    query: string;
    setQuery: (query: string) => void;
    /** The item the keyboard (or pointer) is on. */
    active: string | null;
    setActive: (key: string | null) => void;
    create: RefObject<((text: string) => void) | null>;
    popup: ReturnType<typeof useAnchoredPopup<HTMLDivElement>>;
    triggerRef: RefObject<HTMLDivElement | null>;
    listRef: RefObject<HTMLUListElement | null>;
    optionId: (key: string) => string;
    itemHeight: RefObject<number>;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);
const useCombobox = <T,>() => {
    const context = useContext(ComboboxContext);
    if (!context) throw new Error('Combobox parts must be inside a Combobox');
    return context as ComboboxContextValue<T>;
};

/**
 * Pick one or several items from a list you can search: a field that opens a
 * panel with a search box and the matching items. Compose it from
 * ComboboxTrigger, ComboboxPopup, ComboboxSearch, ComboboxList (virtualized,
 * for long lists), ComboboxItem, ComboboxEmpty and ComboboxCreate. Keyboard:
 * Enter, Space or ↓ on the field opens it, typing searches, ↑↓ move, Enter
 * chooses, Escape closes. Items can be any shape: say how to read a key and
 * text from one with `itemKey` and `itemText`.
 */
export default function Combobox<T>(props: ComboboxProps<T>) {
    const {
        items,
        itemKey = (item: T) => (item as { key: string }).key,
        itemText = (item: T) => (item as { text: string }).text,
        filter = (item: T, query: string) => itemText(item).toLowerCase().includes(query.toLowerCase()),
        selectedItems = [],
        children,
    } = props;
    const multiple = props.multiple === true;
    const chosen = multiple ? props.value : props.value === null ? [] : [props.value];

    const [query, setQuery] = useState('');
    const [active, setActive] = useState<string | null>(null);
    const create = useRef<((text: string) => void) | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const itemHeight = useRef(35);
    const matches = useMemo(
        () => (query ? items.filter((item) => filter(item, query)) : items),
        [items, query, filter],
    );

    const popup = useAnchoredPopup<HTMLDivElement>({
        onOpenChange: (open) => {
            if (open) return;
            // Each opening starts fresh: the whole list, nothing highlighted.
            setActive(null);
            setQuery('');
            // Closed while focus was inside (Escape, choosing): back to the field.
            if (popup.popupRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
        },
    });

    const toggle = (key: string) => {
        if (props.multiple === true) {
            const has = props.value.includes(key);
            props.onValueChange(has ? props.value.filter((k) => k !== key) : [...props.value, key]);
        } else {
            props.onValueChange(key);
            popup.setOpen(false);
        }
    };

    const context: ComboboxContextValue<T> = {
        multiple,
        keyOf: itemKey,
        textOf: itemText,
        items,
        selectedItems,
        matches,
        chosen,
        toggle,
        query,
        setQuery,
        active,
        setActive,
        create,
        popup,
        triggerRef,
        listRef,
        optionId: (key) => `${popup.id}-option-${key}`,
        itemHeight,
    };
    return <ComboboxContext.Provider value={context as ComboboxContextValue}>{children}</ComboboxContext.Provider>;
}

/**
 * The field: shows the choice (text, or chips when `multiple`) or the
 * placeholder, and opens the panel. Pass children to show the value your own way.
 */
export function ComboboxTrigger({
    placeholder = 'Select an Item',
    disabled,
    className,
    style,
    children,
    ...rest
}: ComboboxTriggerProps) {
    const box = useCombobox();
    const { popup } = box;
    // Inside a Field: its id, label (a div can't be a <label>'s target), hint and error.
    const field = useField();
    // Whether the panel was open when this press began (a press on the field closes an
    // open panel before the click arrives, so the click mustn't reopen it).
    const wasOpen = useRef(false);
    const open = () => !disabled && popup.setOpen(true);

    return (
        <div
            id={field?.id}
            aria-labelledby={rest['aria-label'] ? undefined : field?.labelId}
            aria-invalid={field?.['aria-invalid']}
            {...rest}
            aria-describedby={cx(field?.['aria-describedby'], rest['aria-describedby']).trim() || undefined}
            ref={box.triggerRef}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-haspopup="listbox"
            aria-expanded={popup.open}
            aria-controls={popup.id}
            aria-disabled={disabled || undefined}
            data-popup-open={popup.triggerProps['data-popup-open']}
            data-zen-anchor={popup.triggerProps['data-zen-anchor']}
            style={{ ...popup.triggerProps.style, ...style }}
            onPointerDown={(e) => {
                rest.onPointerDown?.(e);
                wasOpen.current = popup.open;
            }}
            onClick={(e) => {
                rest.onClick?.(e);
                // Inside a <label>, the click would also go to the list's search input and close the list.
                e.preventDefault();
                if (wasOpen.current) popup.setOpen(false);
                else open();
                wasOpen.current = false;
            }}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    open();
                }
            }}
            className={cx(
                TRIGGER,
                // A set width that doesn't shrink in a crowded row (className can change both).
                'w-56 shrink-0',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                popup.open && TRIGGER_OPEN,
                className,
            )}
        >
            <div
                className={cx(
                    // Takes all the space beside the chevron, whatever its content.
                    'flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm',
                    disabled ? 'text-muted-foreground' : 'text-foreground',
                )}
            >
                {children ?? <ComboboxValue placeholder={placeholder} />}
            </div>
            <FieldChevron open={popup.open} />
        </div>
    );
}

/** The default value display: the chosen item's text, or removable chips when `multiple`. */
function ComboboxValue({ placeholder }: { placeholder: string }) {
    const box = useCombobox();
    const byKey = new Map([...box.selectedItems, ...box.items].map((item) => [box.keyOf(item), item]));
    // Chosen items with text to show (an item without text, e.g. an empty "nothing chosen" item, shows the placeholder).
    const chosen = box.chosen.flatMap((key) => {
        const text = byKey.has(key) ? box.textOf(byKey.get(key)) : undefined;
        return text ? [{ key, text }] : [];
    });
    if (!chosen.length)
        return <span className={box.multiple ? 'text-muted-foreground' : undefined}>{placeholder}</span>;
    if (!box.multiple) return <>{chosen[0].text}</>;
    return (
        <Collapse
            items={chosen.map((c) => c.text)}
            data={chosen}
            badgeVariant="secondary"
            badgeClassName="h-6 min-w-min gap-2"
            className="w-full gap-1"
        >
            {(text, index, chip) => (
                <Badge key={chip?.key ?? index} className="flex h-6 min-w-min gap-2 pr-1" variant="secondary">
                    {text}
                    <Button
                        aria-label={`Remove ${text}`}
                        onClick={(e) => {
                            // Removing a chip doesn't open the list.
                            e.stopPropagation();
                            if (chip) box.toggle(chip.key);
                        }}
                        variant="icon"
                        size="icon"
                        // Up 1px: capitals sit above their line box's centre, so this centres the × on them.
                        className="group relative -top-px size-4 rounded-sm p-0.5"
                    >
                        <XMark className="size-3 transition duration-300 group-hover:rotate-90" />
                    </Button>
                </Badge>
            )}
        </Collapse>
    );
}

/** The panel under the field. Put ComboboxSearch and ComboboxList in it. */
export function ComboboxPopup({ className, children }: { className?: string; children: ReactNode }) {
    const { popup } = useCombobox();
    return (
        <div
            {...popup.popupProps}
            style={anchoredStyle(popup.id, { offset: 5, width: 'match' })}
            className={cx('zen__popover', POPUP, 'overflow-visible p-0', className)}
        >
            <div className="divide-tint/10 flex w-full flex-col divide-y overflow-hidden rounded-xl">{children}</div>
        </div>
    );
}

/** The search box: focused when the panel opens; ↑↓ move through the matches and Enter chooses. */
export function ComboboxSearch({
    placeholder = 'Search',
    'aria-label': ariaLabel = 'Search options',
}: ComboboxSearchProps) {
    const box = useCombobox();
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (box.popup.open) input.current?.focus();
    }, [box.popup.open]);

    const keys = box.matches.map(box.keyOf);
    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const i = box.active === null ? -1 : keys.indexOf(box.active);
        const go = (to: number) => {
            e.preventDefault();
            if (!keys.length) return;
            const next = keys[(to + keys.length) % keys.length];
            box.setActive(next);
            scrollIntoView(box.listRef.current, keys.indexOf(next), box.itemHeight.current);
        };
        if (e.key === 'ArrowDown') go(i + 1);
        else if (e.key === 'ArrowUp') go(i === -1 ? keys.length - 1 : i - 1);
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (box.active !== null) box.toggle(box.active);
            else if (!keys.length && box.query && box.create.current) {
                box.create.current(box.query);
                box.setQuery('');
            }
        }
    };

    return (
        // InputGroup's parts, without the field shell (the panel is the surface).
        <div className="flex h-10 grow items-center gap-2 px-3">
            <InputGroupAddon>
                <Search />
            </InputGroupAddon>
            <InputGroupInput
                ref={input}
                placeholder={placeholder}
                aria-label={ariaLabel}
                aria-controls={`${box.popup.id}-list`}
                aria-activedescendant={box.active !== null ? box.optionId(box.active) : undefined}
                value={box.query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    box.setQuery(e.target.value);
                    box.setActive(null);
                }}
                onKeyDown={onKeyDown}
            />
        </div>
    );
}

const scrollIntoView = (list: HTMLElement | null, index: number, size: number) => {
    if (!list || index < 0) return;
    const top = index * size;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + size > list.scrollTop + list.clientHeight) list.scrollTop = top + size - list.clientHeight;
};

const RowContext = createContext<{ start: number; size: number } | null>(null);

/**
 * The matching items, rendered only while in view (so thousands stay fast).
 * Rows are `itemHeight` px tall; `renderItem` draws each (default: a
 * ComboboxItem). Put ComboboxEmpty or ComboboxCreate inside for no matches.
 */
export function ComboboxList<T>({ renderItem, itemHeight = 35, children }: ComboboxListProps<T>) {
    const box = useCombobox<T>();
    box.itemHeight.current = itemHeight;
    const rows = useVirtualList({ count: box.matches.length, itemHeight, scrollRef: box.listRef });
    // New search, new results: show them from the top.
    useEffect(() => {
        if (box.listRef.current) box.listRef.current.scrollTop = 0;
    }, [box.query, box.listRef]);
    return (
        <ul
            id={`${box.popup.id}-list`}
            role="listbox"
            aria-multiselectable={box.multiple || undefined}
            className="max-h-72 grow overflow-y-auto py-1 focus:ring-0 focus:outline-hidden"
            ref={box.listRef}
        >
            <div style={{ height: `${rows.totalSize}px`, width: '100%', position: 'relative' }}>
                {rows.items.map((row) => {
                    const item = box.matches[row.index];
                    return (
                        <RowContext.Provider key={box.keyOf(item)} value={{ start: row.start, size: row.size }}>
                            {renderItem ? renderItem(item) : <ComboboxItem item={item} />}
                        </RowContext.Provider>
                    );
                })}
            </div>
            {children}
        </ul>
    );
}

/** One item in a ComboboxList: a check when chosen, then its text (or your own content). */
export function ComboboxItem<T>({ item, className, children }: ComboboxItemProps<T>) {
    const box = useCombobox<T>();
    const row = useContext(RowContext);
    const key = box.keyOf(item);
    const chosen = box.chosen.includes(key);
    return (
        <li
            id={box.optionId(key)}
            role="option"
            aria-selected={chosen}
            data-highlighted={box.active === key || undefined}
            style={row ? { height: `${row.size}px`, transform: `translateY(${row.start}px)` } : undefined}
            onMouseMove={() => box.active !== key && box.setActive(key)}
            onClick={() => box.toggle(key)}
            className={cx(
                'hover:bg-muted data-highlighted:bg-muted grid w-full cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-hidden select-none',
                row && 'absolute top-0 left-0',
                className,
            )}
        >
            <span className="text-primary col-start-1" aria-hidden>
                {chosen && <CheckIcon />}
            </span>
            <span className="col-start-2 truncate">{children ?? box.textOf(item)}</span>
        </li>
    );
}

/** Shown when the search matches nothing. */
export function ComboboxEmpty({ children = 'No results found' }: { children?: ReactNode }) {
    const box = useCombobox();
    if (!box.query || box.matches.length) return null;
    return <li className="text-muted-foreground cursor-not-allowed px-3 py-2 text-sm">{children}</li>;
}

/**
 * Offered when the search matches nothing: adds what was typed (Enter works
 * too). `children` renders the row from the text (default "Add …").
 */
export function ComboboxCreate({ onCreate, children = (text) => `Add ${text}` }: ComboboxCreateProps) {
    const box = useCombobox();
    const { create } = box;
    useEffect(() => {
        create.current = onCreate;
        return () => {
            create.current = null;
        };
    }, [create, onCreate]);
    if (!box.query || box.matches.length) return null;
    return (
        <li
            role="option"
            aria-selected={false}
            className="hover:bg-muted cursor-pointer px-3 py-2 text-sm select-none"
            onClick={() => {
                onCreate(box.query);
                box.setQuery('');
            }}
        >
            {children(box.query)}
        </li>
    );
}

interface ComboboxBaseProps<T> {
    items: readonly T[];
    /** How to read an item's unique key (default: its `key`). */
    itemKey?: (item: T) => string;
    /** How to read an item's text, shown and searched (default: its `text`). */
    itemText?: (item: T) => string;
    /** Whether an item matches the search (default: its text contains it, any case). */
    filter?: (item: T, query: string) => boolean;
    /** Chosen items that aren't in `items` (e.g. just created), so the field can still show them. */
    selectedItems?: readonly T[];
    children: ReactNode;
}
export type ComboboxProps<T> = ComboboxBaseProps<T> &
    (
        | { multiple?: false; value: string | null; onValueChange: (key: string) => void }
        | { multiple: true; value: readonly string[]; onValueChange: (keys: string[]) => void }
    );
export interface ComboboxTriggerProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** Shown while nothing is chosen. */
    placeholder?: string;
    disabled?: boolean;
    /** Your own display of the value (default: its text, or chips). */
    children?: ReactNode;
}
export interface ComboboxSearchProps {
    placeholder?: string;
    'aria-label'?: string;
}
export interface ComboboxListProps<T> {
    renderItem?: (item: T) => ReactNode;
    /** Height of every row, in px (default 35). */
    itemHeight?: number;
    children?: ReactNode;
}
export interface ComboboxItemProps<T> {
    item: T;
    className?: string;
    children?: ReactNode;
}
export interface ComboboxCreateProps {
    onCreate: (text: string) => void;
    children?: (text: string) => ReactNode;
}
