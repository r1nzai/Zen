import { cx } from '@zen/utils/cx';
import { FLICK_SPEED, useSwipe } from '@zen/utils/swipe';
import { ComponentProps, ReactNode, useRef, useState } from 'react';

import { TableRow } from './index';

/**
 * A row whose actions sit behind it: swipe it left to reveal them, right (or
 * tap the row) to put them away. They also come out when focused, so the
 * keyboard reaches them. Use it in a TableContainer.
 */
export function TableSwipeRow({
    actions,
    ref,
    className,
    children,
    onClickCapture,
    onBlur,
    ...rest
}: TableSwipeRowProps) {
    const row = useRef<HTMLTableRowElement>(null);
    const tray = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const width = () => tray.current?.offsetWidth ?? 0;
    const show = (px: number) => row.current?.style.setProperty('--zen-row-swipe', `${Math.max(0, px)}px`);
    const settle = (next: boolean) => {
        show(next ? width() : 0);
        setOpen(next);
    };
    // Past the actions' width, the row only gives a little.
    const resist = (px: number) => (px > width() ? width() + (px - width()) / 4 : px);

    useSwipe(
        row,
        { axis: 'x', sign: open ? 1 : -1 },
        {
            move: (d) => show(resist(open ? width() - d : d)),
            release: (d, speed) => settle(open !== (d > width() / 2 || speed > FLICK_SPEED)),
            cancel: () => settle(open),
        },
    );

    return (
        <TableRow
            ref={(node) => {
                row.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            data-open={open || undefined}
            className={cx('zen__swipe-row relative', className)}
            onClickCapture={(e) => {
                onClickCapture?.(e);
                if (!open || tray.current?.contains(e.target as Node)) return;
                e.preventDefault();
                e.stopPropagation();
                settle(false);
            }}
            onBlur={(e) => {
                onBlur?.(e);
                if (open && !e.currentTarget.contains(e.relatedTarget)) settle(false);
            }}
            {...rest}
        >
            {children}
            <td className="zen__swipe-actions border-tint/[0.045] absolute inset-y-0 left-full flex w-(--zen-row-swipe,0px) justify-end overflow-hidden border-b p-0">
                <div
                    ref={tray}
                    onFocus={() => !open && settle(true)}
                    onClick={() => settle(false)}
                    className="flex shrink-0 items-stretch"
                >
                    {actions}
                </div>
            </td>
        </TableRow>
    );
}

/** One of a swipe row's actions: fills the row's height, flush with its end. */
export function TableSwipeAction({ tone = 'default', className, ...rest }: TableSwipeActionProps) {
    return (
        <button
            type="button"
            className={cx(
                'focus-visible:ring-ring/60 cursor-pointer px-4 text-sm font-medium whitespace-nowrap outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-inset',
                tone === 'destructive'
                    ? 'bg-destructive/90 text-destructive-foreground hover:bg-destructive'
                    : 'bg-tint/[0.09] hover:bg-tint/[0.14]',
                className,
            )}
            {...rest}
        />
    );
}

export interface TableSwipeActionProps extends ComponentProps<'button'> {
    tone?: 'default' | 'destructive';
}

export interface TableSwipeRowProps extends ComponentProps<'tr'> {
    /** What's behind the row: TableSwipeActions, e.g. Edit and Delete. */
    actions: ReactNode;
    selected?: boolean;
}
