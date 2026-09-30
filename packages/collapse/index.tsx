import Badge, { BadgeProps } from '@zen/badge';
import Popover, { PopoverContent, PopoverTrigger } from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A row showing as many items as fit on one line, and the rest behind a "+N"
 * button that opens them in a popover. It measures the items as rendered (any
 * content, font or style), and fits again whenever the row resizes. Size the
 * row with className (e.g. w-full, max-w-md, gap-1).
 */
export default function Collapse<TData>({
    items,
    data,
    children,
    moreLabel = '',
    badgeVariant = 'secondary',
    badgeClassName,
    className,
}: CollapseProps<TData>) {
    const rowRef = useRef<HTMLDivElement>(null);
    // How many items fit; null while measuring, when every item is rendered (also in server HTML).
    const [count, setCount] = useState<number | null>(null);
    const sizes = useRef({ items: [] as number[], more: 0, gap: 0 });
    const key = items.join('\u0000');

    // New items: render them all to measure again.
    useLayoutEffect(() => setCount(null), [key]);

    useLayoutEffect(() => {
        const row = rowRef.current;
        if (!row) return;
        const fit = () => {
            const { items: widths, more, gap } = sizes.current;
            const room = row.clientWidth;
            const all = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);
            if (all <= room) return widths.length;
            // As many as fit with the "+N" button after them.
            let used = more;
            let n = 0;
            while (n < widths.length && used + widths[n] + gap <= room) used += widths[n++] + gap;
            return n;
        };
        if (count === null) {
            const cells = Array.from(row.querySelectorAll<HTMLElement>(':scope > [data-collapse-item]'));
            const moreEl = row.querySelector<HTMLElement>(':scope > [data-collapse-more]');
            sizes.current = {
                items: cells.map((c) => c.offsetWidth),
                more: moreEl?.offsetWidth ?? 0,
                gap: parseFloat(getComputedStyle(row).columnGap) || 0,
            };
            setCount(fit());
            return;
        }
        // Items keep their widths when the row resizes: fit again without re-measuring.
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setCount(fit()));
        observer.observe(row);
        return () => observer.disconnect();
    }, [count, key]);

    // Web fonts arriving change the items' widths: measure again.
    useEffect(() => {
        let live = true;
        document.fonts?.ready.then(() => live && setCount(null));
        return () => {
            live = false;
        };
    }, []);

    const shown = count ?? items.length;
    const hidden = items.slice(shown);
    const label = (n: number) => `+${n}${moreLabel ? ` ${moreLabel}` : ''}`;

    return (
        <div ref={rowRef} className={cx('zen__collapse flex min-w-0 items-center overflow-hidden', className)}>
            {items.slice(0, shown).map((item, i) => (
                <span key={item} data-collapse-item className="flex shrink-0">
                    {children(item, i, data?.[i])}
                </span>
            ))}
            {count === null ? (
                // Measured at its widest (every item hidden), never seen.
                <span data-collapse-more aria-hidden className="invisible flex shrink-0">
                    <Badge variant={badgeVariant} className={badgeClassName}>
                        {label(items.length)}
                    </Badge>
                </span>
            ) : (
                hidden.length > 0 && (
                    <Popover>
                        <PopoverTrigger
                            data-collapse-more
                            // Its own control: a click doesn't also reach what the row sits in (a Combobox field).
                            onClick={(e) => e.stopPropagation()}
                            className="flex shrink-0 rounded-md"
                            aria-label={`Show ${label(hidden.length).slice(1)}`}
                        >
                            <Badge variant={badgeVariant} className={cx('cursor-pointer', badgeClassName)}>
                                {label(hidden.length)}
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent aria-label={label(hidden.length).slice(1)}>
                            <div className="grid max-h-60 grid-flow-row grid-cols-2 gap-3 overflow-auto p-2">
                                {hidden.map((item, i) => (
                                    <span key={item} className="flex">
                                        {children(item, shown + i, data?.[shown + i])}
                                    </span>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )
            )}
        </div>
    );
}

export interface CollapseProps<TData> {
    items: string[];
    /** Extra data per item, passed to `children` with it. */
    data?: TData[];
    /** Renders one item (in the row, or in the popover when it doesn't fit). */
    children: (item: string, index: number, itemData?: TData) => ReactNode;
    /** Text after the count on the "+N" button, e.g. "tags". */
    moreLabel?: string;
    badgeVariant?: BadgeProps['variant'];
    /** Classes for the "+N" badge. */
    badgeClassName?: string;
    /** Classes for the row: its width, and the gap between items. */
    className?: string;
}
