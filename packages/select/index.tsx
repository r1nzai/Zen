import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';

export interface SelectOption<V extends string> {
    value: V;
    /** Text shown, and matched when the user types to jump to an option. */
    label: string;
    disabled?: boolean;
}

/**
 * Pick one value from a short list: a field-styled button that opens a list
 * below it. Keyboard: arrows, Home/End, type to jump, Enter to choose, Escape
 * to close. For long or searchable lists, use Dropdown.
 */
export default function Select<V extends string>({
    value,
    options,
    onChange,
    placeholder = 'Select…',
    disabled = false,
    renderOption,
    name,
    id,
    className,
    listClassName,
    'aria-label': ariaLabel,
}: SelectProps<V>) {
    const listRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(-1);
    const typed = useRef({ text: '', at: 0 });
    const popup = useAnchoredPopup<HTMLDivElement>({
        matchWidth: true,
        onOpenChange: (open) => {
            if (!open) return;
            // Start on the chosen option.
            setActive(
                Math.max(
                    0,
                    options.findIndex((o) => o.value === value),
                ),
            );
        },
    });
    // Take focus once open, so the keys work.
    useEffect(() => {
        if (popup.open) listRef.current?.focus();
    }, [popup.open]);
    const selected = options.find((o) => o.value === value);
    const optionId = (i: number) => `${popup.id}-option-${i}`;

    const choose = (i: number) => {
        const option = options[i];
        if (!option || option.disabled) return;
        onChange(option.value);
        popup.setOpen(false);
    };

    // Next enabled option from `from` in direction `step`, wrapping.
    const move = (from: number, step: 1 | -1) => {
        for (let n = 1; n <= options.length; n++) {
            const i = (from + step * n + options.length * 2) % options.length;
            if (!options[i].disabled) return i;
        }
        return from;
    };

    const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const keys: Record<string, () => void> = {
            ArrowDown: () => setActive((a) => move(a, 1)),
            ArrowUp: () => setActive((a) => move(a, -1)),
            Home: () => setActive(move(-1, 1)),
            End: () => setActive(move(options.length, -1)),
            Enter: () => choose(active),
            ' ': () => choose(active),
            Tab: () => popup.setOpen(false),
        };
        if (keys[e.key]) {
            if (e.key !== 'Tab') e.preventDefault();
            keys[e.key]();
            return;
        }
        // Type to jump: letters typed quickly in a row search together.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const now = Date.now();
            const text = (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase();
            typed.current = { text, at: now };
            const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(text));
            if (i >= 0) setActive(i);
        }
    };

    return (
        <>
            <button
                type="button"
                id={id}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                {...popup.triggerProps}
                onKeyDown={(e) => {
                    if (['ArrowDown', 'ArrowUp'].includes(e.key) && !popup.open) {
                        e.preventDefault();
                        popup.setOpen(true);
                    }
                }}
                className={cx('zen__select group', TRIGGER, 'w-full', popup.open && TRIGGER_OPEN, className)}
            >
                <span className={cx('truncate', !selected && 'text-muted-foreground')}>
                    {selected ? selected.label : placeholder}
                </span>
                <FieldChevron open={popup.open} />
            </button>
            {name && <input type="hidden" name={name} value={value ?? ''} />}
            <div {...popup.popupProps} className={cx('zen__popover', POPUP, 'overflow-visible py-1', listClassName)}>
                <div
                    ref={listRef}
                    role="listbox"
                    tabIndex={-1}
                    aria-label={ariaLabel}
                    aria-activedescendant={active >= 0 ? optionId(active) : undefined}
                    onKeyDown={onListKeyDown}
                    className="max-h-72 overflow-y-auto outline-hidden"
                >
                    {options.map((option, i) => (
                        <div
                            key={option.value}
                            id={optionId(i)}
                            role="option"
                            aria-selected={option.value === value}
                            aria-disabled={option.disabled || undefined}
                            data-highlighted={i === active || undefined}
                            onMouseMove={() => !option.disabled && setActive(i)}
                            onClick={() => choose(i)}
                            className={cx(
                                'grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-hidden select-none',
                                'data-highlighted:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
                            )}
                        >
                            <span className="text-primary col-start-1" aria-hidden>
                                {option.value === value && '✓'}
                            </span>
                            <span className="col-start-2 truncate">
                                {renderOption ? renderOption(option) : option.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export interface SelectProps<V extends string> {
    value: V | null;
    options: readonly SelectOption<V>[];
    onChange: (value: V) => void;
    /** Shown while nothing is chosen. */
    placeholder?: string;
    disabled?: boolean;
    /** Custom content for each option (the label is still used for typing to jump). */
    renderOption?: (option: SelectOption<V>) => ReactNode;
    /** Form field name: adds a hidden input with the value. */
    name?: string;
    id?: string;
    /** Classes for the trigger (e.g. a width, instead of the default full width). */
    className?: string;
    /** Classes for the popup list. */
    listClassName?: string;
    'aria-label'?: string;
}
