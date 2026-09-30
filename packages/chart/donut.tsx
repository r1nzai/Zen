import { cx } from '@zen/utils/cx';
import { CSSProperties, ReactNode, useState } from 'react';

import { ChartTooltipCard } from './tooltip';

/**
 * A ring of parts of a whole (e.g. spending by category), with your content in
 * the middle (e.g. the total). Segments are parted by a small gap, with
 * rounded corners; pointing at one (or focusing it) lifts it and shows its
 * value. Best for a handful of parts: past about six, use bars. Colours default
 * to the chart palette in order.
 */
export default function DonutChart({
    items,
    label,
    size = 200,
    thickness = 0.32,
    formatValue = String,
    children,
    className,
}: DonutChartProps) {
    const [active, setActive] = useState<number | null>(null);
    const total = items.reduce((s, it) => s + Math.max(0, it.value), 0);
    const r = size / 2;
    const inner = r * (1 - thickness);
    const corner = Math.min(4, (r - inner) / 4);
    // Each segment gives up this much angle on both sides, for the gap between them.
    const gap = items.filter((it) => it.value > 0).length > 1 ? 2 / r : 0;

    let angle = -Math.PI / 2;
    const arcs = items.map((it, i) => {
        const sweep = total ? (Math.max(0, it.value) / total) * Math.PI * 2 : 0;
        const a = { start: angle, end: angle + sweep, color: it.color ?? `var(--chart-${Math.min(i + 1, 8)})` };
        angle += sweep;
        return a;
    });

    const tip = active === null ? null : items[active];
    return (
        <div className={cx('zen__donut relative shrink-0', className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`${-r} ${-r} ${size} ${size}`}
                role="list"
                aria-label={label}
                className="overflow-visible"
            >
                {arcs.map((a, i) => {
                    if (a.end - a.start <= gap * 2) return null;
                    const mid = (a.start + a.end) / 2;
                    const lift = active === i ? 4 : 0;
                    const pct = total ? Math.round((items[i].value / total) * 100) : 0;
                    return (
                        <path
                            key={items[i].key}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${items[i].label}: ${formatValue(items[i].value)} (${pct}%)`}
                            d={sector(inner + corner, r - corner, a.start + gap + corner / r, a.end - gap - corner / r)}
                            strokeWidth={corner * 2}
                            strokeLinejoin="round"
                            onPointerEnter={() => setActive(i)}
                            onPointerLeave={() => setActive(null)}
                            onFocus={() => setActive(i)}
                            onBlur={() => setActive(null)}
                            className="zen__chart-fade focus-visible:outline-hidden"
                            style={{
                                fill: a.color,
                                stroke: a.color,
                                opacity: active !== null && active !== i ? 0.55 : 1,
                                transform: `translate(${Math.cos(mid) * lift}px, ${Math.sin(mid) * lift}px)`,
                                transition: 'transform 200ms ease-out, opacity 200ms',
                                animationDelay: `${i * 60}ms`,
                                filter: active === i ? `drop-shadow(0 0 10px ${a.color})` : undefined,
                            }}
                        />
                    );
                })}
            </svg>
            {children && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    {children}
                </div>
            )}
            {tip && active !== null && (
                // Beside the segment, on the side it faces, so it never covers the middle or leaves the chart.
                <div
                    className="pointer-events-none absolute z-10 -translate-y-1/2"
                    style={segmentTip((arcs[active].start + arcs[active].end) / 2, r)}
                >
                    <ChartTooltipCard
                        title={tip.label}
                        rows={[
                            {
                                label: `${total ? Math.round((tip.value / total) * 100) : 0}%`,
                                value: formatValue(tip.value),
                                color: arcs[active].color,
                            },
                        ]}
                    />
                </div>
            )}
        </div>
    );
}

/** Where a segment's tooltip goes: just outside the ring at the segment's middle, extending away from the centre. */
function segmentTip(mid: number, r: number): CSSProperties {
    const x = r + Math.cos(mid) * (r + 10);
    const y = r + Math.sin(mid) * (r + 10);
    return Math.cos(mid) >= 0 ? { left: x, top: y } : { right: 2 * r - x, top: y };
}

/** An annular sector between two radii and two angles (radians, clockwise from 3 o'clock). */
function sector(r0: number, r1: number, a0: number, a1: number): string {
    if (a1 <= a0) return '';
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r: number, a: number) => `${r * Math.cos(a)},${r * Math.sin(a)}`;
    // A full ring can't be one arc: split it in two.
    if (a1 - a0 >= Math.PI * 2 - 1e-6) {
        const m = a0 + Math.PI;
        return `M${p(r1, a0)}A${r1},${r1} 0 1 1 ${p(r1, m)}A${r1},${r1} 0 1 1 ${p(r1, a0)}M${p(r0, a0)}A${r0},${r0} 0 1 0 ${p(r0, m)}A${r0},${r0} 0 1 0 ${p(r0, a0)}Z`;
    }
    return `M${p(r1, a0)}A${r1},${r1} 0 ${large} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${large} 0 ${p(r0, a0)}Z`;
}

export interface DonutChartProps {
    /** The parts, in order round the ring from 12 o'clock. */
    items: { key: string; label: string; value: number; color?: string }[];
    /** Names the chart for screen readers. */
    label: string;
    /** Diameter in px. */
    size?: number;
    /** Ring thickness as a share of the radius. */
    thickness?: number;
    /** Values in the tooltip and for screen readers. */
    formatValue?: (value: number) => string;
    /** Content in the middle, e.g. the total. */
    children?: ReactNode;
    className?: string;
}
