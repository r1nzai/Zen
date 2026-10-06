import XMark from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { Children, ComponentProps, ReactNode } from 'react';

/**
 * The filters in effect, as chips each removed with its ×, and "Clear all"
 * once there are two or more. Renders nothing when no filter is set.
 */
export default function FilterBar({
    onClear,
    clearLabel = 'Clear all',
    'aria-label': label = 'Active filters',
    className,
    children,
    ...rest
}: FilterBarProps) {
    const count = Children.toArray(children).length;
    if (count === 0) return null;
    return (
        <div
            role="group"
            aria-label={label}
            className={cx('zen__filter-bar flex flex-wrap items-center gap-1.5', className)}
            {...rest}
        >
            {children}
            {count > 1 && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 touch-target ml-1 cursor-pointer rounded-md px-1.5 py-1 text-xs outline-hidden focus-visible:ring-2"
                >
                    {clearLabel}
                </button>
            )}
        </div>
    );
}

/** One filter in a FilterBar: what it is (e.g. "Amount: $50–$500"), and its × to remove it. */
export function FilterChip({ onRemove, removeLabel = 'Remove filter', className, children }: FilterChipProps) {
    return (
        <span
            className={cx(
                'zen__filter-chip bg-primary/12 text-foreground inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)]',
                className,
            )}
        >
            {children}
            <button
                type="button"
                aria-label={removeLabel}
                onClick={onRemove}
                className="text-muted-foreground hover:text-foreground hover:bg-tint/10 focus-visible:ring-ring/50 touch-target grid size-5 cursor-pointer place-items-center rounded-full outline-hidden focus-visible:ring-2"
            >
                <XMark className="size-3" />
            </button>
        </span>
    );
}

export interface FilterBarProps extends ComponentProps<'div'> {
    /** Removes every filter; shown as "Clear all" once there are two or more. */
    onClear?: () => void;
    clearLabel?: ReactNode;
}

export interface FilterChipProps {
    onRemove: () => void;
    /** The × button's name for screen readers, e.g. "Remove amount filter". */
    removeLabel?: string;
    className?: string;
    children: ReactNode;
}
