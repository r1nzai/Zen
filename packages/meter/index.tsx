import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode, useId } from 'react';

/**
 * A measure against a limit, e.g. spend against a budget: a bar with a label,
 * a figure and a note. Over the limit it turns red; near it, warm. Announced
 * as a meter, with `valueText` read out instead of the bare number.
 */
export default function Meter({
    value,
    max = 100,
    label,
    detail,
    hint,
    valueText,
    tone = 'auto',
    warnAt = 0.85,
    className,
    ...rest
}: MeterProps) {
    const labelId = useId();
    const over = value > max;
    const ratio = max > 0 ? value / max : value > 0 ? 1 : 0;
    const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));
    const resolved = tone !== 'auto' ? tone : over ? 'danger' : ratio >= warnAt ? 'warning' : 'default';
    return (
        <div
            {...rest}
            role="meter"
            aria-labelledby={label ? labelId : rest['aria-labelledby']}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Math.min(value, max)}
            aria-valuetext={valueText}
            className={cx('zen__meter grid grid-cols-2 gap-y-1.5', className)}
        >
            {label && (
                <span id={labelId} className="text-sm font-medium">
                    {label}
                </span>
            )}
            {detail && (
                <span
                    className={cx(
                        'col-start-2 text-right text-sm tabular-nums',
                        resolved === 'danger' ? 'text-destructive' : 'text-muted-foreground',
                    )}
                >
                    {detail}
                </span>
            )}
            <div className="bg-muted col-span-2 h-2 overflow-hidden rounded-full">
                <div
                    className={cx(
                        'h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                        resolved === 'danger'
                            ? 'bg-destructive shadow-[0_0_12px_oklch(var(--destructive)/0.7)]'
                            : resolved === 'warning'
                              ? 'bg-accent-foreground shadow-[0_0_12px_oklch(var(--accent-foreground)/0.6)]'
                              : 'from-primary to-glow-2 bg-gradient-to-r shadow-[0_0_12px_oklch(var(--glow)/0.6)]',
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {hint && (
                <span
                    className={cx(
                        'col-span-2 text-xs',
                        resolved === 'danger' ? 'text-destructive' : 'text-muted-foreground',
                    )}
                >
                    {hint}
                </span>
            )}
        </div>
    );
}

/** Also takes the element's own props, e.g. `aria-label` when there's no visible label. */
export interface MeterProps extends Omit<ComponentProps<'div'>, 'children'> {
    value: number;
    /** The limit (default 100). Values past it fill the bar and turn it red. */
    max?: number;
    label?: ReactNode;
    /** Top right, e.g. "₹8,200 / ₹10,000". */
    detail?: ReactNode;
    /** Below the bar, e.g. "₹1,800 left". */
    hint?: ReactNode;
    /** What screen readers say for the value, e.g. "₹8,200 of ₹10,000, ₹1,800 left". */
    valueText?: string;
    /** `auto` picks warning past `warnAt` of max and danger past max. */
    tone?: 'auto' | 'default' | 'warning' | 'danger';
    /** Fraction of max where `auto` turns to warning (default 0.85). */
    warnAt?: number;
    className?: string;
}
