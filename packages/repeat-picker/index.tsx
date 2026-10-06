import Chip from '@zen/chip';
import Input from '@zen/input';
import Select, { SelectItem } from '@zen/select';
import { cx } from '@zen/utils/cx';
import { type DateString, dayOfWeek, formatDate, weekdayNames, weekStart } from '@zen/utils/date';
import { describeRepeat, nextOccurrences, type Repeat } from '@zen/utils/repeat';
import { useState } from 'react';

const UNITS = ['day', 'week', 'month', 'year'] as const;

/**
 * How often something recurs, e.g. a bill: every n days, weeks, months or
 * years, on chosen weekdays or a day of the month. Says what it means in
 * words, and with a `start` date, the next few dates it falls on.
 */
export default function RepeatPicker({
    value,
    onChange,
    locale,
    start,
    weekStartsOn = weekStart(locale),
    label = 'Repeats',
    className,
}: RepeatPickerProps) {
    const [count, setCount] = useState(String(value.every));
    if (Number(count) !== value.every && count !== '') setCount(String(value.every));
    const names = weekdayNames(locale);
    const days = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
    const weekdays = value.weekdays ?? (start ? [dayOfWeek(start)] : []);
    const plural = value.every !== 1;

    const setUnit = (unit: Repeat['unit']) => {
        const next: Repeat = { every: value.every, unit };
        if (unit === 'week' && start) next.weekdays = [dayOfWeek(start)];
        if (unit === 'month') next.day = start ? Number(start.slice(8)) : 1;
        onChange(next);
    };

    return (
        <fieldset className={cx('zen__repeat-picker flex flex-col gap-3', className)}>
            <legend className="sr-only">{label}</legend>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Every</span>
                <Input
                    aria-label="How many"
                    inputMode="numeric"
                    value={count}
                    onChange={(e) => {
                        const text = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setCount(text);
                        if (Number(text) >= 1) onChange({ ...value, every: Number(text) });
                    }}
                    onBlur={() => setCount(String(value.every))}
                    className="w-16 text-center tabular-nums"
                />
                <Select aria-label="Unit" value={value.unit} onChange={setUnit} className="w-32">
                    {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                            {plural ? `${u}s` : u}
                        </SelectItem>
                    ))}
                </Select>
            </div>
            {value.unit === 'week' && (
                <div role="group" aria-label="On" className="flex flex-wrap gap-1.5">
                    {days.map((d) => {
                        const on = weekdays.includes(d);
                        return (
                            <Chip
                                key={d}
                                pressed={on}
                                // At least one day.
                                onClick={() => {
                                    if (on && weekdays.length === 1) return;
                                    onChange({
                                        ...value,
                                        weekdays: on ? weekdays.filter((w) => w !== d) : [...weekdays, d],
                                    });
                                }}
                            >
                                {names[d]}
                            </Chip>
                        );
                    })}
                </div>
            )}
            {value.unit === 'month' && (
                <Select
                    aria-label="On"
                    value={String(value.day ?? (start ? Number(start.slice(8)) : 1))}
                    onChange={(d) => onChange({ ...value, day: Number(d) })}
                    className="w-40"
                >
                    {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                            Day {i + 1}
                        </SelectItem>
                    ))}
                    <SelectItem value="-1">Last day</SelectItem>
                </Select>
            )}
            <p aria-live="polite" className="text-muted-foreground text-sm">
                {describeRepeat(value, locale, start)}
                {start && (
                    <>
                        <br />
                        Next:{' '}
                        {nextOccurrences(value, start, 3)
                            .map((d) => formatDate(d, locale))
                            .join(', ')}
                    </>
                )}
            </p>
        </fieldset>
    );
}

export interface RepeatPickerProps {
    value: Repeat;
    onChange: (value: Repeat) => void;
    /** For weekday and date names, and the week's first day. */
    locale: string;
    /** When it starts: its weekday and day of the month are the defaults, and the next dates are shown. */
    start?: DateString;
    /** 0 for Sunday … 6. Defaults to the locale's. */
    weekStartsOn?: number;
    /** The group's name for screen readers (default "Repeats"). */
    label?: string;
    className?: string;
}
