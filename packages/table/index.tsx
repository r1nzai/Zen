import ChevronDown from '@zen/icons/chevron-down';
import ChevronUp from '@zen/icons/chevron-up';
import { cx } from '@zen/utils/cx';
import { reducedMotion } from '@zen/utils/motion';
import { ComponentProps, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/*
 * Sticky parts (the header row, the footer row, a first column) are clear glass
 * at rest, and frost only while content passes under them: TableContainer marks
 * the scroller with data-under-top/left/bottom, and the zen__sticky-* rules in
 * theme.css frost (or, without blur, fill) that edge. Header and footer frost
 * as whole rows, so the blur has no seams between columns.
 */

/**
 * The panel a table scrolls in: glass with an edge that catches the pointer
 * light, like a Card. Give it a max height (className) to scroll vertically;
 * it scrolls sideways when the table is wider. `ref` and scroll events are the
 * scrolling element's. With `label`, it's a focusable region, so keyboard users
 * can scroll it too.
 */
export function TableContainer({ label, className, ref, onScroll, ...rest }: TableContainerProps) {
    const own = useRef<HTMLDivElement | null>(null);

    // Which edges have content scrolled under them, as data attributes (no re-render).
    const mark = useCallback(() => {
        const el = own.current;
        if (!el) return;
        // Only on a change: touching the attribute restyles every sticky cell.
        const set = (name: string, on: boolean) => on !== el.hasAttribute(name) && el.toggleAttribute(name, on);
        set('data-under-top', el.scrollTop > 0);
        set('data-under-left', el.scrollLeft > 0);
        set('data-under-bottom', el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }, []);

    useEffect(() => {
        const el = own.current;
        if (!el) return;
        mark();
        // Content and size changes move the edges too (rows added, groups opened, resizes).
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(mark);
        resizes?.observe(el);
        if (el.firstElementChild) resizes?.observe(el.firstElementChild);
        return () => resizes?.disconnect();
    }, [mark]);

    // Two boxes: the glass panel stays put (its glowing edge is drawn on it, and
    // would scroll away and repaint every frame on a scrolling element), and the
    // table scrolls inside it, on its own layer (will-change), so scrolling moves
    // pixels instead of redrawing rows. Size the panel with className (e.g. max-h-80).
    return (
        <div
            className={cx(
                'zen__table-panel glass glow-edge isolate flex flex-col overflow-hidden rounded-xl',
                className,
            )}
        >
            <div
                ref={(node) => {
                    own.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) ref.current = node;
                }}
                onScroll={(e) => {
                    mark();
                    onScroll?.(e);
                }}
                role={label ? 'region' : undefined}
                aria-label={label}
                tabIndex={label ? 0 : undefined}
                className="zen__table-container focus-visible:ring-ring/30 relative min-h-0 overflow-auto rounded-[inherit] outline-hidden will-change-scroll focus-visible:ring-2 focus-visible:ring-inset"
                {...rest}
            />
        </div>
    );
}

/** The <table>. Put it in a TableContainer for the panel and scrolling. */
export default function Table({ className, ...rest }: ComponentProps<'table'>) {
    return <table className={cx('zen__table w-full border-separate border-spacing-0 text-sm', className)} {...rest} />;
}

/** The heading rows: they stay at the top while the body scrolls, frosted as one surface. */
export function TableHeader({ className, ...rest }: ComponentProps<'thead'>) {
    return <thead className={cx('zen__sticky-top sticky top-0 z-20', className)} {...rest} />;
}

/**
 * The rows. When rows are added, removed or reordered (a sort), the others
 * slide to their new places and new ones fade in. Not with spacer rows (a
 * virtual list: rows come and go as it scrolls), nor with reduced motion.
 */
export function TableBody({ ref, ...rest }: ComponentProps<'tbody'>) {
    const body = useRef<HTMLTableSectionElement>(null);
    const last = useRef<{ rows: HTMLTableRowElement[]; tops: Map<HTMLTableRowElement, number> }>(null);
    useIsoLayoutEffect(() => {
        const el = body.current;
        if (!el) return;
        const rows = [...el.rows];
        const before = last.current;
        // The same rows in the same order: nothing to move, nor to measure.
        if (before && rows.length === before.rows.length && rows.every((r, i) => r === before.rows[i])) return;
        const tops = new Map(rows.map((r) => [r, r.offsetTop]));
        last.current = { rows, tops };
        if (!before || reducedMotion() || el.querySelector('[data-zen-spacer]')) return;
        if (rows.some((row) => before.tops.has(row))) {
            for (const row of before.rows) if (!row.isConnected) fadeOut(row, before.tops.get(row)!, el, rows);
        }
        for (const row of rows) {
            const was = before.tops.get(row);
            if (was === undefined) {
                // A tree row opening has its own animation.
                if (!row.hasAttribute('data-tree-key'))
                    row.animate?.({ opacity: [0, 1], translate: ['0 -6px', '0 0'] }, ENTER);
            } else if (was !== tops.get(row)) {
                row.animate?.({ translate: [`0 ${was - tops.get(row)!}px`, '0 0'] }, MOVE);
            }
        }
    });
    return (
        <tbody
            ref={(node) => {
                body.current = node;
                if (typeof ref === 'function') return ref(node);
                if (ref) ref.current = node;
            }}
            {...rest}
        />
    );
}

/**
 * A deleted row fades where it was while the rows below slide up into its
 * place: React has already taken it out, so it's put back in a copy of the
 * table, at its old place over the scrolling content, with the columns as wide.
 */
function fadeOut(row: HTMLTableRowElement, top: number, body: HTMLTableSectionElement, kept: HTMLTableRowElement[]) {
    const table = body.closest('table');
    const scroller = body.closest<HTMLElement>('.zen__table-container');
    const like = kept.find((r) => r.cells.length === row.cells.length);
    if (!table || !scroller || !like) return;
    const box = scroller.getBoundingClientRect();
    const at = table.getBoundingClientRect();
    const ghost = document.createElement('table');
    ghost.className = table.className;
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
        position: 'absolute',
        top: `${at.top - box.top + scroller.scrollTop + top}px`,
        left: `${at.left - box.left + scroller.scrollLeft}px`,
        width: `${table.offsetWidth}px`,
        tableLayout: 'fixed',
        pointerEvents: 'none',
    });
    const cols = document.createElement('colgroup');
    for (const cell of like.cells)
        cols.appendChild(document.createElement('col')).style.width = `${cell.offsetWidth}px`;
    ghost.append(cols, document.createElement('tbody'));
    ghost.tBodies[0].append(row);
    scroller.append(ghost);
    const fade = ghost.animate?.({ opacity: [1, 0], translate: ['0 0', '-12px 0'] }, LEAVE);
    if (fade) fade.onfinish = fade.oncancel = () => ghost.remove();
    else ghost.remove();
}
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const LEAVE: KeyframeAnimationOptions = { duration: 220, easing: 'ease-in' };
const MOVE: KeyframeAnimationOptions = { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
const ENTER: KeyframeAnimationOptions = { duration: 260, easing: 'ease-out' };

/** Rows that stay at the bottom while the body scrolls (totals, balances). */
export function TableFooter({ className, ...rest }: ComponentProps<'tfoot'>) {
    return <tfoot className={cx('zen__sticky-bottom sticky bottom-0 z-20', className)} {...rest} />;
}

/** A row; its cells light up together on hover. */
export function TableRow({ selected, className, ...rest }: ComponentProps<'tr'> & { selected?: boolean }) {
    return <tr data-selected={selected || undefined} className={cx('group', className)} {...rest} />;
}

/**
 * Column heading: small spaced caps (TableHeader keeps the row at the top). With `onSort`, it's a
 * button that shows the direction and announces it (aria-sort).
 */
export function TableHead({
    numeric,
    sticky,
    sortDirection,
    onSort,
    scope = 'col',
    className,
    children,
    ...rest
}: TableHeadProps) {
    return (
        <th
            scope={scope}
            aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined}
            className={cx(
                'border-tint/[0.07] text-muted-foreground border-b px-3 py-2.5 align-middle text-xs leading-5 font-medium tracking-wider whitespace-nowrap uppercase',
                sticky === 'left' && 'zen__sticky-left sticky left-0 z-10',
                numeric ? 'text-right' : 'text-left',
                className,
            )}
            {...rest}
        >
            {onSort ? (
                <button
                    type="button"
                    onClick={onSort}
                    // Buttons reset text-transform: keep sortable headings uppercase like the rest.
                    className={cx(
                        'hover:text-foreground touch-target inline-flex cursor-pointer items-center gap-1 align-middle leading-5 tracking-wider uppercase',
                        numeric && 'flex-row-reverse',
                    )}
                >
                    {children}
                    <span aria-hidden className="inline-flex w-3">
                        {sortDirection === 'asc' ? (
                            <ChevronUp className="size-3" strokeWidth={2.5} />
                        ) : sortDirection === 'desc' ? (
                            <ChevronDown className="size-3" strokeWidth={2.5} />
                        ) : null}
                    </span>
                </button>
            ) : (
                children
            )}
        </th>
    );
}

/** A cell: hairline below, lit with its row on hover. `sticky="left"` keeps it in view when scrolling sideways. */
export function TableCell({ numeric, sticky, className, ...rest }: TableCellProps) {
    return (
        <td
            className={cx(
                // The row's hover tint is layered over the cell's own background, so sticky
                // cells stay opaque (a translucent colour would show the scrolled content through them).
                'border-tint/[0.045] border-b px-3 py-2.5 transition-colors duration-150',
                'group-hover:[background-image:linear-gradient(oklch(var(--tint)/0.035),oklch(var(--tint)/0.035))]',
                'group-data-selected:[background-image:linear-gradient(oklch(var(--primary)/0.09),oklch(var(--primary)/0.09))]',
                sticky === 'left' &&
                    'zen__sticky-left sticky left-0 z-10 shadow-[inset_-1px_0_0_oklch(var(--tint)/0.06)]',
                numeric && 'text-right tabular-nums',
                className,
            )}
            {...rest}
        />
    );
}

/** A footer cell: sits on the card, above a hairline. Use inside TableFooter. */
export function TableFooterCell({ numeric, sticky, className, ...rest }: TableCellProps) {
    // The footer row frosts as one (TableFooter); a left-sticky cell also frosts with the left edge.
    return (
        <td
            className={cx(
                'border-tint/[0.07] h-9 border-t px-3 font-medium whitespace-nowrap',
                sticky === 'left' &&
                    'zen__sticky-left sticky left-0 z-10 shadow-[inset_-1px_0_0_oklch(var(--tint)/0.06)]',
                numeric && 'text-right tabular-nums',
                className,
            )}
            {...rest}
        />
    );
}

/** An empty row of a given height, standing in for rows scrolled out of view (see useVirtualList). */
export function TableSpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
    if (height <= 0) return null;
    return (
        <tr aria-hidden data-zen-spacer>
            <td colSpan={colSpan} style={{ height, padding: 0, border: 0 }} />
        </tr>
    );
}

/** One row spanning the table, for "nothing here" messages. */
export function TableEmpty({ colSpan, children = 'Nothing here yet.' }: { colSpan: number; children?: ReactNode }) {
    return (
        <tr>
            <td colSpan={colSpan} className="text-muted-foreground px-3 py-8 text-center">
                {children}
            </td>
        </tr>
    );
}

export type SortDirection = 'asc' | 'desc';

/**
 * Sorting for a table: click a heading to sort by it, again to reverse, a
 * third time to clear. Spread `headProps(key)` onto that column's TableHead.
 */
export function useSort<T, K extends string>(
    rows: readonly T[],
    compare: Record<K, (a: T, b: T) => number>,
    initial?: { key: K; direction: SortDirection },
) {
    const [sort, setSort] = useState(initial ?? null);

    const sorted = useMemo(() => {
        if (!sort) return rows;
        const by = compare[sort.key];
        const out = [...rows].sort(by);
        return sort.direction === 'desc' ? out.reverse() : out;
    }, [rows, sort, compare]);

    const headProps = (key: K) => ({
        sortDirection: sort?.key === key ? sort.direction : undefined,
        onSort: () =>
            setSort((s) =>
                s?.key !== key ? { key, direction: 'asc' } : s.direction === 'asc' ? { key, direction: 'desc' } : null,
            ),
    });

    return { rows: sorted, sort, setSort, headProps };
}

export interface TableContainerProps extends ComponentProps<'div'> {
    /** Accessible name; makes the scroll area a focusable region. */
    label?: string;
}

export interface TableHeadProps extends ComponentProps<'th'> {
    /** Right-aligned, for numbers. */
    numeric?: boolean;
    /** Stay in view when the table scrolls sideways. */
    sticky?: 'left';
    sortDirection?: SortDirection;
    /** Makes the heading a sort button. */
    onSort?: () => void;
}

export interface TableCellProps extends ComponentProps<'td'> {
    /** Right-aligned, tabular digits. */
    numeric?: boolean;
    /** Stay in view when the table scrolls sideways. */
    sticky?: 'left';
}

export {
    SelectionBar,
    type SelectionBarProps,
    TableSelectCell,
    type TableSelectCellProps,
    TableSelectHead,
    type TableSelectHeadProps,
    useSelection,
} from './selection';
