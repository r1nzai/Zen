import InputGroup, { InputGroupAddon, InputGroupInput } from '@zen/input-group';
import { cx } from '@zen/utils/cx';
import { currencySymbol, formatAmount, formatMoney, type Money, parseMoneyInput } from '@zen/utils/money';
import { AlertIcon } from '@zen/utils/status-icons';
import { ChangeEvent, KeyboardEvent, ReactNode, useEffect, useId, useState } from 'react';

/**
 * Amount input in one currency. Shows grouped digits for the locale (1,52,000
 * for en-IN) and accepts shorthand: 1.5L, 2cr, 10k, 1.2m. Commits on blur or
 * Enter; Escape reverts. Values are integer minor units (paise, cents), or null
 * when empty. Replace the symbol with `start` (e.g. a currency switcher), or
 * build your own field from useMoneyInput.
 */
export default function MoneyInput({
    start,
    end,
    compact = false,
    disabled = false,
    id,
    autoFocus,
    className,
    'aria-label': ariaLabel,
    ...options
}: MoneyInputProps) {
    const money = useMoneyInput(options);
    return (
        <div className={cx('zen__money-input flex flex-col gap-1', className)}>
            <InputGroup invalid={!!money.error} className={cx(compact && 'h-7')}>
                {start ?? (
                    <InputGroupAddon aria-hidden data-slot="symbol">
                        {money.symbol}
                    </InputGroupAddon>
                )}
                <InputGroupInput
                    {...money.inputProps}
                    id={id}
                    autoFocus={autoFocus}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    className={cx('tabular-nums', compact ? 'text-right' : 'text-left')}
                />
                {end}
            </InputGroup>
            {money.error && (
                <p
                    id={money.errorId}
                    role="alert"
                    className="text-destructive mt-0! flex items-center gap-1.5 text-xs font-medium"
                >
                    <AlertIcon className="shrink-0" />
                    {money.error}
                </p>
            )}
        </div>
    );
}

/**
 * MoneyInput's behaviour without its markup: spread `inputProps` onto any
 * input (e.g. an InputGroupInput next to your own addons) and show `error`.
 */
export function useMoneyInput({
    value,
    onChange,
    currency,
    locale,
    allowNegative = false,
    allowEmpty = false,
    live = false,
    onCancel,
}: MoneyInputOptions) {
    const format = (v: Money | null) => (v === null ? '' : formatAmount(v, currency, locale));
    const [text, setText] = useState(() => format(value));
    const [error, setError] = useState<string | null>(null);
    const [focused, setFocused] = useState(false);
    // Live mode reports while typing; an untouched field keeps showing the value it was given.
    const [dirty, setDirty] = useState(false);
    const errorId = useId();

    // Follow outside changes while the user isn't editing.
    useEffect(() => {
        if (!focused && !(live && dirty)) setText(format(value));
    }, [value, currency, locale]);

    const example = `Not an amount. Try ${formatAmount(3274000, currency, locale)} or ${locale.endsWith('-IN') ? '1.5L' : '10k'}.`;

    /** Validates the text; returns the amount, `null` for empty, or undefined (and shows why) if invalid. */
    function read(t: string): Money | null | undefined {
        const trimmed = t.trim();
        if (trimmed === '') {
            if (allowEmpty) return null;
            setError('Enter an amount.');
            return undefined;
        }
        let parsed: Money;
        try {
            parsed = parseMoneyInput(trimmed, currency);
        } catch {
            setError(example);
            return undefined;
        }
        if (!allowNegative && parsed < 0) {
            setError("Amount can't be negative.");
            return undefined;
        }
        setError(null);
        return parsed;
    }

    /** Commit mode: report the amount and tidy the text. Returns whether it was valid. */
    function commit(): boolean {
        const parsed = read(text);
        if (parsed === undefined) return false;
        setText(format(parsed));
        onChange(parsed);
        return true;
    }

    /** Live mode on blur/Enter: values were already reported; just validate and tidy the text. */
    function tidy() {
        const parsed = read(text);
        if (parsed !== undefined) setText(format(parsed));
    }

    const inputProps = {
        type: 'text',
        inputMode: 'decimal',
        autoComplete: 'off',
        spellCheck: false,
        value: text,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
            setText(e.target.value);
            if (!live) return;
            setDirty(true);
            // Not an amount (yet): report null; the form's own validation says so on save.
            try {
                const t = e.target.value.trim();
                onChange(t === '' ? null : parseMoneyInput(t, currency));
            } catch {
                onChange(null);
            }
        },
        onFocus: () => setFocused(true),
        onBlur: () => {
            setFocused(false);
            if (live) tidy();
            else commit();
        },
        onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (live) tidy();
                else commit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setText(format(value));
                setError(null);
                onCancel?.();
            }
        },
    } as const;

    return {
        inputProps,
        /** The currency's symbol in this locale, e.g. "₹" or "$". */
        symbol: currencySymbol(currency, locale),
        error,
        errorId,
        text,
        setText,
        commit,
        /** The value formatted with its symbol, e.g. "₹1,52,000.00". */
        formatted: value === null ? '' : formatMoney(value, currency, locale),
    };
}

export interface MoneyInputOptions {
    /** Amount in minor units (paise, cents), or null when empty. */
    value: Money | null;
    onChange: (value: Money | null) => void;
    /** ISO 4217 code, e.g. "INR", "USD". */
    currency: string;
    /** Decides digit grouping and the symbol, e.g. "en-IN" (1,52,000) or "en-US" (152,000). */
    locale: string;
    allowNegative?: boolean;
    allowEmpty?: boolean;
    /**
     * For forms: report the amount on every keystroke instead of on blur, so a
     * Save button can never miss it. Invalid text reports null.
     */
    live?: boolean;
    /** Called on Escape, after reverting. */
    onCancel?: () => void;
}

export interface MoneyInputProps extends MoneyInputOptions {
    /** Replaces the currency symbol, e.g. with a currency switcher. */
    start?: ReactNode;
    /** Content after the input, e.g. a unit or a clear button. */
    end?: ReactNode;
    /** Smaller, for editing inside table rows. */
    compact?: boolean;
    disabled?: boolean;
    id?: string;
    autoFocus?: boolean;
    className?: string;
    'aria-label'?: string;
}
