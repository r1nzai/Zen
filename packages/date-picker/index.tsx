import CalendarMicro from '@zen/icons/micro/calendar';
import Calendar from '@zen/calendar';
import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { FormValue } from '@zen/utils/form-value';
import { type DateRange, type DateString, formatDate, formatDateRange } from '@zen/utils/date';
import { FIELD_SIZE, type FieldSize, PLACEHOLDER, POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, ReactNode } from 'react';

/**
 * Date field: shows the date ("Sep 30, 2026" for the locale) and opens a
 * Calendar to pick one, focused on the chosen date so the keyboard works at
 * once. Dates are "YYYY-MM-DD" strings. When `clearable`, the popup also offers
 * `clearLabel` to empty it. With `name`, it's submitted with a form.
 */
export default function DatePicker({
    value: valueProp,
    defaultValue = null,
    onValueChange,
    locale,
    min,
    max,
    isDisabled,
    weekStartsOn,
    placeholder = 'Pick a date',
    clearable = false,
    clearLabel = 'Clear',
    ...rest
}: DatePickerProps) {
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    return (
        <PickerField
            {...rest}
            shown={value ? formatDate(value, locale) : null}
            formValue={value ?? ''}
            onReset={reset}
            placeholder={placeholder}
            label="Choose date"
            onClear={clearable && value ? () => setValue(null) : undefined}
            clearLabel={clearLabel}
            calendar={(close) => (
                <Calendar
                    autoFocus
                    value={value}
                    onValueChange={(d) => {
                        setValue(d);
                        close();
                    }}
                    {...{ locale, min, max, isDisabled, weekStartsOn }}
                />
            )}
        />
    );
}

/**
 * Date range field: pick a start and then an end in a Calendar (the days
 * between are previewed while pointing); it closes once the range is complete.
 * Shows the range the locale's way, e.g. "Sep 3 – 10, 2026". With `presets`,
 * common ranges ("Last 30 days") sit beside the calendar, one tap each (see
 * commonRanges).
 */
export function DateRangePicker({
    value: valueProp,
    defaultValue = null,
    onValueChange,
    locale,
    min,
    max,
    isDisabled,
    weekStartsOn,
    months = 1,
    placeholder = 'Pick dates',
    clearable = false,
    clearLabel = 'Clear',
    presets,
    ...rest
}: DateRangePickerProps) {
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    const shown = !value
        ? null
        : value.end
          ? formatDateRange(value.start, value.end, locale)
          : `${formatDate(value.start, locale)} – …`;
    return (
        <PickerField
            {...rest}
            shown={shown}
            formValue={value ? `${value.start}/${value.end ?? ''}` : ''}
            onReset={reset}
            placeholder={placeholder}
            label="Choose dates"
            onClear={clearable && value ? () => setValue(null) : undefined}
            clearLabel={clearLabel}
            calendar={(close) => {
                const calendar = (
                    <Calendar
                        autoFocus
                        mode="range"
                        value={value}
                        onValueChange={(r) => {
                            setValue(r);
                            if (r.end) close();
                        }}
                        {...{ locale, min, max, isDisabled, weekStartsOn, months }}
                    />
                );
                if (!presets?.length) return calendar;
                return (
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div
                            role="group"
                            aria-label="Presets"
                            className="border-tint/[0.06] flex flex-wrap gap-1 sm:flex-col sm:flex-nowrap sm:border-e sm:pe-3"
                        >
                            {presets.map((p) => {
                                const on = value?.start === p.range.start && value?.end === p.range.end;
                                return (
                                    <button
                                        key={p.label}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => {
                                            setValue(p.range);
                                            close();
                                        }}
                                        className="text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground aria-pressed:bg-primary/12 aria-pressed:text-foreground focus-ring cursor-pointer rounded-lg px-2.5 py-1.5 text-start text-sm whitespace-nowrap outline-hidden"
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                        {calendar}
                    </div>
                );
            }}
        />
    );
}

/** The trigger field and its popup, shared by both pickers. */
function PickerField({
    shown,
    placeholder,
    label,
    calendar,
    onClear,
    clearLabel,
    name,
    formValue,
    onReset,
    size = 'default',
    id,
    className,
    disabled = false,
    style,
    ...rest
}: Omit<ComponentProps<'button'>, 'value' | 'onChange' | 'defaultValue'> & {
    size?: FieldSize;
    shown: string | null;
    formValue: string;
    onReset: () => void;
    placeholder: string;
    label: string;
    calendar: (close: () => void) => ReactNode;
    onClear?: () => void;
    clearLabel: string;
}) {
    const popup = useAnchoredPopup<HTMLDivElement>();
    const field = useFieldProps({ ...rest, id });
    const close = () => popup.setOpen(false);
    return (
        <>
            <button
                type="button"
                {...rest}
                {...field}
                id={id}
                disabled={disabled}
                {...popup.triggerProps}
                style={{ ...popup.triggerProps.style, ...style }}
                className={cx(
                    'zen__date-picker group',
                    TRIGGER,
                    FIELD_SIZE[size],
                    'w-full',
                    popup.open && TRIGGER_OPEN,
                    className,
                )}
            >
                <span className={cx('truncate', !shown && PLACEHOLDER)}>{shown ?? placeholder}</span>
                <CalendarIcon />
            </button>
            <FormValue name={name} value={formValue} onReset={onReset} />
            <div {...popup.popupProps} role="dialog" aria-label={label} className={cx('zen__popover', POPUP, 'p-3')}>
                {/* Rendered while open only, so each opening starts at the chosen date. */}
                {popup.open && calendar(close)}
                {onClear && (
                    <button
                        type="button"
                        onClick={() => {
                            onClear();
                            close();
                        }}
                        className="border-tint/[0.06] text-muted-foreground hover:text-foreground focus-ring mt-2 w-full cursor-pointer rounded-lg border-t px-2 pt-2.5 pb-1.5 text-sm outline-hidden"
                    >
                        {clearLabel}
                    </button>
                )}
            </div>
        </>
    );
}

function CalendarIcon() {
    return (
        <CalendarMicro className="text-muted-foreground group-data-popup-open:text-foreground size-4 shrink-0 transition-colors" />
    );
}

interface PickerProps extends Omit<ComponentProps<'button'>, 'value' | 'onChange' | 'defaultValue'> {
    /** Decides the date format, month and weekday names, and the first day of the week, e.g. "en-IN". */
    locale: string;
    /** Earliest date that can be picked ("YYYY-MM-DD"). */
    min?: DateString;
    /** Latest date that can be picked. */
    max?: DateString;
    /** Dates that can't be picked, e.g. weekends or booked days. */
    isDisabled?: (date: DateString) => boolean;
    /** 0 for Sunday … 6 for Saturday. Defaults to the locale's. */
    weekStartsOn?: number;
    /** Classes for the trigger (e.g. a width, instead of the default full width). */
    className?: string;
    /** Height, matching Button's: sm (32px), default (40px) or lg (44px). */
    size?: FieldSize;
    placeholder?: string;
    /** Offers a clear option in the popup (shown when a value is set); clearing reports null. */
    clearable?: boolean;
    clearLabel?: string;
    /** Form field name: the value is submitted with the form ("YYYY-MM-DD", a range as "start/end"). */
    name?: string;
}

/** Also takes the trigger button's props (aria-*, data-*, onBlur…), so Field can wire it up. */
export interface DatePickerProps extends PickerProps {
    /** "YYYY-MM-DD", or null for none, when you keep it. */
    value?: DateString | null;
    /** The first date, when the picker keeps its own. */
    defaultValue?: DateString | null;
    onValueChange?: (date: DateString | null) => void;
}

export interface DateRangePickerProps extends PickerProps {
    /** The range when you keep it; `end` is null while only the start is picked. */
    value?: DateRange | null;
    /** The first range, when the picker keeps its own. */
    defaultValue?: DateRange | null;
    onValueChange?: (range: DateRange | null) => void;
    /** Months shown side by side (2 suits wide screens). */
    months?: number;
    /** Ranges picked in one tap, beside the calendar. */
    presets?: DateRangePreset[];
}

export interface DateRangePreset {
    label: string;
    range: DateRange;
}
