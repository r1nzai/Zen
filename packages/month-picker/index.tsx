import { useLocale, useMessages } from '@zen/locale-provider';
import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';
import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { FormValue } from '@zen/utils/form-value';
import { FieldChevron } from '@zen/utils/field-chevron';
import { formatMonth, type Month, monthNames } from '@zen/utils/month';
import {
    PICKER_MONTH,
    PICKER_MONTH_ON,
    PICKER_NAV,
    POPUP,
    TRIGGER,
    TRIGGER_OPEN,
    PLACEHOLDER,
    FIELD_SIZE,
    type FieldSize,
} from '@zen/utils/styles';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, useState } from 'react';

/**
 * Month selector: a field showing "Sep 2026" that opens a year and a 12-month
 * grid. Months are "YYYY-MM" strings. When `clearable`, the popup also offers
 * `clearLabel` (e.g. "No end") to empty it. With `name`, it's submitted with a form.
 */
export default function MonthPicker({
    value: valueProp,
    defaultValue = null,
    onValueChange,
    locale: localeProp,
    min,
    max,
    id,
    className,
    disabled = false,
    size = 'default',
    placeholder: placeholderProp,
    clearable = false,
    clearLabel: clearLabelProp,
    name,
    style,
    ...rest
}: MonthPickerProps) {
    const m = useMessages();
    const placeholder = placeholderProp ?? m.pickMonth;
    const clearLabel = clearLabelProp ?? m.clear;
    const locale = useLocale(localeProp);
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    const [year, setYear] = useState(() => Number((value ?? new Date().toISOString()).slice(0, 4)));
    const popup = useAnchoredPopup<HTMLDivElement>({
        // Opening shows the chosen month's year.
        onOpenChange: (open) => open && value && setYear(Number(value.slice(0, 4))),
    });
    const field = useFieldProps({ ...rest, id });
    const names = monthNames(locale);
    const inRange = (m: Month) => (!min || m >= min) && (!max || m <= max);

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
                    'zen__month-picker group',
                    TRIGGER,
                    FIELD_SIZE[size],
                    'w-full',
                    popup.open && TRIGGER_OPEN,
                    className,
                )}
            >
                <span className={value ? undefined : PLACEHOLDER}>
                    {value ? formatMonth(value, locale) : placeholder}
                </span>
                <FieldChevron open={popup.open} />
            </button>
            <FormValue name={name} value={value ?? ''} onReset={reset} />
            <div
                {...popup.popupProps}
                role="dialog"
                aria-label={m.chooseMonth}
                className={cx('zen__popover', POPUP, 'w-64 p-3')}
            >
                <div className="mb-2 flex items-center justify-between">
                    <button
                        type="button"
                        aria-label={m.previousYear}
                        onClick={() => setYear((y) => y - 1)}
                        className={PICKER_NAV}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums" aria-live="polite">
                        {year}
                    </span>
                    <button
                        type="button"
                        aria-label={m.nextYear}
                        onClick={() => setYear((y) => y + 1)}
                        className={PICKER_NAV}
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
                                    setValue(month);
                                    popup.setOpen(false);
                                }}
                                className={cx(PICKER_MONTH, selected && PICKER_MONTH_ON)}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
                {clearable && value && (
                    <button
                        type="button"
                        onClick={() => {
                            setValue(null);
                            popup.setOpen(false);
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

/** Also takes the trigger button's props (aria-*, data-*, onBlur…), so Field can wire it up. */
export interface MonthPickerProps extends Omit<ComponentProps<'button'>, 'value' | 'onChange' | 'defaultValue'> {
    /** "YYYY-MM", or null for none, when you keep it. */
    value?: Month | null;
    /** The first month, when the picker keeps its own. */
    defaultValue?: Month | null;
    onValueChange?: (month: Month | null) => void;
    /** Decides month names and format, e.g. "en-IN". Defaults to the LocaleProvider's. */
    locale?: string;
    /** Earliest month that can be picked ("YYYY-MM"). */
    min?: Month;
    /** Latest month that can be picked. */
    max?: Month;
    id?: string;
    /** Classes for the trigger (e.g. a width, instead of the default full width). */
    className?: string;
    disabled?: boolean;
    /** Height, matching Button's: sm (32px), default (40px) or lg (44px). */
    size?: FieldSize;
    placeholder?: string;
    /** Offers a clear option in the popup (shown when a month is set); clearing reports null. */
    clearable?: boolean;
    clearLabel?: string;
    /** Form field name: the month ("YYYY-MM") is submitted with the form. */
    name?: string;
}
