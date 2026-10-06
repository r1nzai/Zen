import { cx } from '@zen/utils/cx';
import { type DateString, daysInMonth, dayOfWeek, formatDate, weekdayNames, weekStart } from '@zen/utils/date';
import { formatMonth, type Month } from '@zen/utils/month';

/**
 * A month as a grid of days, each shaded by its value (e.g. what was spent
 * that day): busy days stand out at a glance. Hover a day for its figure;
 * with `onSelect`, days are buttons.
 */
export default function CalendarHeatmap({
    month,
    values,
    locale,
    format = String,
    weekStartsOn = weekStart(locale),
    onSelect,
    selected,
    label,
    className,
}: CalendarHeatmapProps) {
    const count = daysInMonth(month);
    const days = Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}` as DateString);
    const lead = (dayOfWeek(days[0]) - weekStartsOn + 7) % 7;
    const cells: (DateString | null)[] = [...Array<null>(lead).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
    const names = weekdayNames(locale, 'narrow');
    const long = weekdayNames(locale, 'long');
    const order = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
    const peak = Math.max(0, ...days.map((d) => values[d] ?? 0));

    return (
        <table
            aria-label={label ?? formatMonth(month, locale, 'long')}
            className={cx('zen__calendar-heatmap w-full table-fixed border-separate border-spacing-1', className)}
        >
            <thead>
                <tr>
                    {order.map((d) => (
                        <th
                            key={d}
                            scope="col"
                            abbr={long[d]}
                            className="text-muted-foreground pb-1 text-xs font-normal"
                        >
                            {names[d]}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {weeks.map((week, w) => (
                    <tr key={w}>
                        {week.map((day, i) => {
                            if (!day) return <td key={i} />;
                            const value = values[day];
                            // A square root spreads small days apart, so one big day doesn't wash out the rest.
                            const share = peak > 0 && value ? Math.sqrt(value / peak) : 0;
                            const said = `${formatDate(day, locale, 'day')}: ${value ? format(value) : format(0)}`;
                            const look = cx(
                                'relative grid aspect-square w-full place-items-center rounded-md text-[0.65rem] tabular-nums transition-[box-shadow]',
                                share
                                    ? share > 0.6
                                        ? 'text-primary-foreground'
                                        : 'text-foreground/80'
                                    : 'bg-tint/[0.04] text-muted-foreground',
                                day === selected && 'ring-ring ring-2',
                            );
                            const style = share
                                ? { background: `oklch(var(--primary) / ${+(0.14 + 0.81 * share).toFixed(2)})` }
                                : undefined;
                            const content = (
                                <>
                                    <span aria-hidden>{Number(day.slice(8))}</span>
                                    <span className="sr-only">{said}</span>
                                </>
                            );
                            return (
                                <td key={day} title={said} className="p-0">
                                    {onSelect ? (
                                        <button
                                            type="button"
                                            aria-pressed={day === selected}
                                            onClick={() => onSelect(day)}
                                            className={cx(
                                                look,
                                                'focus-visible:ring-ring/60 cursor-pointer outline-hidden hover:shadow-[0_0_0_1px_oklch(var(--tint)/0.3)] focus-visible:ring-2',
                                            )}
                                            style={style}
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <span className={look} style={style}>
                                            {content}
                                        </span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export interface CalendarHeatmapProps {
    month: Month;
    /** Each day's value, by date ("2026-09-03"); days missing have none. */
    values: Partial<Record<DateString, number>>;
    locale: string;
    /** Turns a value into text for its label, e.g. as money. */
    format?: (value: number) => string;
    /** 0 for Sunday … 6 for Saturday (default: the locale's). */
    weekStartsOn?: number;
    /** Makes the days buttons. */
    onSelect?: (day: DateString) => void;
    selected?: DateString | null;
    /** Accessible name (default: the month, e.g. "September 2026"). */
    label?: string;
    className?: string;
}
