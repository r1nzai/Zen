import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';

/**
 * Sticky cells (header, first column, footer) are frosted glass: content
 * scrolling under them blurs instead of showing through. Where blur is off (no
 * GPU, touch screens, reduced transparency) they're solid card instead.
 */
const FROSTED = 'zen__frosted bg-card/80 backdrop-blur-[18px] backdrop-saturate-140';

/**
 * The panel a table scrolls in: glass with an edge that catches the pointer
 * light, like a Card. Give it a max height to scroll vertically; it scrolls sideways when
 * the table is wider. With `label`, it's a focusable region, so keyboard users
 * can scroll it too.
 */
export function TableContainer({ label, className, ...rest }: TableContainerProps) {
    return (
        <div
            role={label ? 'region' : undefined}
            aria-label={label}
            tabIndex={label ? 0 : undefined}
            className={cx(
                'zen__table-container glass glow-edge isolate overflow-auto rounded-xl',
                'focus-visible:ring-ring/30 outline-hidden focus-visible:ring-2',
                className,
            )}
            {...rest}
        />
    );
}

/** The <table>. Put it in a TableContainer for the panel and scrolling. */
export default function Table({ className, ...rest }: ComponentProps<'table'>) {
    return <table className={cx('zen__table w-full border-separate border-spacing-0 text-sm', className)} {...rest} />;
}

export function TableHeader(props: ComponentProps<'thead'>) {
    return <thead {...props} />;
}

export function TableBody(props: ComponentProps<'tbody'>) {
    return <tbody {...props} />;
}

/** Rows that stay at the bottom while the body scrolls (totals, balances). */
export function TableFooter({ className, ...rest }: ComponentProps<'tfoot'>) {
    return <tfoot className={cx('sticky bottom-0 z-20', className)} {...rest} />;
}

/** A row; its cells light up together on hover. */
export function TableRow({ className, ...rest }: ComponentProps<'tr'>) {
    return <tr className={cx('group', className)} {...rest} />;
}

/**
 * Column heading: small spaced caps, sticky at the top. With `onSort`, it's a
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
                FROSTED,
                'border-tint/[0.07] text-muted-foreground sticky top-0 border-b px-3 py-2.5 align-middle text-xs leading-5 font-medium tracking-wider whitespace-nowrap uppercase',
                sticky === 'left' ? 'left-0 z-30' : 'z-20',
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
                        'hover:text-foreground inline-flex items-center gap-1 align-middle leading-5 tracking-wider uppercase',
                        numeric && 'flex-row-reverse',
                    )}
                >
                    {children}
                    <span aria-hidden className="inline-block w-3 text-xs leading-none">
                        {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : ''}
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
                sticky === 'left' && cx(FROSTED, 'sticky left-0 z-10 shadow-[inset_-1px_0_0_oklch(var(--tint)/0.06)]'),
                numeric && 'text-right tabular-nums',
                className,
            )}
            {...rest}
        />
    );
}

/** A footer cell: sits on the card, above a hairline. Use inside TableFooter. */
export function TableFooterCell({ numeric, sticky, className, ...rest }: TableCellProps) {
    return (
        <td
            className={cx(
                FROSTED,
                'border-tint/[0.07] h-9 border-t px-3 font-medium whitespace-nowrap',
                sticky === 'left' && 'sticky left-0 z-10 shadow-[inset_-1px_0_0_oklch(var(--tint)/0.06)]',
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
        <tr aria-hidden>
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
