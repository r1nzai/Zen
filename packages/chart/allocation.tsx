import { cx } from '@zen/utils/cx';
import { useSeen } from '@zen/utils/useSeen';
import { CSSProperties, useRef, useState } from 'react';

import { type ChartPalette, paletteColor } from './palette';

/**
 * Where a whole went, as one bar split into its parts (e.g. income across
 * spending, savings and bills), with a legend of each part's value and share.
 * Pointing at a part, in the bar or the legend, picks it out; screen readers
 * hear every part's value and share from the bar's label. Sweeps in from
 * the start the first time it's seen. Colours default to the chart palette in
 * order, like DonutChart's.
 */
export default function AllocationBar({
    items,
    label,
    palette = 'chart',
    formatValue = String,
    locale,
    legend = true,
    className,
}: AllocationBarProps) {
    const [active, setActive] = useState<string | null>(null);
    const root = useRef<HTMLDivElement>(null);
    const seen = useSeen(root);
    const parts = items.filter((it) => it.value > 0);
    const total = parts.reduce((s, it) => s + it.value, 0);
    const color = (key: string) => {
        const i = items.findIndex((it) => it.key === key);
        return items[i].color ?? paletteColor(palette, i, items.length);
    };
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    const describe = (it: AllocationItem) =>
        `${it.label}: ${formatValue(it.value)}, ${percent.format(total ? it.value / total : 0)}`;

    return (
        <div
            ref={root}
            data-zen-unseen={seen ? undefined : ''}
            className={cx('zen__allocation flex flex-col gap-3', className)}
        >
            <div
                role="img"
                aria-label={`${label}. ${parts.map(describe).join('; ')}`}
                className="zen__chart-sweep flex h-3 gap-0.5 overflow-hidden rounded-full"
            >
                {parts.map((it) => (
                    <span
                        key={it.key}
                        data-active={active === it.key || undefined}
                        data-dimmed={(active !== null && active !== it.key) || undefined}
                        onPointerEnter={() => setActive(it.key)}
                        onPointerLeave={() => setActive(null)}
                        className="min-w-1 transition-[opacity,filter] duration-200 first:rounded-s-full last:rounded-e-full data-active:[filter:drop-shadow(0_0_8px_var(--part))] data-dimmed:opacity-35"
                        style={
                            {
                                flexGrow: it.value,
                                flexBasis: 0,
                                background: color(it.key),
                                '--part': color(it.key),
                            } as CSSProperties
                        }
                    />
                ))}
            </div>
            {legend && (
                // The bar's label reads every part out; this is the same, to look at.
                <ul aria-hidden className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    {items.map((it) => (
                        <li
                            key={it.key}
                            onPointerEnter={() => setActive(it.key)}
                            onPointerLeave={() => setActive(null)}
                            data-dimmed={(active !== null && active !== it.key) || undefined}
                            className="flex items-center gap-2 transition-opacity duration-200 data-dimmed:opacity-50"
                        >
                            <span
                                aria-hidden
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ background: color(it.key) }}
                            />
                            <span className="min-w-0 flex-1 truncate">{it.label}</span>
                            <span className="tabular-nums">{formatValue(it.value)}</span>
                            <span className="text-muted-foreground w-10 text-end tabular-nums">
                                {percent.format(total ? Math.max(0, it.value) / total : 0)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export interface AllocationItem {
    key: string;
    label: string;
    value: number;
    color?: string;
}

export interface AllocationBarProps {
    items: AllocationItem[];
    /** What the whole is, e.g. "Income in September", for screen readers. */
    label: string;
    /** Colours for items that don't give their own: the categorical palette (default), or shades of the theme's glow. */
    palette?: ChartPalette;
    formatValue?: (value: number) => string;
    /** For the shares' percent format. */
    locale?: string;
    /** The list of parts under the bar (default on). */
    legend?: boolean;
    className?: string;
}
