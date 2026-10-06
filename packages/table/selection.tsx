import Checkbox from '@zen/checkbox';
import XMark from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { ComponentProps, MouseEvent, ReactNode, useRef, useState } from 'react';

/**
 * Which rows are selected, by key: give it the keys in the order shown.
 * Shift-click selects (or clears) every row between the last one clicked
 * and this one. Keys no longer shown drop out of the selection.
 */
export function useSelection<K>(keys: readonly K[]) {
    const [chosen, setChosen] = useState<ReadonlySet<K>>(() => new Set());
    const anchor = useRef<K | null>(null);
    const shown = new Set(keys);
    const selected = new Set([...chosen].filter((k) => shown.has(k)));
    const all = keys.length > 0 && selected.size === keys.length;

    const set = (picked: readonly K[], on: boolean) =>
        setChosen((prev) => {
            const next = new Set([...prev].filter((k) => shown.has(k)));
            for (const k of picked) {
                if (on) next.add(k);
                else next.delete(k);
            }
            return next;
        });

    return {
        selected,
        clear: () => setChosen(new Set()),
        /** For a row's TableSelectCell. */
        rowProps: (key: K) => ({
            checked: selected.has(key),
            onSelect: (on: boolean, range: boolean) => {
                const from = range && anchor.current !== null ? keys.indexOf(anchor.current) : -1;
                const to = keys.indexOf(key);
                set(from === -1 ? [key] : keys.slice(Math.min(from, to), Math.max(from, to) + 1), on);
                anchor.current = key;
            },
        }),
        /** For the header's TableSelectHead. */
        allProps: () => ({
            checked: all,
            indeterminate: selected.size > 0 && !all,
            onSelect: (on: boolean) => set(keys, on),
        }),
    };
}

/** A row's checkbox cell; spread `rowProps(key)` from useSelection into it. */
export function TableSelectCell({ checked, onSelect, label, className, ...rest }: TableSelectCellProps) {
    return (
        <td className={cx('border-tint/[0.045] w-10 border-b py-2.5 pr-0 pl-3', className)} {...rest}>
            <Checkbox
                aria-label={label}
                checked={checked}
                onClick={(e: MouseEvent<HTMLInputElement>) => onSelect(e.currentTarget.checked, e.shiftKey)}
                onChange={() => {}}
                className="touch-target grid"
            />
        </td>
    );
}

/** The header's checkbox, for every row at once; spread `allProps()` from useSelection into it. */
export function TableSelectHead({
    checked,
    indeterminate,
    onSelect,
    label = 'Select all',
    className,
    ...rest
}: TableSelectHeadProps) {
    return (
        <th className={cx('w-10 py-2.5 pr-0 pl-3', className)} {...rest}>
            <Checkbox
                aria-label={label}
                checked={checked}
                indeterminate={indeterminate}
                onChange={(on) => onSelect(indeterminate ? false : on)}
                className="touch-target grid"
            />
        </th>
    );
}

/**
 * What to do with the selected rows: their count, your actions, and a × to
 * clear the selection. Floats at the bottom of the screen while any are
 * selected (move it with className).
 */
export function SelectionBar({
    count,
    onClear,
    label = (n) => `${n} selected`,
    clearLabel = 'Clear selection',
    className,
    children,
}: SelectionBarProps) {
    if (count === 0) return null;
    return (
        <div
            role="toolbar"
            aria-label="Selection"
            className={cx(
                'zen__selection-bar glass glass-blur glow-edge fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl py-2 pr-2 pl-4 shadow-[0_12px_40px_-12px_oklch(0_0_0/0.6)]',
                className,
            )}
        >
            <span className="text-sm font-medium whitespace-nowrap tabular-nums" aria-live="polite">
                {label(count)}
            </span>
            <span className="flex items-center gap-1">{children}</span>
            <button
                type="button"
                aria-label={clearLabel}
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground hover:bg-tint/10 focus-visible:ring-ring/50 touch-target grid size-8 cursor-pointer place-items-center rounded-lg outline-hidden focus-visible:ring-2"
            >
                <XMark className="size-4" />
            </button>
        </div>
    );
}

export interface TableSelectCellProps extends Omit<ComponentProps<'td'>, 'onSelect'> {
    checked: boolean;
    /** With `range` when shift was held. */
    onSelect: (on: boolean, range: boolean) => void;
    /** The checkbox's name, e.g. "Select Rent". */
    label: string;
}

export interface TableSelectHeadProps extends Omit<ComponentProps<'th'>, 'onSelect'> {
    checked: boolean;
    indeterminate: boolean;
    onSelect: (on: boolean) => void;
    label?: string;
}

export interface SelectionBarProps {
    count: number;
    onClear: () => void;
    /** The count as text (default "3 selected"). */
    label?: (count: number) => string;
    clearLabel?: string;
    className?: string;
    /** The actions, e.g. buttons to delete or re-tag them. */
    children?: ReactNode;
}
