import { useSeen } from '@zen/utils/useSeen';
import { cx } from '@zen/utils/cx';

import { type ChartPalette, paletteColor } from './palette';
import { ChartTooltipCard, Key, type Kind } from './tooltip';
import {
    Children,
    ComponentType,
    CSSProperties,
    isValidElement,
    KeyboardEvent,
    PointerEvent,
    ReactElement,
    ReactNode,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';

type Row = Record<string, unknown>;

/*
 * The series parts only describe themselves; Chart reads their props and draws
 * everything on one shared axis, so scales, the crosshair, the tooltip and the
 * legend all agree.
 */

/** A line with a soft fill down to the baseline. */
export const ChartArea: (props: ChartAreaProps) => null = () => null;

/** A 2px line. Gaps (null values) break it, so one series can be split into solid and dashed parts. */
export const ChartLine: (props: ChartLineProps) => null = () => null;

/** Bars, grouped with the other bar series, growing from the baseline. */
export const ChartBar: (props: ChartBarProps) => null = () => null;

/** A marker across the plot: a horizontal line at `y` (e.g. zero), or a vertical one at the row whose x is `x` (e.g. today). */
export const ChartReference: (props: ChartReferenceProps) => null = () => null;

const KINDS = new Map<unknown, Kind>([
    [ChartArea, 'area'],
    [ChartLine, 'line'],
    [ChartBar, 'bar'],
]);

interface Series extends ChartSeriesProps {
    kind: Kind;
    color: string;
    curve?: ChartAreaProps['curve'];
    dim?: ChartBarProps['dim'];
    dimLabel?: ChartBarProps['dimLabel'];
}

const MARGIN = { top: 12, right: 8, bottom: 26 };
const TICK = 11; // axis text size, px

/**
 * A chart on one axis: areas, lines and bars over rows of data (e.g. months),
 * with a recessive grid, a crosshair and a tooltip listing every series at the
 * pointer (or keyboard: focus it and use the arrow keys), a legend for two or
 * more series, and a table of the values for screen readers. Series draw in
 * as they appear. Colours default to the chart palette (--chart-1…8) in the
 * order the series are written; give each its own `color` for meaning (e.g.
 * the theme's glow).
 */
export default function Chart<T extends Row, X extends keyof T & string = keyof T & string>({
    data,
    x,
    label,
    summary,
    height = 240,
    formatX = String,
    formatY = compact,
    formatTooltipX,
    renderTooltip,
    legend,
    palette = 'chart',
    className,
    children,
}: ChartProps<T, X>) {
    const id = useId().replace(/[^\w-]/g, '');
    const wrap = useRef<HTMLDivElement>(null);
    const width = useWidth(wrap);
    const seen = useSeen(wrap);
    const [active, setActive] = useState<number | null>(null);
    const [pointer, setPointer] = useState<{ y: number } | null>(null);

    /*
     * Everything drawn from the data is worked out and rendered once per data,
     * size or series change, not on every pointer move: hovering only redraws
     * the crosshair, markers and tooltip (and the bars' dimming when the row
     * under the pointer changes).
     */
    const geo = useMemo(() => {
        const parts = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
        const count = parts.filter((p) => KINDS.has(p.type as ComponentType)).length;
        const series: Series[] = [];
        const refs: ChartReferenceProps[] = [];
        for (const p of parts) {
            if (p.type === ChartReference) refs.push(p.props as unknown as ChartReferenceProps);
            const kind = KINDS.get(p.type as ComponentType);
            if (!kind) continue;
            const given = p.props as unknown as Series;
            series.push({ ...given, kind, color: given.color ?? paletteColor(palette, series.length, count) });
        }

        const rows = data as readonly Row[];

        // Y: every value drawn, and the baseline when something is filled down to it.
        const values = series
            .flatMap((s) => rows.map((r) => value(r, s.dataKey)))
            .filter((v): v is number => v !== null);
        for (const r of refs) if (r.y !== undefined) values.push(r.y);
        if (series.some((s) => s.kind !== 'line')) values.push(0);
        const ticks = niceTicks(values.length ? Math.min(...values) : 0, values.length ? Math.max(...values) : 1);
        const [lo, hi] = [ticks[0], ticks[ticks.length - 1]];
        const tickLabels = ticks.map((t) => formatY(t));
        const left = Math.ceil(Math.max(...tickLabels.map((l) => l.length)) * TICK * 0.62) + 10;

        const plotW = Math.max(0, width - left - MARGIN.right);
        const plotH = Math.max(0, height - MARGIN.top - MARGIN.bottom);
        const n = rows.length;
        const bars = series.filter((s) => s.kind === 'bar');
        // With bars, each row gets a band; without, points run edge to edge.
        const banded = bars.length > 0 || n === 1;
        const step = n ? (banded ? plotW / n : plotW / (n - 1)) : 0;
        const cx0 = (i: number) => left + (banded ? (i + 0.5) * step : i * step);
        const cy = (v: number) => MARGIN.top + (hi === lo ? plotH / 2 : ((hi - v) / (hi - lo)) * plotH);
        const base = cy(Math.min(Math.max(0, lo), hi));

        const barW = bars.length ? Math.max(2, Math.min(24, (step * 0.72) / bars.length - 2)) : 0;
        const barX = (i: number, k: number) => cx0(i) - (bars.length * (barW + 2) - 2) / 2 + k * (barW + 2);

        // X labels: as many as fit without touching.
        const xLabels = rows.map((r) => formatX(r[x] as never));
        const widest = Math.max(1, ...xLabels.map((l) => l.length)) * TICK * 0.6 + 12;
        const every = step ? Math.max(1, Math.ceil(widest / step)) : 1;

        // Behind the hover band: gradients, grid and axis labels.
        const back = (
            <>
                <defs>
                    {series.map((s, k) =>
                        s.kind === 'area' ? (
                            <linearGradient key={k} id={`${id}-fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" style={{ stopColor: s.color }} stopOpacity={s.dashed ? 0.16 : 0.32} />
                                <stop offset="100%" style={{ stopColor: s.color }} stopOpacity={0} />
                            </linearGradient>
                        ) : null,
                    )}
                </defs>

                {/* Grid and axes: hairlines one step off the surface. */}
                {ticks.map((t, i) => (
                    <g key={t}>
                        <line
                            x1={left}
                            x2={left + plotW}
                            y1={cy(t)}
                            y2={cy(t)}
                            className="stroke-tint/[0.07]"
                            shapeRendering="crispEdges"
                        />
                        <text
                            x={left - 8}
                            y={cy(t)}
                            dy="0.32em"
                            textAnchor="end"
                            className="fill-muted-foreground tabular-nums"
                            style={{ fontSize: TICK }}
                        >
                            {tickLabels[i]}
                        </text>
                    </g>
                ))}
                {xLabels.map((l, i) =>
                    i % every === 0 ? (
                        <text
                            key={i}
                            x={cx0(i)}
                            y={height - 8}
                            textAnchor={
                                !bars.length && n > 1 && i === 0
                                    ? 'start'
                                    : !bars.length && i === n - 1
                                      ? 'end'
                                      : 'middle'
                            }
                            className="fill-muted-foreground"
                            style={{ fontSize: TICK }}
                        >
                            {l}
                        </text>
                    ) : null,
                )}
            </>
        );

        // Above the bars: lines, areas and reference markers.
        const front = (
            <>
                {series.map((s, k) => {
                    if (s.kind === 'bar') return null;
                    const pts = rows.map((r, i) => {
                        const v = value(r, s.dataKey);
                        return v === null ? null : ([cx0(i), cy(v)] as const);
                    });
                    return segments(pts).map((seg, j) => {
                        const d = (s.curve === 'linear' ? linearPath : monotonePath)(seg);
                        return (
                            <g key={`${k}-${j}`}>
                                {s.kind === 'area' && (
                                    <path
                                        d={`${d}L${seg[seg.length - 1][0]},${base}L${seg[0][0]},${base}Z`}
                                        fill={`url(#${id}-fill-${k})`}
                                        className="zen__chart-fade"
                                    />
                                )}
                                <path
                                    d={d}
                                    fill="none"
                                    strokeWidth={s.kind === 'area' && !s.dashed ? 2.5 : 2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    // Solid lines draw themselves in; dashed ones (their dashes are the pattern) fade in.
                                    pathLength={s.dashed ? undefined : 1}
                                    strokeDasharray={s.dashed ? '5 5' : undefined}
                                    className={s.dashed ? 'zen__chart-fade' : 'zen__chart-draw'}
                                    style={{ stroke: s.color }}
                                />
                            </g>
                        );
                    });
                })}

                {refs.map((r, i) => {
                    const tone = r.tone === 'destructive' ? 'stroke-destructive/45' : 'stroke-muted-foreground/60';
                    if (r.y !== undefined)
                        return (
                            <line
                                key={i}
                                x1={left}
                                x2={left + plotW}
                                y1={cy(r.y)}
                                y2={cy(r.y)}
                                className={tone}
                                strokeDasharray={r.dashed ? '3 4' : undefined}
                                shapeRendering="crispEdges"
                            />
                        );
                    const at = rows.findIndex((row) => row[x] === r.x);
                    if (at < 0) return null;
                    // Its label sits left of the line, or right of it where the plot has no room
                    // on the left (it would run into the y-axis labels).
                    const right = !!r.label && cx0(at) - 6 - r.label.length * TICK * 0.6 < left;
                    return (
                        <g key={i}>
                            <line
                                x1={cx0(at)}
                                x2={cx0(at)}
                                y1={MARGIN.top}
                                y2={MARGIN.top + plotH}
                                className={tone}
                                strokeDasharray={r.dashed === false ? undefined : '3 4'}
                            />
                            {r.label && (
                                <text
                                    x={cx0(at) + (right ? 6 : -6)}
                                    y={MARGIN.top + 4}
                                    dy="0.7em"
                                    textAnchor={right ? 'start' : 'end'}
                                    className="fill-muted-foreground"
                                    style={{ fontSize: TICK }}
                                >
                                    {r.label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </>
        );

        return { series, rows, n, bars, banded, step, left, plotH, cx0, cy, base, barW, barX, back, front };
    }, [children, data, x, width, height, formatX, formatY, id, palette]);

    const { series, rows, n, bars, banded, step, left, plotH, cx0, cy, base, barW, barX } = geo;

    // Bars dim beside the row under the pointer, so they're redrawn only when that row changes.
    const barMarks = useMemo(
        () =>
            bars.map((s, k) =>
                rows.map((r, i) => {
                    const v = value(r, s.dataKey);
                    if (v === null) return null;
                    const y = cy(v);
                    const h = Math.abs(base - y);
                    const neg = v < 0;
                    return (
                        <path
                            key={`${k}-${i}`}
                            d={barPath(barX(i, k), neg ? base : y, barW, h, neg)}
                            data-negative={neg || undefined}
                            className="zen__chart-grow transition-opacity duration-200"
                            style={{
                                fill: s.color,
                                opacity: (s.dim?.(r, i) ? 0.35 : 0.9) * (active !== null && active !== i ? 0.7 : 1),
                                animationDelay: `${Math.min(i * 25, 400)}ms`,
                            }}
                        />
                    );
                }),
            ),
        [bars, rows, cy, base, barX, barW, active],
    );

    // The screen-reader table only changes with the data.
    const table = useMemo(
        () => (
            // Hidden by a box around it: a table won't shrink to sr-only's 1px, so on a phone it pushes the page wider.
            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{String(x)}</th>
                            {series.map((s) => (
                                <th key={s.dataKey} scope="col">
                                    {s.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <th scope="row">{(formatTooltipX ?? formatX)(r[x] as never)}</th>
                                {series.map((s) => {
                                    const v = value(r, s.dataKey);
                                    return <td key={s.dataKey}>{v === null ? '' : formatY(v)}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
        [label, x, series, rows, formatTooltipX, formatX, formatY],
    );

    const indexAt = (px: number) => {
        if (!n || !step) return null;
        const i = banded ? Math.floor((px - left) / step) : Math.round((px - left) / step);
        return Math.min(n - 1, Math.max(0, i));
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - box.left;
        const py = Math.round(e.clientY - box.top);
        setActive(indexAt(px));
        // Kept as the same object when unchanged, so a sideways move within a row renders nothing.
        setPointer((p) => (p?.y === py ? p : { y: py }));
    };
    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!n) return;
        const next = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Escape') return setActive(null);
        if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            setPointer(null);
            return setActive(e.key === 'Home' ? 0 : n - 1);
        }
        if (!next) return;
        e.preventDefault();
        setPointer(null);
        setActive((a) => (a === null ? (next > 0 ? 0 : n - 1) : Math.min(n - 1, Math.max(0, a + next))));
    };

    const showLegend = legend ?? (series.length > 1 || series.some((s) => s.dimLabel));
    const row = active === null ? null : rows[active];
    const tipX = active === null ? 0 : cx0(active);
    const tipY = pointer?.y ?? MARGIN.top;

    return (
        <figure aria-label={label} className={cx('zen__chart m-0 flex flex-col gap-3', className)}>
            {showLegend && <Legend series={series} />}
            <div
                ref={wrap}
                data-zen-unseen={seen ? undefined : ''}
                tabIndex={0}
                aria-label={`${label}: use the arrow keys to read values`}
                onPointerMove={onPointerMove}
                onPointerLeave={() => {
                    setActive(null);
                    setPointer(null);
                }}
                onKeyDown={onKeyDown}
                onBlur={() => setActive(null)}
                className="focus-visible:ring-ring/50 relative rounded-lg outline-hidden focus-visible:ring-2"
                style={{ height }}
            >
                {width > 0 && (
                    <svg width={width} height={height} aria-hidden className="block overflow-visible">
                        {geo.back}

                        {/* The row under the pointer: a band behind bars, else a crosshair. */}
                        {active !== null &&
                            (bars.length ? (
                                <rect
                                    x={cx0(active) - step / 2}
                                    y={MARGIN.top}
                                    width={step}
                                    height={plotH}
                                    className="fill-tint/[0.04]"
                                />
                            ) : (
                                <line
                                    x1={tipX}
                                    x2={tipX}
                                    y1={MARGIN.top}
                                    y2={MARGIN.top + plotH}
                                    className="stroke-glow/40"
                                />
                            ))}

                        {barMarks}
                        {geo.front}

                        {/* Markers where the crosshair meets each line, ringed in the surface colour. */}
                        {active !== null &&
                            series.map((s, k) => {
                                if (s.kind === 'bar') return null;
                                const v = value(rows[active], s.dataKey);
                                if (v === null) return null;
                                return (
                                    <circle
                                        key={k}
                                        cx={tipX}
                                        cy={cy(v)}
                                        r={4}
                                        strokeWidth={2}
                                        className="stroke-card"
                                        style={{ fill: s.color }}
                                    />
                                );
                            })}
                    </svg>
                )}
                {row && active !== null && (
                    <div
                        className="zen__chart-tooltip pointer-events-none absolute top-0 z-10 transition-[translate] duration-75"
                        style={tooltipPosition(tipX, tipY, width, height)}
                    >
                        {renderTooltip ? (
                            renderTooltip(row as T, active)
                        ) : (
                            <ChartTooltipCard
                                title={(formatTooltipX ?? formatX)(row[x] as never)}
                                rows={series
                                    .map((s) => ({ s, v: value(row, s.dataKey) }))
                                    .filter(({ v }) => v !== null)
                                    .map(({ s, v }) => ({
                                        label: s.label,
                                        value: formatY(v!),
                                        color: s.color,
                                        dashed: s.dashed,
                                    }))}
                            />
                        )}
                    </div>
                )}
            </div>
            {summary && <figcaption className="sr-only">{summary}</figcaption>}
            {table}
        </figure>
    );
}

/** A row's value for a series, or null where there's none to draw. */
function value(row: Row, key: string) {
    const v = row[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function Legend({ series }: { series: Series[] }) {
    // After the series, a faded key for each name given to faded bars (once, however many series share it).
    const faded = series.filter((s, i) => s.dimLabel && series.findIndex((o) => o.dimLabel === s.dimLabel) === i);
    return (
        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
            {series.map((s) => (
                <li key={s.dataKey} className="flex items-center gap-1.5">
                    <Key color={s.color} dashed={s.dashed} kind={s.kind} />
                    {s.label}
                </li>
            ))}
            {faded.map((s) => (
                <li key={`faded-${s.dimLabel}`} className="flex items-center gap-1.5">
                    <Key color={s.color} kind="bar" faded />
                    {s.dimLabel}
                </li>
            ))}
        </ul>
    );
}

/** Keeps the tooltip beside the crosshair and inside the chart. */
function tooltipPosition(x: number, y: number, width: number, height: number): CSSProperties {
    const flip = x > width / 2;
    // Moved by translate, not left/top, so following the pointer needs no layout; whole
    // pixels keep its text crisp. Flipped, it's anchored by its right edge instead.
    const ty = Math.round(Math.min(Math.max(0, y - 20), height - 80));
    return flip
        ? { right: 0, translate: `${Math.round(x - 12 - width)}px ${ty}px` }
        : { left: 0, translate: `${Math.round(x + 12)}px ${ty}px` };
}

/** Width of an element, following resizes (0 until measured, so nothing is drawn at a wrong size). */
function useWidth(ref: { current: HTMLElement | null }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        setWidth(el.clientWidth);
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => setWidth(el.clientWidth));
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return width;
}

/** Round tick values covering [min, max]: 0 / 5k / 10k, never 0 / 3,127 / 6,254. */
export function niceTicks(min: number, max: number, count = 5): number[] {
    if (min === max) [min, max] = min === 0 ? [0, 1] : [Math.min(0, min), Math.max(0, max)];
    const raw = (max - min) / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const err = raw / mag;
    const step = mag * (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1);
    const lo = Math.floor(min / step);
    const hi = Math.ceil(max / step);
    return Array.from({ length: hi - lo + 1 }, (_, i) => Number(((lo + i) * step).toPrecision(12)));
}

const compactFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const compact = (n: number) => compactFormat.format(n);

type Point = readonly [number, number];

/** Runs of consecutive points: a null (no value) breaks the line. */
function segments(pts: (Point | null)[]): Point[][] {
    const out: Point[][] = [];
    let run: Point[] = [];
    for (const p of pts) {
        if (p) run.push(p);
        else if (run.length) {
            out.push(run);
            run = [];
        }
    }
    if (run.length) out.push(run);
    return out;
}

function linearPath(pts: Point[]): string {
    return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('');
}

/** A smooth curve through the points that never overshoots them (monotone cubic, as d3's curveMonotoneX). */
function monotonePath(pts: Point[]): string {
    const n = pts.length;
    if (n < 3) return linearPath(pts);
    const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
    const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
    const t = pts.map((_, i) => {
        if (i === 0) return m[0];
        if (i === n - 1) return m[n - 2];
        if (m[i - 1] * m[i] <= 0) return 0;
        return (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    });
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i] / 3;
        d += `C${pts[i][0] + h},${pts[i][1] + t[i] * h},${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h},${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
}

/** A bar with a 4px rounded data end and a square base. */
function barPath(x: number, y: number, w: number, h: number, negative: boolean): string {
    const r = Math.min(4, w / 2, h);
    if (!negative)
        return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
    return `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
}

export interface ChartSeriesProps {
    /** The row field holding this series' values (numbers; null for none). */
    dataKey: string;
    /** Its name in the legend, the tooltip and the table. */
    label: string;
    /** Any CSS colour. Defaults to the next of --chart-1…8. */
    color?: string;
    /** Dashed (e.g. a projection). */
    dashed?: boolean;
}

export interface ChartAreaProps extends ChartSeriesProps {
    /** Smooth (default) or straight between points. */
    curve?: 'monotone' | 'linear';
}

export type ChartLineProps = ChartAreaProps;

export interface ChartBarProps extends Omit<ChartSeriesProps, 'dashed'> {
    /** Rows whose bar is faded, e.g. months still to come. */
    dim?: (row: Row, index: number) => boolean;
    /** What the faded bars mean, e.g. "Planned": the legend gets a faded key for it (and shows, even for one series). */
    dimLabel?: string;
}

export interface ChartReferenceProps {
    /** A horizontal line at this value. */
    y?: number;
    /** A vertical line at the row whose x field equals this. */
    x?: unknown;
    /** Text beside a vertical line, e.g. "Today". */
    label?: string;
    /** Destructive for a line that warns (e.g. below zero). */
    tone?: 'muted' | 'destructive';
    /** Vertical lines are dashed unless `dashed={false}`; horizontal ones solid unless `dashed`. */
    dashed?: boolean;
}

export interface ChartProps<T extends Row, X extends keyof T & string = keyof T & string> {
    /** One row per point on the x axis (e.g. a month). */
    data: readonly T[];
    /** The row field placed along the x axis. */
    x: X;
    /** Names the chart for screen readers. */
    label: string;
    /** A sentence on what the chart shows, for screen readers (e.g. its highest and lowest points). */
    summary?: string;
    /** Height in px, including the axis labels. */
    height?: number;
    /** Axis labels for x values. */
    formatX?: (value: T[X]) => string;
    /** The tooltip's title for an x value (defaults to formatX). */
    formatTooltipX?: (value: T[X]) => string;
    /** Axis ticks and tooltip values (defaults to compact numbers: 1.2K). */
    formatY?: (value: number) => string;
    /** Your own tooltip for a row (build it from ChartTooltipCard). */
    renderTooltip?: (row: T, index: number) => ReactNode;
    /** Colours for series that don't give their own: the categorical palette (default), or shades of the theme's glow. */
    palette?: ChartPalette;
    /** Show the legend. Defaults to on for two or more series, or a bar's `dimLabel`. */
    legend?: boolean;
    className?: string;
    /** ChartArea, ChartLine, ChartBar and ChartReference parts. */
    children: ReactNode;
}

export { ChartTooltipCard, type ChartTooltipCardProps } from './tooltip';
export { default as DonutChart, type DonutChartProps } from './donut';
export { type ChartPalette, paletteColor } from './palette';
