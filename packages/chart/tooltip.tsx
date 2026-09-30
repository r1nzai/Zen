import { cx } from '@zen/utils/cx';
import { ReactNode } from 'react';

export type Kind = 'area' | 'line' | 'bar';

/**
 * The tooltip's card: a title and one row per series, the value first and the
 * series keyed by a short stroke of its colour. Use it in `renderTooltip` to
 * show your own rows.
 */
export function ChartTooltipCard({ title, rows, className }: ChartTooltipCardProps) {
    return (
        <div className={cx('glass glass-blur min-w-40 rounded-xl px-3 py-2.5 text-xs whitespace-nowrap', className)}>
            <div className="text-foreground mb-1.5 font-medium">{title}</div>
            <dl className="flex flex-col gap-1">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground flex items-center gap-1.5">
                            {r.color && <Key color={r.color} dashed={r.dashed} />}
                            {r.label}
                        </dt>
                        <dd className="text-foreground font-medium tabular-nums">{r.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/**
 * A series' key: a short line for lines (dashed if the series is), a rounded swatch for
 * bars and areas; `faded` as a bar's dimmed rows are drawn.
 */
export function Key({
    color,
    dashed,
    kind = 'line',
    faded,
}: {
    color: string;
    dashed?: boolean;
    kind?: Kind;
    faded?: boolean;
}) {
    if (kind === 'line' || dashed)
        return (
            <svg viewBox="0 0 12 4" aria-hidden className="h-1 w-3 shrink-0 overflow-visible">
                <line
                    x1="0.5"
                    y1="2"
                    x2="11.5"
                    y2="2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={dashed ? '3 3' : undefined}
                    style={{ stroke: color }}
                />
            </svg>
        );
    return (
        <span
            aria-hidden
            className={cx('size-2.5 shrink-0 rounded-[3px]', faded && 'opacity-40')}
            style={{ background: color }}
        />
    );
}

export interface ChartTooltipCardProps {
    title: ReactNode;
    rows: { label: string; value: string; color?: string; dashed?: boolean }[];
    className?: string;
}
