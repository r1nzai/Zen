import ArrowTrendingDownMicro from '@zen/icons/micro/arrow-trending-down';
import ArrowTrendingUpMicro from '@zen/icons/micro/arrow-trending-up';
import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * A change, e.g. "+12%" with an arrow, coloured by whether it's good news:
 * savings going up is, spending going up isn't (`good="down"`). `value` is
 * the change as a fraction (0.12 for 12%); children follow it, muted, e.g.
 * "vs last month".
 */
export default function Trend({
    value,
    good = 'up',
    locale,
    format = (v) =>
        new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(
            v,
        ),
    className,
    children,
    ...rest
}: TrendProps) {
    const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    const Arrow = direction === 'up' ? ArrowTrendingUpMicro : direction === 'down' ? ArrowTrendingDownMicro : null;
    return (
        <span className={cx('zen__trend inline-flex items-center gap-1.5 text-xs', className)} {...rest}>
            <span
                data-direction={direction}
                className={cx(
                    'inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-medium whitespace-nowrap tabular-nums',
                    direction === 'flat'
                        ? 'border-tint/10 bg-tint/[0.06] text-muted-foreground'
                        : direction === good
                          ? 'border-glow/30 bg-glow/10 text-primary'
                          : 'border-destructive/40 bg-destructive/10 text-destructive',
                )}
            >
                {Arrow && <Arrow className="size-3.5" />}
                {format(value)}
            </span>
            {children && <span className="text-muted-foreground">{children}</span>}
        </span>
    );
}

export interface TrendProps extends ComponentProps<'span'> {
    /** The change as a fraction: 0.12 is 12% up, -0.05 is 5% down. */
    value: number;
    /** Which way is good news (default `up`); spending would be `down`. */
    good?: 'up' | 'down';
    /** For the default percent format. */
    locale?: string;
    /** How the change reads, e.g. as money instead of a percent. */
    format?: (value: number) => string;
}
