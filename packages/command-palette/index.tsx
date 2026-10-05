import { useModal } from '@zen/dialog';
import { cx } from '@zen/utils/cx';
import { KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Search everything and act on it (pages, commands, records): a field over a
 * list that narrows as you type. Arrow keys move, Enter runs the item and
 * closes. Open it from a button, or anywhere with ⌘K / Ctrl+K
 * (useCommandPaletteShortcut).
 */
export default function CommandPalette({
    open,
    onOpenChange,
    items,
    placeholder = 'Search…',
    empty = 'No results',
    label = 'Commands',
    className,
}: CommandPaletteProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const id = useId();
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    useModal(ref, open, input);

    // Each time it opens, it starts afresh.
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setQuery('');
            setActive(0);
        }
    }

    const shown = useMemo(() => search(items, query), [items, query]);
    const groups = useMemo(() => {
        const out = new Map<string, { item: CommandItem; index: number }[]>();
        shown.forEach((item, index) => {
            const group = item.group ?? '';
            out.set(group, [...(out.get(group) ?? []), { item, index }]);
        });
        return out;
    }, [shown]);
    const current = Math.min(active, shown.length - 1);

    useEffect(() => {
        list.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [current]);

    const run = (item: CommandItem | undefined) => {
        if (!item) return;
        onOpenChange(false);
        item.onSelect();
    };
    const onKeyDown = (e: KeyboardEvent) => {
        const last = shown.length - 1;
        const to =
            e.key === 'ArrowDown'
                ? (current + 1) % (last + 1)
                : e.key === 'ArrowUp'
                  ? (current - 1 + last + 1) % (last + 1)
                  : e.key === 'Home' && e.ctrlKey
                    ? 0
                    : e.key === 'End' && e.ctrlKey
                      ? last
                      : null;
        if (to !== null && shown.length) {
            e.preventDefault();
            setActive(to);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            run(shown[current]);
        }
    };

    return (
        <dialog
            ref={ref}
            aria-label={label}
            className={cx(
                'zen__dialog zen__command-palette glass glass-blur glow-edge text-card-foreground bg-card/90! overflow-hidden p-0',
                'mx-auto mt-[12dvh] mb-auto w-[36rem] max-w-[calc(100vw-2rem)] rounded-xl',
                'backdrop:bg-[color:var(--backdrop-scrim,oklch(0_0_0/0.5))] backdrop:backdrop-blur-sm pointer-coarse:backdrop:backdrop-blur-none',
                className,
            )}
            onCancel={(e) => {
                e.preventDefault();
                onOpenChange(false);
            }}
            onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
        >
            <input
                ref={input}
                role="combobox"
                aria-expanded
                aria-controls={`${id}-list`}
                aria-activedescendant={shown.length ? `${id}-${current}` : undefined}
                aria-autocomplete="list"
                aria-label={label}
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                }}
                onKeyDown={onKeyDown}
                className="border-tint/[0.07] h-14 w-full border-b bg-transparent px-5 text-base outline-hidden placeholder:text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))]"
            />
            <div
                ref={list}
                id={`${id}-list`}
                role="listbox"
                aria-label={label}
                className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2"
            >
                {!shown.length && <p className="text-muted-foreground my-0! px-3 py-8 text-center text-sm">{empty}</p>}
                {[...groups].map(([group, entries]) => (
                    <div key={group} role="group" aria-label={group || undefined} className="not-first:mt-2">
                        {group && (
                            <div
                                aria-hidden
                                className="text-muted-foreground text-2xs px-3 pt-2 pb-1 tracking-widest uppercase"
                            >
                                {group}
                            </div>
                        )}
                        {entries.map(({ item, index }) => (
                            <div
                                key={item.id ?? item.label}
                                id={`${id}-${index}`}
                                data-index={index}
                                role="option"
                                aria-selected={index === current}
                                onPointerMove={() => index !== current && setActive(index)}
                                onClick={() => run(item)}
                                className="text-muted-foreground aria-selected:bg-primary/15 aria-selected:text-foreground flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)] [&_svg]:size-4 [&_svg]:shrink-0"
                            >
                                {item.icon}
                                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                {item.hint && <span className="text-muted-foreground text-xs">{item.hint}</span>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </dialog>
    );
}

/** The items matching `query`: each of its words is in the label or keywords. Labels starting with it come first. */
export function search(items: CommandItem[], query: string): CommandItem[] {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    const q = query.trim().toLowerCase();
    const matches = items.filter((item) => {
        const text = [item.label, ...(item.keywords ?? []), item.group ?? ''].join(' ').toLowerCase();
        return words.every((w) => text.includes(w));
    });
    const starts = (item: CommandItem) => (item.label.toLowerCase().startsWith(q) ? 0 : 1);
    return matches.sort((a, b) => starts(a) - starts(b));
}

/** Calls `open` on ⌘K (Mac) or Ctrl+K, anywhere on the page. */
export function useCommandPaletteShortcut(open: () => void, key = 'k'): void {
    const latest = useRef(open);
    useEffect(() => {
        latest.current = open;
    });
    useEffect(() => {
        const onKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key.toLowerCase() !== key || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
            e.preventDefault();
            latest.current();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [key]);
}

export interface CommandItem {
    /** Unique among the items; the label by default. */
    id?: string;
    label: string;
    /** Items with the same group are listed together, under it. */
    group?: string;
    /** More words it's found by. */
    keywords?: string[];
    icon?: ReactNode;
    /** Shown at the end, e.g. a shortcut or where it goes. */
    hint?: ReactNode;
    onSelect: () => void;
}

export interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: CommandItem[];
    placeholder?: string;
    /** Shown when nothing matches. */
    empty?: ReactNode;
    /** Names the palette and its list, for screen readers. */
    label?: string;
    className?: string;
}
