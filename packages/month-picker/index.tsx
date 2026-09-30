import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';
import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { formatMonth, type Month, monthNames } from '@zen/utils/month';
import { POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, useState } from 'react';

/**
 * Month selector: a field showing "Sep 2026" that opens a year and a 12-month
 * grid. Months are "YYYY-MM" strings. With `onClear`, the popup also offers
 * `clearLabel` (e.g. "No end") to empty it.
 */
export default function MonthPicker({
    value,
    onChange,
    locale,
    min,
    max,
    id,
    className,
    disabled = false,
    placeholder = 'Pick a month',
    onClear,
    clearLabel = 'Clear',
    style,
    ...rest
}: MonthPickerProps) {
    const [year, setYear] = useState(() => Number((value ?? new Date().toISOString()).slice(0, 4)));
    const popup = useAnchoredPopup<HTMLDivElement>({
        // Opening shows the chosen month's year.
        onOpenChange: (open) => open && value && setYear(Number(value.slice(0, 4))),
    });
    const names = monthNames(locale);
    const inRange = (m: Month) => (!min || m >= min) && (!max || m <= max);

    return (
        <>
            <button
                type="button"
                {...rest}
                id={id}
                disabled={disabled}
                {...popup.triggerProps}
                style={{ ...popup.triggerProps.style, ...style }}
                className={cx('zen__month-picker group', TRIGGER, 'w-full', popup.open && TRIGGER_OPEN, className)}
            >
                <span className={value ? undefined : 'text-muted-foreground'}>
                    {value ? formatMonth(value, locale) : placeholder}
                </span>
                <FieldChevron open={popup.open} />
            </button>
            <div
                {...popup.popupProps}
                role="dialog"
                aria-label="Choose month"
                className={cx('zen__popover', POPUP, 'w-64 p-3')}
            >
                <div className="mb-2 flex items-center justify-between">
                    <button
                        type="button"
                        aria-label="Previous year"
                        onClick={() => setYear((y) => y - 1)}
                        className="hover:bg-muted rounded p-1.5"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums" aria-live="polite">
                        {year}
                    </span>
                    <button
                        type="button"
                        aria-label="Next year"
                        onClick={() => setYear((y) => y + 1)}
                        className="hover:bg-muted rounded p-1.5"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {names.map((name, i) => {
                        const month = `${year}-${String(i + 1).padStart(2, '0')}`;
                        const selected = month === value;
                        return (
                            <button
                                key={month}
                                type="button"
                                disabled={!inRange(month)}
                                aria-pressed={selected}
                                aria-label={formatMonth(month, locale, 'long')}
                                onClick={() => {
                                    onChange(month);
                                    popup.setOpen(false);
                                }}
                                className={cx(
                                    'rounded-sm py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40',
                                    selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                                )}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
                {onClear && value && (
                    <button
                        type="button"
                        onClick={() => {
                            onClear();
                            popup.setOpen(false);
                        }}
                        className="border-tint/[0.06] text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 mt-2 w-full rounded-lg border-t px-2 pt-2.5 pb-1.5 text-sm outline-hidden focus-visible:ring-2"
                    >
                        {clearLabel}
                    </button>
                )}
            </div>
        </>
    );
}

/** Also takes the trigger button's props (aria-*, data-*, onBlur…), so Field can wire it up. */
export interface MonthPickerProps extends Omit<ComponentProps<'button'>, 'value' | 'onChange' | 'defaultValue'> {
    /** "YYYY-MM", or null for none. */
    value: Month | null;
    onChange: (month: Month) => void;
    /** Decides month names and format, e.g. "en-IN". */
    locale: string;
    /** Earliest month that can be picked ("YYYY-MM"). */
    min?: Month;
    /** Latest month that can be picked. */
    max?: Month;
    id?: string;
    /** Classes for the trigger (e.g. a width, instead of the default full width). */
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    /** Offers a clear option in the popup (shown when a month is set). */
    onClear?: () => void;
    clearLabel?: string;
}
