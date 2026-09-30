import { cx } from '@zen/utils/cx';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { type ChartPalette, paletteColor } from './palette';
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
    palette = 'chart',
    formatValue = String,
    children,
    className,
}: DonutChartProps) {
    const [active, setActive] = useState<number | null>(null);
    const total = items.reduce((s, it) => s + Math.max(0, it.value), 0);
    const r = size / 2;
    const inner = r * (1 - thickness);
    const corner = Math.min(4, (r - inner) / 4);
    // Half the gap between segments, in px. The same width all the way across, so the
    // gaps have parallel sides (a fixed angle would make wedges, wider at the rim).
    const halfGap = items.filter((it) => it.value > 0).length > 1 ? 1.5 : 0;

    let angle = -Math.PI / 2;
    const arcs = items.map((it, i) => {
        const sweep = total ? (Math.max(0, it.value) / total) * Math.PI * 2 : 0;
        const a = { start: angle, end: angle + sweep, color: it.color ?? paletteColor(palette, i, items.length) };
        angle += sweep;
        return a;
    });

    const tip = active === null ? null : items[active];
    const tipAngle = active === null ? null : (arcs[active].start + arcs[active].end) / 2;
    const root = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);

    // The tooltip is in the top layer, placed against the ring, so no container that
    // clips its overflow cuts it off; it follows the ring when the page scrolls.
    useLayoutEffect(() => {
        const el = tipRef.current;
        if (tipAngle === null || !el || !root.current) return;
        try {
            el.showPopover?.();
        } catch {
            // Already showing.
        }
        const place = () => {
            const box = root.current!.getBoundingClientRect();
            const x = box.left + r + Math.cos(tipAngle) * (r + 10);
            const y = box.top + r + Math.sin(tipAngle) * (r + 10);
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const clamp = (v: number, max: number) => Math.max(EDGE, Math.min(v, max - EDGE));
            el.style.left = `${clamp(Math.cos(tipAngle) >= 0 ? x : x - w, document.documentElement.clientWidth - w)}px`;
            el.style.top = `${clamp(y - h / 2, window.innerHeight - h)}px`;
        };
        place();
        window.addEventListener('scroll', place, { passive: true, capture: true });
        window.addEventListener('resize', place, { passive: true });
        return () => {
            window.removeEventListener('scroll', place, { capture: true });
            window.removeEventListener('resize', place);
        };
    }, [tipAngle, r]);

    return (
        <div ref={root} className={cx('zen__donut relative shrink-0', className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`${-r} ${-r} ${size} ${size}`}
                role="list"
                aria-label={label}
                className="overflow-visible"
            >
                {arcs.map((a, i) => {
                    // The only segment is the whole ring: it has no ends, so no rounding. Its exact shape, with
                    // no rounding stroke, whose start and end would meet in a seam at the top.
                    const whole = a.end - a.start >= Math.PI * 2 - 1e-6;
                    // Parts shrink by the gap and the corner radius; the stroke adds the corner
                    // back, rounded.
                    const d = whole
                        ? sector(inner, r, a.start, a.end)
                        : segment(inner + corner, r - corner, a.start, a.end, halfGap + corner);
                    if (!d) return null;
                    const mid = (a.start + a.end) / 2;
                    const lift = active === i && !whole ? 4 : 0;
                    const pct = total ? Math.round((items[i].value / total) * 100) : 0;
                    return (
                        <path
                            key={items[i].key}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${items[i].label}: ${formatValue(items[i].value)} (${pct}%)`}
                            d={d}
                            strokeWidth={whole ? 0 : corner * 2}
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
                // Stacked together in the middle, however many elements you pass.
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    {children}
                </div>
            )}
            {tip && active !== null && (
                // Beside the segment, on the side it faces, so it never covers the middle.
                <div
                    ref={tipRef}
                    popover="manual"
                    className="pointer-events-none fixed inset-auto m-0 overflow-visible border-0 bg-transparent p-0"
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

const EDGE = 8; // the tooltip is kept this far inside the viewport

/**
 * A point at a radius and angle, for a path. Rounded to a thousandth of a pixel:
 * engines' trigonometry differs in the last digits (Node's and Chrome's do), and
 * the path drawn on the server must match the browser's to hydrate.
 */
function point(rad: number, a: number) {
    const round = (v: number) => Math.round(v * 1000) / 1000;
    return `${round(rad * Math.cos(a))},${round(rad * Math.sin(a))}`;
}

/**
 * A ring segment between two radii and two angles (radians, clockwise from 3
 * o'clock), with each end cut `inset` px inside its boundary line, parallel to
 * it: so neighbours are parted by an even gap. Narrow enough that the inner
 * edge would cross itself, it comes to a point there. Empty if nothing's left.
 */
function segment(r0: number, r1: number, a0: number, a1: number, inset: number): string {
    const within = (rad: number) => Math.asin(Math.min(1, inset / rad));
    const [o0, o1] = [a0 + within(r1), a1 - within(r1)];
    if (o1 <= o0) return '';
    let [i0, i1] = [a0 + within(r0), a1 - within(r0)];
    if (i1 < i0) i0 = i1 = (a0 + a1) / 2;
    const outer = `M${point(r1, o0)}A${r1},${r1} 0 ${o1 - o0 > Math.PI ? 1 : 0} 1 ${point(r1, o1)}`;
    const back =
        i1 > i0
            ? `L${point(r0, i1)}A${r0},${r0} 0 ${i1 - i0 > Math.PI ? 1 : 0} 0 ${point(r0, i0)}`
            : `L${point(r0, i0)}`;
    return `${outer}${back}Z`;
}

/** An annular sector between two radii and two angles (radians, clockwise from 3 o'clock). */
function sector(r0: number, r1: number, a0: number, a1: number): string {
    if (a1 <= a0) return '';
    const large = a1 - a0 > Math.PI ? 1 : 0;
    // A full ring can't be one arc: split it in two.
    if (a1 - a0 >= Math.PI * 2 - 1e-6) {
        const m = a0 + Math.PI;
        return `M${point(r1, a0)}A${r1},${r1} 0 1 1 ${point(r1, m)}A${r1},${r1} 0 1 1 ${point(r1, a0)}M${point(r0, a0)}A${r0},${r0} 0 1 0 ${point(r0, m)}A${r0},${r0} 0 1 0 ${point(r0, a0)}Z`;
    }
    return `M${point(r1, a0)}A${r1},${r1} 0 ${large} 1 ${point(r1, a1)}L${point(r0, a1)}A${r0},${r0} 0 ${large} 0 ${point(r0, a0)}Z`;
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
    /** Colours for items that don't give their own: the categorical palette (default), or shades of the theme's glow. */
    palette?: ChartPalette;
    /** Content in the middle, e.g. the total. */
    children?: ReactNode;
    className?: string;
}
