import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { CheckIcon } from '@zen/utils/status-icons';
import { POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { useTypeahead } from '@zen/utils/typeahead';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import {
    Children,
    createContext,
    Fragment,
    isValidElement,
    KeyboardEvent,
    ComponentProps,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

interface SelectContextValue {
    value: string | null;
    active: string | null;
    setActive: (value: string) => void;
    choose: (value: string) => void;
    optionId: (value: string) => string;
    register: (value: string, label: string) => () => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

/**
 * Pick one value from a short list: a field-styled button that opens a list
 * below it. Keyboard: arrows, Home/End, type to jump, Enter to choose, Escape
 * to close. Fill it with SelectItem, organised with SelectGroup and
 * SelectSeparator. For long or searchable lists, use Combobox.
 */
export default function Select<V extends string>({
    value,
    onChange,
    placeholder = 'Select…',
    disabled = false,
    name,
    id,
    className,
    listClassName,
    children,
    style,
    onKeyDown,
    ...rest
}: SelectProps<V>) {
    const listRef = useRef<HTMLDivElement>(null);
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const field = useFieldProps({ ...rest, id });
    const [active, setActive] = useState<string | null>(null);
    const typeahead = useTypeahead();
    // Labels of items rendered inside your own components (read once they mount).
    const [registered, setRegistered] = useState<ReadonlyMap<string, string>>(new Map());

    // The options as rendered, in order (groups and your own wrappers included).
    const items = () =>
        Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).map((el) => ({
            value: el.dataset.value!,
            label: el.dataset.label ?? '',
            disabled: el.getAttribute('aria-disabled') === 'true',
        }));

    const popup = useAnchoredPopup<HTMLDivElement>({
        matchWidth: true,
        onOpenChange: (open) => {
            if (!open) return;
            // Start on the chosen option, or the first one that can be chosen.
            const list = items();
            setActive(list.find((o) => o.value === value)?.value ?? list.find((o) => !o.disabled)?.value ?? null);
        },
    });
    // Take focus once open, so the keys work.
    useEffect(() => {
        if (popup.open) listRef.current?.focus();
    }, [popup.open]);

    const choose = (v: string) => {
        if (items().find((o) => o.value === v)?.disabled) return;
        onChange(v as V);
        popup.setOpen(false);
    };
    const register = useCallback((v: string, label: string) => {
        setRegistered((m) => (m.get(v) === label ? m : new Map(m).set(v, label)));
        return () =>
            setRegistered((m) => {
                const next = new Map(m);
                next.delete(v);
                return next;
            });
    }, []);

    // The chosen option's text, known on the first render (so server HTML shows it).
    const labels = new Map<string, string>(registered);
    collectLabels(children, labels);
    const selectedLabel = value === null ? undefined : labels.get(value);

    // Next option that can be chosen from `from` in direction `step`, wrapping.
    const move = (from: string | null, step: 1 | -1, list = items()) => {
        const start = from === null ? (step === 1 ? -1 : list.length) : list.findIndex((o) => o.value === from);
        for (let n = 1; n <= list.length; n++) {
            const i = (start + step * n + list.length * 2) % list.length;
            if (!list[i].disabled) return list[i].value;
        }
        return from;
    };

    const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const keys: Record<string, () => void> = {
            ArrowDown: () => setActive((a) => move(a, 1)),
            ArrowUp: () => setActive((a) => move(a, -1)),
            Home: () => setActive(move(null, 1)),
            End: () => setActive(move(null, -1)),
            Enter: () => active !== null && choose(active),
            ' ': () => active !== null && choose(active),
            Tab: () => popup.setOpen(false),
        };
        if (keys[e.key]) {
            if (e.key !== 'Tab') e.preventDefault();
            keys[e.key]();
            return;
        }
        const text = typeahead(e);
        if (text) {
            const match = items().find((o) => !o.disabled && o.label.toLowerCase().startsWith(text));
            if (match) setActive(match.value);
        }
    };

    const optionId = (v: string) => `${popup.id}-option-${v}`;

    return (
        <>
            <button
                type="button"
                {...rest}
                {...field}
                id={triggerId}
                disabled={disabled}
                aria-haspopup="listbox"
                {...popup.triggerProps}
                style={{ ...popup.triggerProps.style, ...style }}
                onKeyDown={(e) => {
                    onKeyDown?.(e);
                    if (['ArrowDown', 'ArrowUp'].includes(e.key) && !popup.open) {
                        e.preventDefault();
                        popup.setOpen(true);
                    }
                }}
                className={cx('zen__select group', TRIGGER, 'w-full', popup.open && TRIGGER_OPEN, className)}
            >
                <span className={cx('truncate', selectedLabel === undefined && 'text-muted-foreground')}>
                    {selectedLabel ?? placeholder}
                </span>
                <FieldChevron open={popup.open} />
            </button>
            {name && <input type="hidden" name={name} value={value ?? ''} />}
            <div {...popup.popupProps} className={cx('zen__popover', POPUP, 'overflow-visible py-1', listClassName)}>
                <div
                    ref={listRef}
                    role="listbox"
                    tabIndex={-1}
                    // Named like its field: its aria-label, or else the field (and so the field's <label>).
                    aria-label={rest['aria-label']}
                    aria-labelledby={rest['aria-label'] ? undefined : triggerId}
                    aria-activedescendant={active !== null ? optionId(active) : undefined}
                    onKeyDown={onListKeyDown}
                    className="max-h-72 overflow-y-auto outline-hidden"
                >
                    <SelectContext.Provider value={{ value, active, setActive, choose, optionId, register }}>
                        {children}
                    </SelectContext.Provider>
                </div>
            </div>
        </>
    );
}

/** Reads SelectItem labels from children, through groups and fragments. */
function collectLabels(children: ReactNode, into: Map<string, string>) {
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;
        const el = child as ReactElement<{ value?: string; label?: string; children?: ReactNode }>;
        if (el.type === SelectItem && el.props.value !== undefined) {
            const text = el.props.label ?? textOf(el.props.children);
            if (text) into.set(el.props.value, text);
        } else if (el.type === SelectGroup || el.type === Fragment) {
            collectLabels(el.props.children, into);
        }
    });
}

const textOf = (node: ReactNode): string =>
    typeof node === 'string' || typeof node === 'number'
        ? String(node)
        : Array.isArray(node)
          ? node.map(textOf).join('')
          : '';

/**
 * One choice in a Select. Its `label` (or its text, when that's all it holds)
 * shows in the field once chosen and is matched when typing to jump.
 */
export function SelectItem({ value, label, disabled, className, children }: SelectItemProps) {
    const select = useContext(SelectContext);
    if (!select) throw new Error('SelectItem must be inside a Select');
    const ref = useRef<HTMLDivElement>(null);
    const text = label ?? textOf(children);
    const register = select.register;
    // Items inside your own components can't be read from children: they report their text.
    useLayoutEffect(() => register(value, text || ref.current?.textContent?.trim() || ''), [register, value, text]);
    const chosen = select.value === value;
    return (
        <div
            ref={ref}
            id={select.optionId(value)}
            role="option"
            data-value={value}
            data-label={text || undefined}
            aria-selected={chosen}
            aria-disabled={disabled || undefined}
            data-highlighted={select.active === value || undefined}
            onMouseMove={() => !disabled && select.setActive(value)}
            onClick={() => select.choose(value)}
            className={cx(
                'grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-hidden select-none',
                'data-highlighted:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
                className,
            )}
        >
            <span className="text-primary col-start-1" aria-hidden>
                {chosen && <CheckIcon />}
            </span>
            <span className="col-start-2 truncate">{children}</span>
        </div>
    );
}

/** A labelled group of SelectItems. */
export function SelectGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div role="group" aria-label={typeof label === 'string' ? label : undefined}>
            <div aria-hidden className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">
                {label}
            </div>
            {children}
        </div>
    );
}

/** A hairline between items or groups. */
export function SelectSeparator() {
    return <div role="separator" className="bg-tint/[0.07] mx-2 my-1 h-px" />;
}

/** Also takes the trigger button's props (aria-*, data-*, onBlur…), so Field can wire it up. */
export interface SelectProps<V extends string> extends Omit<
    ComponentProps<'button'>,
    'value' | 'onChange' | 'children' | 'defaultValue' | 'name'
> {
    value: V | null;
    onChange: (value: V) => void;
    /** Shown while nothing is chosen. */
    placeholder?: string;
    disabled?: boolean;
    /** Form field name: adds a hidden input with the value. */
    name?: string;
    id?: string;
    /** Classes for the trigger (e.g. a width, instead of the default full width). */
    className?: string;
    /** Classes for the popup list. */
    listClassName?: string;
    /** SelectItem, SelectGroup and SelectSeparator. */
    children: ReactNode;
}

export interface SelectItemProps {
    value: string;
    /** Text for the field and for typing to jump (defaults to the item's text). */
    label?: string;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}
