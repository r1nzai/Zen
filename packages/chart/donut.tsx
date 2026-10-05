import { useSeen } from '@zen/utils/useSeen';
import { cx } from '@zen/utils/cx';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { type ChartPalette, paletteColor } from './palette';
import { ChartTooltipCard } from './tooltip';

/**
 * A ring of parts of a whole (e.g. spending by category), with your content in
 * the middle (e.g. the total). Segments are parted by a small gap, with
 * rounded corners; pointing at one (or focusing it) lifts it and shows its
 * value. A part too small to show at its share is drawn as a pill, the
 * narrowest segment, taking the room from the larger parts in proportion. Best
 * for a handful of parts: past about six, use bars. Colours default to the
 * chart palette in order.
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
    // The corners' centres: in from the edges and the gap by the corner radius.
    const [r0, r1, inset] = [inner + corner, r - corner, halfGap + corner];
    // The narrowest part: its outer edge cut down to a point, drawn as a pill.
    // No part with a value is drawn narrower, so none is lost.
    const least = 2 * cut(inset, r1);

    const sweeps = shares(items, least);
    const arcs: { start: number; end: number; color: string }[] = [];
    for (let i = 0, angle = -Math.PI / 2; i < items.length; angle += sweeps[i++]) {
        arcs.push({
            start: angle,
            end: angle + sweeps[i],
            color: items[i].color ?? paletteColor(palette, i, items.length),
        });
    }

    const tip = active === null ? null : items[active];
    const tipAngle = active === null ? null : (arcs[active].start + arcs[active].end) / 2;
    const root = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const seen = useSeen(root);

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
        <div
            ref={root}
            data-zen-unseen={seen ? undefined : ''}
            className={cx('zen__donut relative shrink-0', className)}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`${-r} ${-r} ${size} ${size}`}
                role="list"
                aria-label={label}
                className="overflow-visible"
            >
                {arcs.map((a, i) => {
                    // A part with no value has no segment.
                    if (a.end === a.start) return null;
                    // The only segment is the whole ring: it has no ends, so no rounding.
                    const whole = a.end - a.start >= Math.PI * 2 - 1e-6;
                    const d = whole ? sector(inner, r, a.start, a.end) : segment(r0, r1, a.start, a.end, inset, corner);
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
                            onPointerEnter={() => setActive(i)}
                            onPointerLeave={() => setActive(null)}
                            onFocus={() => setActive(i)}
                            onBlur={() => setActive(null)}
                            className="zen__chart-fade focus-visible:outline-hidden"
                            style={{
                                fill: a.color,
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
 * Each part's sweep round the ring, in radians: in proportion to its value, but
 * none with a value narrower than `least`. Parts that would be are drawn at
 * `least`, and the rest share what's left, still in proportion to each other.
 * With too many parts for each to have `least`, all are equal.
 */
function shares(items: DonutChartProps['items'], least: number): number[] {
    const full = Math.PI * 2;
    const values = items.map((it) => it.value).filter((v) => v > 0);
    const sorted = [...values].sort((a, b) => a - b);
    const floor = Math.min(least, full / values.length);
    let rest = values.reduce((s, v) => s + v, 0);
    let raised = 0;
    // A part's share of what the raised parts leave.
    const share = (v: number) => (v / rest) * (full - raised * floor);
    // Raising a part to the floor leaves less for the rest, which can put the next smallest
    // below it too: so raise them smallest first, until one clears it (the largest always would).
    while (raised < sorted.length - 1 && share(sorted[raised]) < floor) rest -= sorted[raised++];
    return items.map((it) => (it.value > 0 ? Math.max(floor, share(it.value)) : 0));
}

/**
 * A point at a radius and angle, for a path. Rounded to a thousandth of a pixel:
 * engines' trigonometry differs in the last digits (Node's and Chrome's do), and
 * the path drawn on the server must match the browser's to hydrate.
 */
function point(rad: number, a: number) {
    return xy([rad * Math.cos(a), rad * Math.sin(a)]);
}
function xy([x, y]: Vec) {
    const round = (v: number) => Math.round(v * 1000) / 1000;
    return `${round(x)},${round(y)}`;
}

type Vec = [number, number];
const at = (rad: number, a: number): Vec => [rad * Math.cos(a), rad * Math.sin(a)];
const plus = ([x, y]: Vec, [dx, dy]: Vec, k: number): Vec => [x + dx * k, y + dy * k];
/** The unit normal to the line from `a` to `b`, on its left: outward, going clockwise round a shape. */
const normal = ([ax, ay]: Vec, [bx, by]: Vec): Vec => {
    const len = Math.hypot(bx - ax, by - ay);
    return [(by - ay) / len, (ax - bx) / len];
};

/**
 * How far round from a line through the centre a point at radius `rad` is `inset`
 * px from it: at most a quarter turn, for a radius no wider than the inset.
 */
function cut(inset: number, rad: number) {
    return rad > inset ? Math.asin(inset / rad) : Math.PI / 2;
}

/**
 * A ring segment, its corners rounded by `c`: the shape whose corners' centres are
 * at radii r0 and r1 and two angles (radians, clockwise from 3 o'clock), each end
 * cut `inset` px inside its boundary line, parallel to it, so neighbours are parted
 * by an even gap. An edge too short for both cuts comes to a point: the narrowest
 * segment is a pill. One outline, so a translucent colour is even all over.
 */
function segment(r0: number, r1: number, a0: number, a1: number, inset: number, c: number): string {
    // Where the edge at a radius starts and ends, once cut; where the cuts cross, its middle.
    const edge = (rad: number) => {
        const [e0, e1] = [a0 + cut(inset, rad), a1 - cut(inset, rad)];
        return e1 < e0 ? [(a0 + a1) / 2, (a0 + a1) / 2] : [e0, e1];
    };
    const [o0, o1] = edge(r1);
    const [i0, i1] = edge(r0);
    const [O0, O1, I1, I0] = [at(r1, o0), at(r1, o1), at(r0, i1), at(r0, i0)];
    const [end, start] = [normal(O1, I1), normal(I0, O0)];
    const arc = (rad: number, from: number, to: number, clockwise: 0 | 1) =>
        from === to ? '' : `A${rad},${rad} 0 ${Math.abs(to - from) > Math.PI ? 1 : 0} ${clockwise} ${point(rad, to)}`;
    const corner = (to: Vec) => `A${c},${c} 0 0 1 ${xy(to)}`;
    // Round the outer edge, down the end, back along the inner edge and up the start.
    return (
        `M${point(r1 + c, o0)}${arc(r1 + c, o0, o1, 1)}${corner(plus(O1, end, c))}L${xy(plus(I1, end, c))}` +
        `${corner(at(r0 - c, i1))}${arc(r0 - c, i1, i0, 0)}${corner(plus(I0, start, c))}L${xy(plus(O0, start, c))}` +
        `${corner(at(r1 + c, o0))}Z`
    );
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
