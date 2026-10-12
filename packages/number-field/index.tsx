import InputGroup, { InputGroupAddon, InputGroupInput } from '@zen/input-group';
import MinusMicro from '@zen/icons/micro/minus';
import PlusMicro from '@zen/icons/micro/plus';
import { useLocale, useMessages } from '@zen/locale-provider';
import { cx } from '@zen/utils/cx';
import { plainSpaces } from '@zen/utils/date';
import { FormValue } from '@zen/utils/form-value';
import { type FieldSize } from '@zen/utils/styles';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';

/**
 * A number to type or step: − and + on either side, ↑↓ by `step`, Page Up and
 * Page Down by `largeStep`, Home and End to `min` and `max`. Shown in the
 * locale's way (`formatOptions`: a percentage, a unit, decimals) and read back
 * from what's typed in it, digits, separators and all. Kept within `min` and
 * `max` once you leave the field; empty is null.
 */
export default function NumberField({
    value: valueProp,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 1,
    largeStep = step * 10,
    formatOptions,
    locale: localeProp,
    name,
    size = 'default',
    invalid,
    disabled,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
}: NumberFieldProps) {
    const m = useMessages();
    const locale = useLocale(localeProp);
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    const number = useMemo(() => new NumberReader(locale, formatOptions), [locale, formatOptions]);
    // What's typed, while the field has focus; otherwise the value, formatted.
    const [draft, setDraft] = useState<string | null>(null);

    const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    const by = (delta: number) => {
        const from = value ?? (delta > 0 ? (min ?? 0) - delta : (max ?? 0) - delta);
        // In whole steps from `min` (or 0), without float drift: 0.1 + 0.2 is 0.3.
        const base = min ?? 0;
        const next = clamp(base + Math.round((from + delta - base) / step) * step);
        const decimals = Math.max(places(step), places(base));
        setValue(Number(next.toFixed(decimals)));
        setDraft(null);
    };
    const shown = draft ?? (value === null ? '' : number.format(value));

    return (
        <InputGroup size={size} invalid={invalid} className={cx('zen__number-field px-1', className)}>
            <InputGroupAddon>
                <Step
                    label={m.decrease}
                    disabled={disabled || (value !== null && min !== undefined && value <= min)}
                    onStep={() => by(-step)}
                >
                    <MinusMicro />
                </Step>
            </InputGroupAddon>
            <InputGroupInput
                role="spinbutton"
                inputMode={(formatOptions?.maximumFractionDigits ?? 1) > 0 || (min ?? -1) < 0 ? 'decimal' : 'numeric'}
                autoComplete="off"
                aria-valuenow={value ?? undefined}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuetext={value === null ? undefined : number.format(value)}
                disabled={disabled}
                {...rest}
                value={shown}
                onFocus={(e) => {
                    onFocus?.(e);
                    setDraft(shown);
                }}
                onChange={(e) => {
                    setDraft(e.target.value);
                    const n = number.parse(e.target.value);
                    if (n !== undefined) setValue(n);
                }}
                onBlur={(e) => {
                    onBlur?.(e);
                    setDraft(null);
                    if (value !== null && clamp(value) !== value) setValue(clamp(value));
                }}
                onKeyDown={(e) => {
                    onKeyDown?.(e);
                    const to = {
                        ArrowUp: () => by(step),
                        ArrowDown: () => by(-step),
                        PageUp: () => by(largeStep),
                        PageDown: () => by(-largeStep),
                        Home: min === undefined ? undefined : () => setValue(min),
                        End: max === undefined ? undefined : () => setValue(max),
                    }[e.key];
                    if (!to || e.defaultPrevented) return;
                    e.preventDefault();
                    to();
                    setDraft(null);
                }}
                className="text-center tabular-nums"
            />
            <InputGroupAddon>
                <Step
                    label={m.increase}
                    disabled={disabled || (value !== null && max !== undefined && value >= max)}
                    onStep={() => by(step)}
                >
                    <PlusMicro />
                </Step>
            </InputGroupAddon>
            <FormValue name={name} value={value === null ? '' : String(value)} onReset={reset} />
        </InputGroup>
    );
}

/** − or +: out of the tab order (the arrow keys do the same). */
function Step({
    label,
    disabled,
    onStep,
    children,
}: {
    label: string;
    disabled?: boolean;
    onStep: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            tabIndex={-1}
            aria-label={label}
            disabled={disabled}
            // Keep focus in the input, so typing carries on after a press.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onStep}
            className="text-muted-foreground hover:bg-tint/[0.08] hover:text-foreground grid size-7 cursor-pointer place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}

const places = (n: number) => (String(n).split('.')[1] ?? '').length;

/** Formats numbers for a locale, and reads them back from text typed that way. */
class NumberReader {
    private readonly formatter: Intl.NumberFormat;
    private readonly decimal: string;
    private readonly digits: Map<string, string>;
    private readonly percent: boolean;

    constructor(locale: string, options?: Intl.NumberFormatOptions) {
        this.formatter = new Intl.NumberFormat(locale, options);
        const parts = new Intl.NumberFormat(locale).formatToParts(1.5);
        this.decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
        const own = new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210);
        this.digits = new Map([...own].map((d, i) => [d, String(9 - i)]));
        this.percent = options?.style === 'percent';
    }

    format(n: number) {
        return plainSpaces(this.formatter.format(n));
    }

    /** The number in the text, null when it's empty, or undefined when it isn't a number (yet). */
    parse(text: string): number | null | undefined {
        let plain = '';
        for (const c of text) {
            const d = this.digits.get(c) ?? (/\d/.test(c) ? c : undefined);
            if (d) plain += d;
            else if (c === this.decimal) plain += '.';
            else if ((c === '-' || c === '−') && plain === '') plain = '-';
        }
        if (plain === '' && text.trim() === '') return null;
        if (!/^-?\d+(\.\d+)?$/.test(plain)) return undefined;
        const n = Number(plain);
        return this.percent ? n / 100 : n;
    }
}

export interface NumberFieldProps extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'step' | 'onChange'
> {
    /** The number, or null for empty, when you keep it. */
    value?: number | null;
    /** The first number, when the field keeps its own. */
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    /** What ↑↓ and − + add or take away. Default 1. */
    step?: number;
    /** What Page Up and Page Down do. Default ten steps. */
    largeStep?: number;
    /** How it's shown, as for Intl.NumberFormat: { style: 'percent' }, { maximumFractionDigits: 2 }, a unit. */
    formatOptions?: Intl.NumberFormatOptions;
    /** Defaults to the LocaleProvider's. */
    locale?: string;
    /** Form field name: the number is submitted under it. */
    name?: string;
    /** Height, matching Button's. */
    size?: FieldSize;
    /** Show the field in its error state. */
    invalid?: boolean;
}
