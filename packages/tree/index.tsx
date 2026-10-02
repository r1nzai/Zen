import ChevronRightMicro from '@zen/icons/micro/chevron-right';
import { TableCell, TableCellProps, TableRow } from '@zen/table';
import { cx } from '@zen/utils/cx';
import {
    ComponentProps,
    CSSProperties,
    FocusEvent,
    KeyboardEvent,
    ReactNode,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

/** One visible row of a tree. */
export interface TreeRowData<T> {
    item: T;
    key: string;
    /** 0 for top-level rows. */
    depth: number;
    parentKey: string | null;
    hasChildren: boolean;
    expanded: boolean;
    /** Its place among its siblings (1-based), and how many siblings there are. */
    position: number;
    siblings: number;
}

/**
 * Headless tree for tables and lists: turns nested items into the rows that
 * are visible (children of collapsed rows are skipped), and expands/collapses
 * them. With the Tree* parts, children grow in and shrink away smoothly.
 *
 * Put `tree.tableProps` on the Table: it's then a tree grid (WAI-ARIA), one tab
 * stop whose rows the keyboard moves between. Up and Down go row to row, Home
 * and End to the first and last, Right opens a row (or goes to its first
 * child), Left closes it (or goes to its parent).
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
            list.forEach((item, i) => {
                const key = getKey(item);
                const children = getChildren(item);
                const hasChildren = !!children?.length;
                const expanded = hasChildren && isExpanded(key);
                out.push({
                    item,
                    key,
                    depth,
                    parentKey,
                    hasChildren,
                    expanded,
                    position: i + 1,
                    siblings: list.length,
                });
                if (expanded) walk(children!, depth + 1, key);
            });
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

    // The row the grid's one tab stop is on: the last one focused, while it's still shown.
    const [current, setCurrent] = useState<string | null>(null);
    const tabStop = rows.some((r) => r.key === current) ? current : (rows[0]?.key ?? null);
    const open = (row: TreeRowData<T>) => row.expanded && closing !== row.key;

    /** Keyboard for a focused row (keys pressed inside its cells, e.g. in an input, are left alone). */
    const onRowKeyDown = (row: TreeRowData<T>, e: KeyboardEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return;
        const i = rows.indexOf(row);
        let to: TreeRowData<T> | undefined;
        if (e.key === 'ArrowDown') to = rows[i + 1];
        else if (e.key === 'ArrowUp') to = rows[i - 1];
        else if (e.key === 'Home') to = rows[0];
        else if (e.key === 'End') to = rows.at(-1);
        else if (e.key === 'ArrowRight' && row.hasChildren) {
            if (!open(row)) toggle(row.key);
            else to = rows[i + 1];
        } else if (e.key === 'ArrowLeft') {
            if (open(row)) toggle(row.key);
            else to = rows.find((r) => r.key === row.parentKey);
        } else return;
        e.preventDefault();
        if (!to) return;
        const grid = e.currentTarget.closest('[role="treegrid"], table');
        grid?.querySelector<HTMLElement>(`[data-tree-key="${CSS.escape(to.key)}"]`)?.focus();
    };

    /** Props for a row's <tr>: tree semantics, keyboard and the open/close animation. */
    const rowProps = (row: TreeRowData<T>) => ({
        'aria-level': row.depth + 1,
        'aria-expanded': row.hasChildren ? open(row) : undefined,
        'aria-posinset': row.position,
        'aria-setsize': row.siblings,
        'data-depth': row.depth,
        'data-tree-key': row.key,
        tabIndex: row.key === tabStop ? 0 : -1,
        onFocus: (e: FocusEvent<HTMLElement>) => {
            if (e.target === e.currentTarget) setCurrent(row.key);
        },
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => onRowKeyDown(row, e),
        className: cx(
            'outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring/60',
            opened && row.parentKey === opened.key && 'zen__tree-row-enter',
            closing && row.parentKey === closing && 'zen__tree-row-exit',
        ),
        // Each cell's content box animates to this height (the row minus its 1px divider).
        style: { '--row-h': `${rowHeight - 1}px` } as CSSProperties,
        onAnimationEnd: (e: { animationName: string }) => {
            if (e.animationName === 'zen-row-close' && closing && row.parentKey === closing) finishClose.current?.();
        },
    });

    /** Props for a row's TreeToggle: for the pointer (the keyboard opens rows with the arrows). */
    const toggleProps = (row: TreeRowData<T>) => ({
        expanded: open(row),
        onToggle: () => toggle(row.key),
        tabIndex: -1,
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
        /** For the Table: a tree grid. */
        tableProps: { role: 'treegrid' as const },
        rowProps,
        toggleProps,
        rowHeight,
    };
}

export type Tree<T> = ReturnType<typeof useTree<T>>;

/** A table row wired to useTree: tree semantics, the keyboard and the open/close animation. */
export function TreeRow<T>({ row, tree, className, style, onFocus, onKeyDown, ...rest }: TreeRowProps<T>) {
    const p = tree.rowProps(row);
    return (
        <TableRow
            {...rest}
            {...p}
            onFocus={(e) => {
                onFocus?.(e);
                p.onFocus(e);
            }}
            onKeyDown={(e) => {
                onKeyDown?.(e);
                if (!e.defaultPrevented) p.onKeyDown(e);
            }}
            className={cx(p.className, className)}
            style={{ ...p.style, ...style }}
        />
    );
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
                'text-muted-foreground hover:bg-tint/[0.08] hover:text-foreground focus-visible:ring-ring/50 -ml-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md outline-hidden transition-colors focus-visible:ring-2',
                className,
            )}
            {...rest}
        >
            <ChevronRightMicro
                className={cx(
                    'zen__tree-chevron size-4 transition-transform duration-200 ease-out',
                    expanded && 'rotate-90',
                )}
            />
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
