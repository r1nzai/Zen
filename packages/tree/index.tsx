import { TableCell, TableCellProps, TableRow } from '@zen/table';
import { cx } from '@zen/utils/cx';
import { ComponentProps, CSSProperties, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

/** One visible row of a tree. */
export interface TreeRowData<T> {
    item: T;
    key: string;
    /** 0 for top-level rows. */
    depth: number;
    parentKey: string | null;
    hasChildren: boolean;
    expanded: boolean;
}

/**
 * Headless tree for tables and lists: turns nested items into the rows that
 * are visible (children of collapsed rows are skipped), and expands/collapses
 * them. With the Tree* parts, children grow in and shrink away smoothly.
 */
export function useTree<T>({ items, getKey, getChildren, defaultExpanded = true, rowHeight = 36 }: UseTreeOptions<T>) {
    // Rows whose expanded state differs from the default.
    const [toggled, setToggled] = useState<Set<string>>(() => new Set());
    // The group just opened: its rows grow in. The group closing: its rows shrink before they go.
    const [opened, setOpened] = useState<{ key: string; at: number } | null>(null);
    const [closing, setClosing] = useState<string | null>(null);
    const finishClose = useRef<(() => void) | null>(null);

    const isExpanded = useCallback((key: string) => toggled.has(key) !== defaultExpanded, [toggled, defaultExpanded]);

    const rows = useMemo(() => {
        const out: TreeRowData<T>[] = [];
        const walk = (list: readonly T[], depth: number, parentKey: string | null) => {
            for (const item of list) {
                const key = getKey(item);
                const children = getChildren(item);
                const hasChildren = !!children?.length;
                const expanded = hasChildren && isExpanded(key);
                out.push({ item, key, depth, parentKey, hasChildren, expanded });
                if (expanded) walk(children!, depth + 1, key);
            }
        };
        walk(items, 0, null);
        return out;
    }, [items, getKey, getChildren, isExpanded]);

    /** Keys of every item with children, open or not. */
    const parentKeys = () => {
        const keys: string[] = [];
        const walk = (list: readonly T[]) => {
            for (const item of list) {
                const children = getChildren(item);
                if (children?.length) {
                    keys.push(getKey(item));
                    walk(children);
                }
            }
        };
        walk(items);
        return keys;
    };

    const setExpanded = useCallback(
        (key: string, expanded: boolean) =>
            setToggled((t) => {
                const next = new Set(t);
                if (expanded === defaultExpanded) next.delete(key);
                else next.add(key);
                return next;
            }),
        [defaultExpanded],
    );

    const reducedMotion = () =>
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
            document.documentElement.classList.contains('reduce-motion'));

    /** Opens or closes a row, animating its children. */
    const toggle = (key: string) => {
        const grow = () => {
            const at = Date.now();
            setOpened({ key, at });
            // Done animating: back to plain rows.
            setTimeout(() => setOpened((o) => (o?.at === at ? null : o)), 320);
        };
        if (closing === key) {
            // Opened again while still closing: stay open, and the rows grow back.
            finishClose.current = null;
            setClosing(null);
            grow();
        } else if (!isExpanded(key)) {
            grow();
            setExpanded(key, true);
        } else if (reducedMotion()) {
            setExpanded(key, false);
        } else {
            // Collapses when the children's shrink animation ends (rowProps' onAnimationEnd);
            // the timer is a fallback in case no animation event arrives.
            setClosing(key);
            const finish = () => {
                // Opened again meanwhile (or already finished): nothing to do.
                if (finishClose.current !== finish) return;
                setExpanded(key, false);
                setClosing((c) => (c === key ? null : c));
                finishClose.current = null;
            };
            finishClose.current = finish;
            setTimeout(finish, 500);
        }
    };

    /** Props for a row's <tr>: tree semantics and the open/close animation. */
    const rowProps = (row: TreeRowData<T>) => ({
        'aria-level': row.depth + 1,
        'aria-expanded': row.hasChildren ? row.expanded : undefined,
        'data-depth': row.depth,
        className: cx(
            opened && row.parentKey === opened.key && 'zen__tree-row-enter',
            closing && row.parentKey === closing && 'zen__tree-row-exit',
        ),
        // Each cell's content box animates to this height (the row minus its 1px divider).
        style: { '--row-h': `${rowHeight - 1}px` } as CSSProperties,
        onAnimationEnd: (e: { animationName: string }) => {
            if (e.animationName === 'zen-row-close' && closing && row.parentKey === closing) finishClose.current?.();
        },
    });

    /** Props for a row's TreeToggle. */
    const toggleProps = (row: TreeRowData<T>) => ({
        expanded: row.expanded && closing !== row.key,
        onToggle: () => toggle(row.key),
    });

    return {
        rows,
        toggle,
        isExpanded,
        expand: (key: string) => setExpanded(key, true),
        collapse: (key: string) => setExpanded(key, false),
        /** Opens every row that has children. */
        expandAll: () => setToggled(defaultExpanded ? new Set() : new Set(parentKeys())),
        /** Closes every row. */
        collapseAll: () => setToggled(defaultExpanded ? new Set(parentKeys()) : new Set()),
        rowProps,
        toggleProps,
        rowHeight,
    };
}

export type Tree<T> = ReturnType<typeof useTree<T>>;

/** A table row wired to useTree: tree semantics (aria-level, aria-expanded) and the open/close animation. */
export function TreeRow<T>({ row, tree, className, style, ...rest }: TreeRowProps<T>) {
    const p = tree.rowProps(row);
    return <TableRow {...rest} {...p} className={cx(p.className, className)} style={{ ...p.style, ...style }} />;
}

/** A cell in a TreeRow: its content sits in a box whose height animates as groups open and close. */
export function TreeCell({ numeric, className, children, ...rest }: TableCellProps) {
    return (
        <TableCell numeric={numeric} className={cx('py-0 whitespace-nowrap', className)} {...rest}>
            <div className={cx('zen__tree-cell flex h-[var(--row-h)] items-center', numeric && 'justify-end')}>
                {children}
            </div>
        </TableCell>
    );
}

/** The first column's content: indented by depth, with the row's toggle (or a spacer, so labels line up). */
export function TreeLabel<T>({ row, tree, indent = 20, children, className }: TreeLabelProps<T>) {
    return (
        <div
            className={cx('flex min-w-0 flex-1 items-center gap-1', className)}
            style={{ paddingLeft: row.depth * indent }}
        >
            {row.hasChildren ? <TreeToggle {...tree.toggleProps(row)} /> : <span className="-ml-1 w-6 shrink-0" />}
            {children}
        </div>
    );
}

/** Chevron button that opens and closes a row: points right when closed, down when open. */
export function TreeToggle({ expanded, onToggle, className, ...rest }: TreeToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
            className={cx(
                'text-muted-foreground hover:bg-tint/[0.08] hover:text-foreground focus-visible:ring-ring/50 -ml-1 grid size-6 shrink-0 place-items-center rounded-md outline-hidden transition-colors focus-visible:ring-2',
                className,
            )}
            {...rest}
        >
            <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={cx('size-4 transition-transform duration-200 ease-out', expanded && 'rotate-90')}
            >
                <path d="m6 3.5 4.5 4.5L6 12.5" />
            </svg>
        </button>
    );
}

export interface UseTreeOptions<T> {
    items: readonly T[];
    getKey: (item: T) => string;
    /** Children of an item (undefined or empty for a leaf). */
    getChildren: (item: T) => readonly T[] | undefined;
    /** Whether rows start open. */
    defaultExpanded?: boolean;
    /** Row height in px, for the open/close animation. */
    rowHeight?: number;
}

export interface TreeRowProps<T> extends ComponentProps<'tr'> {
    row: TreeRowData<T>;
    tree: Tree<T>;
}

export interface TreeLabelProps<T> {
    row: TreeRowData<T>;
    tree: Tree<T>;
    /** Indent per level, in px. */
    indent?: number;
    children?: ReactNode;
    className?: string;
}

export interface TreeToggleProps extends Omit<ComponentProps<'button'>, 'onToggle'> {
    expanded: boolean;
    onToggle: () => void;
}
