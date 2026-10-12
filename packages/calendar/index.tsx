import { useLocale, useMessages } from '@zen/locale-provider';
import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';
import { cx } from '@zen/utils/cx';
import { PICKER_MONTH, PICKER_MONTH_ON, PICKER_NAV } from '@zen/utils/styles';
import { useControllable } from '@zen/utils/useControllable';
import {
    addDays,
    addMonthsToDate,
    type DateRange,
    type DateString,
    dayOfWeek,
    daysInMonth,
    formatDate,
    today as todayDate,
    weekdayNames,
    weekStart,
} from '@zen/utils/date';
import { addMonths, formatMonth, type Month, monthNames, monthsBetween } from '@zen/utils/month';
import { ComponentProps, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { readingKey } from '@zen/utils/direction';
import { useHydrated } from '@zen/utils/useHydrated';

/**
 * A month grid to pick a date, or a range of dates, fully keyboard-driven:
 * arrows move by day and week, Home and End to the week's ends, Page Up and
 * Down by month (with Shift, by year). The title opens a year and month grid
 * to jump far. Dates are "YYYY-MM-DD" strings, so they never shift a day with
 * time zones. Inline on a page, or in a popup with DatePicker.
 */
export default function Calendar(props: CalendarProps) {
    const {
        locale: localeProp,
        min,
        max,
        isDisabled,
        weekStartsOn: weekStartsOnProp,
        months = 1,
        defaultMonth,
        className,
        autoFocus,
        mode,
        value: valueProp,
        defaultValue = null,
        onValueChange,
        ...rest
    } = props;
    const locale = useLocale(localeProp);
    const digits = new Intl.NumberFormat(locale);
    const m = useMessages();
    const weekStartsOn = weekStartsOnProp ?? weekStart(locale);
    const [value, set] = useControllable<DateString | DateRange | null>(
        valueProp,
        defaultValue,
        onValueChange as ((value: DateString | DateRange | null) => void) | undefined,
    );
    const range = mode === 'range' ? (value as DateRange | null) : null;
    const single = mode === 'range' ? null : (value as DateString | null);
    const selected = single ?? range?.start ?? null;
    const now = todayDate();
    // The server's today may not be the reader's (another time zone, or just past midnight): marked once hydrated.
    const today = useHydrated() ? now : null;

    const [view, setView] = useState<Month>(() => defaultMonth ?? (selected ?? now).slice(0, 7));
    // The date that has keyboard focus (the grid's one tab stop).
    const [active, setActive] = useState<DateString>(() => selected ?? now);
    const [hover, setHover] = useState<DateString | null>(null);
    const [picking, setPicking] = useState<'days' | 'months'>('days');
    const [year, setYear] = useState(() => Number(view.slice(0, 4)));
    const grid = useRef<HTMLDivElement>(null);
    const moved = useRef(autoFocus ?? false);
    const titleId = useId();

    const lastView = addMonths(view, months - 1);
    const shown = (d: DateString) => d.slice(0, 7) >= view && d.slice(0, 7) <= lastView;
    const blocked = (d: DateString) => (!!min && d < min) || (!!max && d > max) || !!isDisabled?.(d);

    // The tab stop follows the view: after the arrows change month, it's on a day in sight.
    const tabStop = shown(active) ? active : addMonthsToDate(active, monthsBetween(active.slice(0, 7), view));

    // Focus follows the keyboard (and lands on the tab stop when opened with autoFocus).
    useEffect(() => {
        if (!moved.current) return;
        moved.current = false;
        grid.current?.querySelector<HTMLElement>(`[data-date="${tabStop}"]`)?.focus();
    }, [tabStop, picking]);

    const moveTo = (d: DateString) => {
        if (min && d < min) d = min;
        if (max && d > max) d = max;
        moved.current = true;
        setActive(d);
        if (!shown(d)) setView(d < view ? d.slice(0, 7) : addMonths(d.slice(0, 7), -(months - 1)));
    };

    const pick = (d: DateString) => {
        if (blocked(d)) return;
        setActive(d);
        if (mode === 'range') {
            const r = range;
            // A new range starts on the first click, and ends on the second (either way round).
            if (!r || r.end !== null) set({ start: d, end: null });
            else set(d < r.start ? { start: d, end: r.start } : { start: r.start, end: d });
        } else set(d);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const from = tabStop;
        const dow = (dayOfWeek(from) - weekStartsOn + 7) % 7;
        const next: DateString | undefined = {
            ArrowLeft: addDays(from, -1),
            ArrowRight: addDays(from, 1),
            ArrowUp: addDays(from, -7),
            ArrowDown: addDays(from, 7),
            Home: addDays(from, -dow),
            End: addDays(from, 6 - dow),
            PageUp: addMonthsToDate(from, e.shiftKey ? -12 : -1),
            PageDown: addMonthsToDate(from, e.shiftKey ? 12 : 1),
        }[readingKey(e.key, e.currentTarget)];
        if (!next) return;
        e.preventDefault();
        moveTo(next);
    };

    // The end of the range being picked follows the pointer (or keyboard focus), as a preview.
    const pending = range && range.end === null ? range.start : null;
    const preview = pending && hover ? (hover < pending ? [hover, pending] : [pending, hover]) : null;
    const [from, to] = range?.end ? [range.start, range.end] : (preview ?? [null, null]);

    const step = (n: number) => {
        setView((v) => addMonths(v, n));
    };

    const header = (
        <div className="mb-2 flex items-center justify-between gap-2">
            <button
                type="button"
                aria-label={picking === 'days' ? m.previousMonth : m.previousYear}
                onClick={() => (picking === 'days' ? step(-1) : setYear((y) => y - 1))}
                className={PICKER_NAV}
            >
                <ChevronLeft className="size-4 rtl:-scale-x-100" />
            </button>
            <button
                type="button"
                id={titleId}
                aria-live="polite"
                aria-label={
                    picking === 'days' ? m.chooseMonthAndYear(formatMonth(view, locale, 'long')) : m.backToDays(year)
                }
                onClick={() => {
                    setYear(Number(view.slice(0, 4)));
                    setPicking((p) => (p === 'days' ? 'months' : 'days'));
                }}
                className="hover:bg-tint/[0.07] focus-ring cursor-pointer rounded-md px-2 py-1 text-sm font-semibold tabular-nums outline-hidden transition-colors"
            >
                {picking === 'days'
                    ? months === 1
                        ? formatMonth(view, locale, 'long')
                        : `${formatMonth(view, locale)} – ${formatMonth(lastView, locale)}`
                    : year}
            </button>
            <button
                type="button"
                aria-label={picking === 'days' ? m.nextMonth : m.nextYear}
                onClick={() => (picking === 'days' ? step(1) : setYear((y) => y + 1))}
                className={PICKER_NAV}
            >
                <ChevronRight className="size-4 rtl:-scale-x-100" />
            </button>
        </div>
    );

    if (picking === 'months') {
        const names = monthNames(locale);
        return (
            <div className={cx('zen__calendar w-fit', className)} {...rest}>
                {header}
                <div className="grid w-64 grid-cols-3 gap-1" role="group" aria-labelledby={titleId}>
                    {names.map((name, i) => {
                        const month = `${year}-${String(i + 1).padStart(2, '0')}`;
                        const out = (!!min && month < min.slice(0, 7)) || (!!max && month > max.slice(0, 7));
                        return (
                            <button
                                key={month}
                                type="button"
                                disabled={out}
                                aria-pressed={month === view}
                                aria-label={formatMonth(month, locale, 'long')}
                                onClick={() => {
                                    setView(month);
                                    moved.current = true;
                                    setActive(addMonthsToDate(active, monthsBetween(active.slice(0, 7), month)));
                                    setPicking('days');
                                }}
                                className={cx(PICKER_MONTH, month === view && PICKER_MONTH_ON)}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    const weekdays = weekdayNames(locale, 'narrow');
    const weekdaysLong = weekdayNames(locale, 'long');
    const order = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

    return (
        <div className={cx('zen__calendar w-fit', className)} {...rest}>
            {header}
            <div ref={grid} className="flex gap-4" onKeyDown={onKeyDown} onMouseLeave={() => setHover(null)}>
                {Array.from({ length: months }, (_, k) => {
                    const month = addMonths(view, k);
                    const first = `${month}-01`;
                    const last = `${month}-${daysInMonth(month)}`;
                    const start = addDays(first, -((dayOfWeek(first) - weekStartsOn + 7) % 7));
                    return (
                        <table
                            key={month}
                            role="grid"
                            aria-label={formatMonth(month, locale, 'long')}
                            className="border-separate border-spacing-x-0 border-spacing-y-0.5"
                        >
                            {months > 1 && (
                                <caption className="text-muted-foreground pb-1 text-xs font-medium">
                                    {formatMonth(month, locale, 'long')}
                                </caption>
                            )}
                            <thead>
                                <tr>
                                    {order.map((d) => (
                                        <th
                                            key={d}
                                            scope="col"
                                            abbr={weekdaysLong[d]}
                                            className="text-muted-foreground size-9 text-xs font-medium"
                                        >
                                            {weekdays[d]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 6 }, (_, w) => (
                                    <tr key={w}>
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const d = addDays(start, w * 7 + i);
                                            const inMonth = d.slice(0, 7) === month;
                                            // With several months, each shows only its own days.
                                            if (!inMonth && months > 1) return <td key={d} role="gridcell" />;
                                            const isStart = d === from;
                                            const isEnd = d === to;
                                            const between = !!from && !!to && d > from && d < to;
                                            const chosen = d === single || d === range?.start || d === range?.end;
                                            const off = blocked(d);
                                            return (
                                                <td
                                                    key={d}
                                                    role="gridcell"
                                                    aria-selected={chosen || between || undefined}
                                                    className={cx(
                                                        'p-0',
                                                        (between || ((isStart || isEnd) && from !== to)) &&
                                                            'bg-primary/15',
                                                        isStart && 'rounded-s-lg',
                                                        isEnd && 'rounded-e-lg',
                                                        // The band rounds off at each row's ends, and at the month's when months sit side by side.
                                                        between &&
                                                            (i === 0 || (months > 1 && d === first)) &&
                                                            'rounded-s-lg',
                                                        between &&
                                                            (i === 6 || (months > 1 && d === last)) &&
                                                            'rounded-e-lg',
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        data-date={d}
                                                        tabIndex={d === tabStop ? 0 : -1}
                                                        aria-label={formatDate(d, locale, 'full')}
                                                        aria-pressed={chosen}
                                                        aria-disabled={off || undefined}
                                                        aria-current={d === today ? 'date' : undefined}
                                                        onClick={() => pick(d)}
                                                        onFocus={() => {
                                                            setActive(d);
                                                            if (pending) setHover(d);
                                                        }}
                                                        onMouseEnter={() => pending && setHover(d)}
                                                        className={cx(
                                                            DAY,
                                                            !inMonth && 'text-muted-foreground',
                                                            off && 'cursor-not-allowed opacity-35',
                                                            chosen
                                                                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-4px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]'
                                                                : !off && 'hover:bg-tint/[0.08]',
                                                            d === today &&
                                                                'after:bg-primary after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full',
                                                            d === today && chosen && 'after:bg-primary-foreground',
                                                        )}
                                                    >
                                                        {digits.format(Number(d.slice(8)))}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                })}
            </div>
        </div>
    );
}

const DAY =
    'relative grid size-9 cursor-pointer place-items-center rounded-lg text-sm tabular-nums outline-hidden transition-[background-color,color,box-shadow] duration-150 focus-ring';

/** Other props (aria-*, data-*, an id) go on the calendar's outer element. */
interface CalendarBaseProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onKeyDown' | 'children'> {
    /** Decides month and weekday names, and the first day of the week, e.g. "en-IN". Defaults to the LocaleProvider's. */
    locale?: string;
    /** Earliest date that can be picked ("YYYY-MM-DD"). */
    min?: DateString;
    /** Latest date that can be picked. */
    max?: DateString;
    /** Dates that can't be picked, e.g. weekends or booked days. */
    isDisabled?: (date: DateString) => boolean;
    /** 0 for Sunday … 6 for Saturday. Defaults to the locale's. */
    weekStartsOn?: number;
    /** Months shown side by side (e.g. 2 for ranges). */
    months?: number;
    /** Month shown first ("YYYY-MM"). Defaults to the chosen date's, or this month. */
    defaultMonth?: Month;
    /** Focus the chosen date (or today) when shown, e.g. in a popup. */
    autoFocus?: boolean;
    className?: string;
}

export interface CalendarSingleProps extends CalendarBaseProps {
    mode?: 'single';
    /** "YYYY-MM-DD", or null for none, when you keep it. */
    value?: DateString | null;
    /** The first date, when the calendar keeps its own. */
    defaultValue?: DateString | null;
    onValueChange?: (date: DateString) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
    /** Pick a start and then an end; the days between are highlighted, previewed while pointing. */
    mode: 'range';
    /** The range when you keep it; `end` is null while only the start is picked. */
    value?: DateRange | null;
    /** The first range, when the calendar keeps its own. */
    defaultValue?: DateRange | null;
    onValueChange?: (range: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;
