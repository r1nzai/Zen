import { useField } from '@zen/field';
import { useLocale, useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { plainSpaces } from '@zen/utils/date';
import { readingKey } from '@zen/utils/direction';
import { FormValue } from '@zen/utils/form-value';
import { FIELD_SIZE, FIELD_WITHIN, type FieldSize } from '@zen/utils/styles';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, KeyboardEvent, useMemo, useRef, useState } from 'react';

/** A time of day as "HH:MM", 24-hour: no date and no time zone, like DateString. */
export type TimeString = string;

type Segment = 'hour' | 'minute' | 'dayPeriod';
/** The segments as shown: the hour in the locale's cycle (1–12 or 0–23), and AM (0) or PM (1). */
interface Parts {
    hour: number | null;
    minute: number | null;
    period: 0 | 1 | null;
}

/**
 * A time of day, typed or stepped a part at a time: hour, minute and, where
 * the locale uses a 12-hour clock, AM/PM, in the locale's order and digits.
 * Type digits (it moves on when a part is full), ↑↓ to step (minutes by
 * `step`), ←→ between parts, Backspace to clear one. The value is "HH:MM"
 * (24-hour) once every part is set, and null until then.
 */
export default function TimeField({
    value: valueProp,
    defaultValue = null,
    onValueChange,
    step = 1,
    locale: localeProp,
    name,
    size = 'default',
    invalid,
    disabled,
    className,
    onMouseDown,
    ...rest
}: TimeFieldProps) {
    const m = useMessages();
    const field = useField();
    const locale = useLocale(localeProp);
    const clock = useMemo(() => new Clock(locale), [locale]);
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    // Parts set so far while the time is incomplete (the value is null meanwhile).
    const [draft, setDraft] = useState<Parts | null>(null);
    const parts = draft ?? clock.split(value);
    // Digits typed into the focused part, to read "1" then "2" as 12.
    const typed = useRef('');

    const update = (next: Parts) => {
        const time = clock.join(next);
        setDraft(time === null ? next : null);
        if (time !== value) setValue(time);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>, segment: Segment) => {
        const key = readingKey(e.key, e.currentTarget);
        const move = (by: number) => {
            const all = [...e.currentTarget.parentElement!.querySelectorAll<HTMLElement>('[role=spinbutton]')];
            all[all.indexOf(e.currentTarget) + by]?.focus();
        };
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            e.preventDefault();
            return move(key === 'ArrowLeft' ? -1 : 1);
        }
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            typed.current = '';
            return update(clock.step(parts, segment, key === 'ArrowUp' ? 1 : -1, step));
        }
        if (key === 'Backspace' || key === 'Delete') {
            e.preventDefault();
            typed.current = '';
            return update({ ...parts, [segment === 'dayPeriod' ? 'period' : segment]: null });
        }
        if (segment === 'dayPeriod') {
            const period = clock.periodFor(e.key);
            if (period === null) return;
            e.preventDefault();
            return update({ ...parts, period });
        }
        const digit = clock.digit(e.key);
        if (digit === null) return;
        e.preventDefault();
        const { n, done } = clock.type(segment, typed.current + digit);
        typed.current = done ? '' : typed.current + digit;
        update({ ...parts, [segment]: n });
        if (done) move(1);
    };

    const segments = clock.order.map((part, i) => {
        if (part.type === 'literal') {
            return (
                <span key={i} aria-hidden className="text-muted-foreground whitespace-pre">
                    {part.value}
                </span>
            );
        }
        const segment = part.type;
        const n = segment === 'dayPeriod' ? parts.period : parts[segment];
        const label = { hour: m.hour, minute: m.minute, dayPeriod: m.dayPeriod }[segment];
        const text = n === null ? null : clock.show(segment, n);
        return (
            <span
                key={segment}
                role="spinbutton"
                tabIndex={disabled ? undefined : 0}
                aria-label={label}
                aria-valuenow={n ?? undefined}
                aria-valuetext={text ?? undefined}
                aria-valuemin={segment === 'dayPeriod' ? 0 : clock.min(segment)}
                aria-valuemax={segment === 'dayPeriod' ? 1 : clock.max(segment)}
                aria-disabled={disabled || undefined}
                onKeyDown={disabled ? undefined : (e) => onKeyDown(e, segment)}
                onFocus={() => (typed.current = '')}
                className={cx(
                    'zen__time-segment rounded-sm px-0.5 tabular-nums outline-hidden caret-transparent select-none',
                    'focus:bg-primary/20 focus:text-foreground',
                    text === null && 'text-muted-foreground',
                )}
            >
                {text ?? '––'}
            </span>
        );
    });

    return (
        <div
            role="group"
            aria-labelledby={rest['aria-label'] ? undefined : field?.labelId}
            aria-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            {...rest}
            onMouseDown={(e) => {
                onMouseDown?.(e);
                // A press on the field but not a part goes to the first part.
                if (e.defaultPrevented || (e.target as Element).closest('[role=spinbutton]')) return;
                e.preventDefault();
                e.currentTarget.querySelector<HTMLElement>('[role=spinbutton]')?.focus();
            }}
            className={cx(
                'zen__time-field',
                FIELD_WITHIN,
                FIELD_SIZE[size],
                'w-fit cursor-text gap-0',
                disabled && 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
                'data-invalid:border-destructive',
                className,
            )}
        >
            {segments}
            <FormValue name={name} value={value ?? ''} onReset={reset} />
        </div>
    );
}

/** A locale's clock: its parts' order, hour cycle, digits and AM/PM names. */
class Clock {
    readonly order: { type: Segment | 'literal'; value: string }[];
    private readonly h12: boolean;
    private readonly periods: [string, string];
    private readonly two: Intl.NumberFormat;
    private readonly one: Intl.NumberFormat;
    private readonly digits: Map<string, string>;

    constructor(locale: string) {
        const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
        this.h12 = format.resolvedOptions().hourCycle?.startsWith('h1') ?? false;
        const at = (h: number) => format.formatToParts(Date.UTC(2020, 0, 1, h, 5));
        this.order = at(15).map((p) => ({ type: p.type as Segment | 'literal', value: plainSpaces(p.value) }));
        const period = (h: number) => plainSpaces(at(h).find((p) => p.type === 'dayPeriod')?.value ?? '');
        this.periods = [period(9), period(15)];
        this.two = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
        this.one = new Intl.NumberFormat(locale, { useGrouping: false });
        const own = this.one.format(9876543210);
        this.digits = new Map([...own].map((d, i) => [d, String(9 - i)]));
    }

    min = (segment: 'hour' | 'minute') => (segment === 'hour' && this.h12 ? 1 : 0);
    max = (segment: 'hour' | 'minute') => (segment === 'minute' ? 59 : this.h12 ? 12 : 23);

    show(segment: Segment, n: number) {
        if (segment === 'dayPeriod') return this.periods[n];
        return segment === 'hour' && this.h12 ? this.one.format(n) : this.two.format(n);
    }

    split(time: TimeString | null): Parts {
        if (!time) return { hour: null, minute: null, period: this.h12 ? null : 0 };
        const h = Number(time.slice(0, 2));
        const minute = Number(time.slice(3, 5));
        return this.h12 ? { hour: h % 12 || 12, minute, period: h >= 12 ? 1 : 0 } : { hour: h, minute, period: 0 };
    }

    join({ hour, minute, period }: Parts): TimeString | null {
        if (hour === null || minute === null || (this.h12 && period === null)) return null;
        const h = this.h12 ? (hour % 12) + (period ? 12 : 0) : hour;
        return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    step(parts: Parts, segment: Segment, by: number, minutes: number): Parts {
        if (segment === 'dayPeriod') return { ...parts, period: parts.period === 1 ? 0 : 1 };
        const [lo, hi] = [this.min(segment), this.max(segment)];
        const size = hi - lo + 1;
        const n = parts[segment];
        const unit = segment === 'minute' ? minutes : 1;
        if (n === null) return { ...parts, [segment]: by > 0 ? lo : lo + Math.floor((hi - lo) / unit) * unit };
        // On to the next whole step either way (7 goes down to 5 and up to 10), wrapping round the clock.
        const at = (n - lo) / unit;
        const next = (by > 0 ? Math.floor(at) + 1 : Math.ceil(at) - 1) * unit;
        return { ...parts, [segment]: lo + (((next % size) + size) % size) };
    }

    digit(key: string): string | null {
        if (/^\d$/.test(key)) return key;
        return this.digits.get(key) ?? null;
    }

    /** The part's number from the digits typed into it, and whether it's full (so focus moves on). */
    type(segment: 'hour' | 'minute', digits: string): { n: number; done: boolean } {
        const hi = this.max(segment);
        const n = Number(digits);
        if (digits.length === 2)
            return n <= hi && n >= this.min(segment) ? { n, done: true } : this.type(segment, digits[1]);
        // Done after one digit when no second could follow it (a 3 in hours: there's no 30-something o'clock).
        return { n, done: n * 10 > hi };
    }

    periodFor(key: string): 0 | 1 | null {
        const k = key.toLowerCase();
        if (k === 'a' || this.periods[0].toLowerCase().startsWith(k)) return 0;
        if (k === 'p' || this.periods[1].toLowerCase().startsWith(k)) return 1;
        return null;
    }
}

export interface TimeFieldProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
    /** "HH:MM" (24-hour), or null, when you keep it. */
    value?: TimeString | null;
    /** The first time, when the field keeps its own. */
    defaultValue?: TimeString | null;
    onValueChange?: (value: TimeString | null) => void;
    /** Minutes ↑↓ move by, e.g. 5 or 15. Default 1. */
    step?: number;
    /** Defaults to the LocaleProvider's. */
    locale?: string;
    /** Form field name: the time is submitted under it as "HH:MM". */
    name?: string;
    /** Height, matching Button's. */
    size?: FieldSize;
    disabled?: boolean;
    /** Show the field in its error state. */
    invalid?: boolean;
}
