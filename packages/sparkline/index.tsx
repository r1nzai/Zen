import { cx } from '@zen/utils/cx';
import { useSeen } from '@zen/utils/useSeen';
import { ComponentProps, useId, useRef } from 'react';

/**
 * A small line of how a number has moved (a balance over a month, spending by
 * week), with no axes: for beside a figure in a Stat or a table row. It takes
 * its size from className (e.g. h-8 w-24) and draws itself in.
 */
export default function Sparkline({ values, area = true, tone = 'primary', className, ref, ...rest }: SparklineProps) {
    const gradient = useId();
    const svg = useRef<SVGSVGElement>(null);
    const seen = useSeen(svg);
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    // In a 100×40 box, inset so the 2px line isn't cut at the top and bottom.
    const points = values.map((v, i) => [(i / (values.length - 1)) * 100, 38 - ((v - min) / span) * 36] as const);
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
    const color =
        tone === 'primary'
            ? 'var(--color-primary)'
            : tone === 'negative'
              ? 'var(--color-destructive)'
              : 'var(--color-muted-foreground)';
    const first = values[0];
    const last = values[values.length - 1];
    return (
        <svg
            ref={(node) => {
                svg.current = node;
                if (typeof ref === 'function') return ref(node);
                if (ref) ref.current = node;
            }}
            data-zen-unseen={seen ? undefined : ''}
            role="img"
            aria-label={`From ${first} to ${last}`}
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className={cx('zen__sparkline h-8 w-24 overflow-visible', className)}
            style={{ color }}
            {...rest}
        >
            {area && (
                <>
                    <defs>
                        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
                            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path className="zen__chart-fade" d={`${line}L100,40L0,40Z`} fill={`url(#${gradient})`} />
                </>
            )}
            <path
                className="zen__chart-draw"
                d={line}
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export interface SparklineProps extends Omit<ComponentProps<'svg'>, 'values'> {
    values: number[];
    /** A soft fill under the line. */
    area?: boolean;
    /** The accent (`primary`), red (`negative`), or grey (`muted`). */
    tone?: 'primary' | 'negative' | 'muted';
}
