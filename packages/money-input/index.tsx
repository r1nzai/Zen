import InputGroup, { InputGroupAddon, InputGroupInput } from '@zen/input-group';
import Menu, { MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@zen/menu';
import Spinner from '@zen/spinner';
import { cx } from '@zen/utils/cx';
import { FieldChevron } from '@zen/utils/field-chevron';
import { convertMinor, type ForeignAmount, rateBetween, type RateTable } from '@zen/utils/fx';
import { currencySymbol, formatAmount, formatMoney, minorDigits, type Money, parseMoneyInput } from '@zen/utils/money';
import { AlertIcon, InfoIcon } from '@zen/utils/status-icons';
import { ChangeEvent, KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react';

/**
 * Amount input in one currency. Shows grouped digits for the locale (1,52,000
 * for en-IN) and accepts shorthand: 1.5L, 2cr, 10k, 1.2m. Commits on blur or
 * Enter; Escape reverts. Values are integer minor units (paise, cents), or null
 * when empty.
 *
 * With `convert`, the symbol becomes a currency switch: type an amount in e.g.
 * USD and it's converted at the rates you load (in the browser; the amount is
 * never sent anywhere). Replace the symbol with `start`, or build your own field
 * from useMoneyInput, MoneyCurrencyMenu and MoneyConversionHint.
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
    const foreign = !!money.conversion?.foreign;
    return (
        <div className={cx('zen__money-input flex flex-col gap-1', className)}>
            <InputGroup
                invalid={!!money.error}
                data-foreign={foreign || undefined}
                className={cx(compact && 'h-7', 'data-foreign:border-primary/50')}
            >
                {start ??
                    (money.conversion && !disabled ? (
                        <MoneyCurrencyMenu money={money} />
                    ) : (
                        <InputGroupAddon aria-hidden data-slot="symbol">
                            {money.symbol}
                        </InputGroupAddon>
                    ))}
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
            {money.error ? (
                <p
                    id={money.errorId}
                    role="alert"
                    className="text-destructive mt-0! flex items-center gap-1.5 text-xs font-medium"
                >
                    <AlertIcon className="shrink-0" />
                    {money.error}
                </p>
            ) : (
                <MoneyConversionHint money={money} />
            )}
        </div>
    );
}

/**
 * The currency switch for a converting field (`convert`): shows the symbol, or
 * the code of the foreign currency being typed in, and opens a menu of your
 * currency and the ones with a rate. Put it in an InputGroup's start slot.
 */
export function MoneyCurrencyMenu({ money, className }: { money: MoneyInputState; className?: string }) {
    const c = money.conversion;
    if (!c) return null;
    return (
        <Menu>
            <MenuTrigger
                aria-label={`Currency: ${c.currency}. Change to enter another currency`}
                className={cx(
                    'group/currency hover:bg-tint/[0.07] focus-visible:ring-ring/50 -ml-1 flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-sm outline-hidden focus-visible:ring-2',
                    c.foreign ? 'text-primary' : 'text-muted-foreground',
                    className,
                )}
            >
                {c.foreign ? c.currency : money.symbol}
                <FieldChevron className="text-inherit duration-150 group-data-popup-open/currency:rotate-180" />
            </MenuTrigger>
            <MenuContent align="start" offset={8} aria-label="Currency" className="max-h-72 w-60 overflow-y-auto">
                <MenuItem onSelect={() => c.pick(c.home)} className="gap-2 py-1.5">
                    <span className="w-9 font-medium">{c.home}</span>
                    <span className="text-muted-foreground">Your currency</span>
                </MenuItem>
                <MenuSeparator />
                <div className="text-muted-foreground px-3 pt-1 pb-1.5 text-xs">
                    Enter in another currency, converted at today’s rate
                </div>
                {c.choices.map((code) => (
                    <MenuItem key={code} onSelect={() => c.pick(code)} className="gap-2 py-1.5">
                        <span className="w-9 font-medium">{code}</span>
                        <span className="text-muted-foreground">{currencySymbol(code, 'en')}</span>
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    );
}

/**
 * The line under a converting field: getting the rate, the rate and what the
 * typed amount comes to, or what the last amount was converted from.
 */
export function MoneyConversionHint({ money, className }: { money: MoneyInputState; className?: string }) {
    const c = money.conversion;
    if (!c || (!c.foreign && !c.converted)) return null;
    const { home, locale } = c;
    const row = cx('text-muted-foreground flex items-center gap-1.5 text-xs', className);
    if (!c.foreign) {
        const from = c.converted!;
        return (
            <p id={money.hintId} role="status" className={row}>
                <InfoIcon className="text-primary shrink-0" />
                Converted from {formatMoney(from.amount, from.currency, locale)} at {roundRate(from.rate)}
            </p>
        );
    }
    return (
        <p id={money.hintId} role="status" className={row}>
            {c.status === 'idle' || c.status === 'loading' ? (
                <>
                    <Spinner className="size-3" /> Getting today’s rate…
                </>
            ) : c.rate === null ? (
                <>
                    <AlertIcon className="text-destructive shrink-0" /> Couldn’t get exchange rates. Enter the amount in{' '}
                    {home}.
                </>
            ) : (
                <>
                    <InfoIcon className="text-primary shrink-0" />
                    <span>
                        {c.preview !== null && (
                            <span className="text-foreground font-medium">
                                ≈ {formatMoney(c.preview, home, locale)} ·{' '}
                            </span>
                        )}
                        1 {c.currency} = {formatMoney(Math.round(c.rate * 10 ** minorDigits(home)), home, locale)} (
                        {c.source ? `${c.source}, ` : ''}
                        {shortDate(c.date!, locale)})
                    </span>
                </>
            )}
        </p>
    );
}

/**
 * MoneyInput's behaviour without its markup: spread `inputProps` onto any
 * input (e.g. an InputGroupInput next to your own addons) and show `error`.
 * With `convert`, `conversion` drives MoneyCurrencyMenu and MoneyConversionHint.
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
    convert,
}: MoneyInputOptions) {
    const initial = convert?.initial ?? null;
    // The currency being typed in: `currency`, or a foreign one converted into it.
    const [inputCurrency, setInputCurrency] = useState(() => initial?.currency ?? currency);
    const foreign = !!convert && inputCurrency !== currency;
    const rates = useRates(convert?.loadRates, foreign);

    const format = (v: Money | null) => (v === null ? '' : formatAmount(v, currency, locale));
    const [text, setText] = useState(() =>
        initial ? formatAmount(initial.amount, initial.currency, locale) : format(value),
    );
    const [error, setError] = useState<string | null>(null);
    // What the shown amount was last converted from.
    const [converted, setConverted] = useState<ForeignAmount | null>(null);
    const [focused, setFocused] = useState(false);
    // Live mode reports while typing; an untouched field keeps showing the value it was given.
    const [dirty, setDirty] = useState(false);
    const errorId = useId();
    const hintId = useId();

    // Follow outside changes while the user isn't editing (or typing in another currency).
    useEffect(() => {
        if (!focused && !foreign && !(live && dirty)) setText(format(value));
    }, [value, currency, locale]);

    const rateFor = (from: string) => {
        if (!rates.table) return null;
        try {
            return rateBetween(rates.table, from, currency);
        } catch {
            return null;
        }
    };
    const rate = foreign ? rateFor(inputCurrency) : null;

    const example = (cur: string) =>
        `Not an amount. Try ${formatAmount(3274000, cur, locale)} or ${locale.endsWith('-IN') ? '1.5L' : '10k'}.`;

    /** Validates the text in `cur`; returns the amount, `null` for empty, or undefined (and shows why) if invalid. */
    function read(t: string, cur: string): Money | null | undefined {
        const trimmed = t.trim();
        if (trimmed === '') {
            if (allowEmpty) return null;
            setError('Enter an amount.');
            return undefined;
        }
        let parsed: Money;
        try {
            parsed = parseMoneyInput(trimmed, cur);
        } catch {
            setError(example(cur));
            return undefined;
        }
        if (!allowNegative && parsed < 0) {
            setError("Amount can't be negative.");
            return undefined;
        }
        setError(null);
        return parsed;
    }

    /** Live mode: report what the text means in `cur`, converted at `r`. */
    function report(t: string, cur: string, r: number | null) {
        const trimmed = t.trim();
        if (trimmed === '') {
            onChange(null);
            convert?.onForeign?.(null);
            return;
        }
        let parsed: Money;
        try {
            parsed = parseMoneyInput(trimmed, cur);
        } catch {
            // Not an amount (yet): report null; the form's own validation says so on save.
            onChange(null);
            return;
        }
        if (cur === currency) {
            onChange(parsed);
            convert?.onForeign?.(null);
        } else if (r === null) {
            onChange(null); // rate not here yet: never report an unconverted amount
        } else {
            onChange(convertMinor(parsed, r, cur, currency));
            convert?.onForeign?.({ currency: cur, amount: parsed, rate: r, date: rates.table!.date });
        }
    }

    // Live mode: once the rate arrives, report the conversion of what's already typed.
    useEffect(() => {
        if (live && dirty && foreign) report(text, inputCurrency, rate);
    }, [rate]);

    /** Commit mode: report the amount (converted if foreign) and tidy the text. Returns whether it was valid. */
    function commit(): boolean {
        const parsed = read(text, inputCurrency);
        if (parsed === undefined) return false;
        if (parsed !== null && foreign) {
            if (rate === null) {
                setError(
                    rates.status === 'error' ? "Couldn't get today's exchange rate." : "Still getting today's rate…",
                );
                return false;
            }
            const home = convertMinor(parsed, rate, inputCurrency, currency);
            const original = { currency: inputCurrency, amount: parsed, rate, date: rates.table!.date };
            setConverted(original);
            setInputCurrency(currency);
            setText(format(home));
            onChange(home);
            convert?.onForeign?.(original);
            return true;
        }
        setText(format(parsed));
        onChange(parsed);
        // Re-confirming the same amount (e.g. blurring after a conversion) keeps the
        // conversion; a different amount typed in `currency` clears it.
        if (parsed !== value) {
            setConverted(null);
            convert?.onForeign?.(null);
        }
        return true;
    }

    /** Live mode on blur/Enter: values were already reported; just validate and tidy the text. */
    function tidy() {
        const parsed = read(text, inputCurrency);
        if (parsed !== undefined) setText(parsed === null ? '' : formatAmount(parsed, inputCurrency, locale));
    }

    /** Switches the currency being typed in. */
    function pick(cur: string) {
        setInputCurrency(cur);
        setError(null);
        if (live && text.trim()) {
            setDirty(true);
            // A new currency needs its own rate; it's reported when it arrives (effect above).
            report(text, cur, cur === currency ? null : rateFor(cur));
        }
    }

    const preview = (() => {
        if (!foreign || rate === null || !text.trim()) return null;
        try {
            return convertMinor(parseMoneyInput(text, inputCurrency), rate, inputCurrency, currency);
        } catch {
            return null;
        }
    })();

    const hinted = foreign || !!converted;
    const inputProps = {
        type: 'text',
        inputMode: 'decimal',
        autoComplete: 'off',
        spellCheck: false,
        value: text,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': cx(error ? errorId : hinted && hintId) || undefined,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
            setText(e.target.value);
            setConverted(null);
            if (!live) return;
            setDirty(true);
            report(e.target.value, inputCurrency, rate);
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
                setInputCurrency(currency);
                setText(format(value));
                setError(null);
                onCancel?.();
            }
        },
    } as const;

    return {
        inputProps,
        /** The symbol of the currency being typed in, in this locale, e.g. "₹" or "$". */
        symbol: currencySymbol(inputCurrency, locale),
        error,
        errorId,
        /** Id of MoneyConversionHint's line, which the input is described by. */
        hintId,
        text,
        setText,
        commit,
        /** The value formatted with its symbol, e.g. "₹1,52,000.00". */
        formatted: value === null ? '' : formatMoney(value, currency, locale),
        /** With `convert`: the currency switch and conversion state; null without. */
        conversion: convert
            ? {
                  /** The field's own currency. */
                  home: currency,
                  locale,
                  /** The currency being typed in. */
                  currency: inputCurrency,
                  /** Whether that's another currency, converted into `home`. */
                  foreign,
                  /** Other currencies to offer: `convert.currencies`, less those the loaded rates lack. */
                  choices: convert.currencies.filter(
                      (c) => c !== currency && (!rates.table || c === rates.table.base || c in rates.table.rates),
                  ),
                  pick,
                  status: rates.status,
                  /** Units of `home` per 1 of `currency`, once loaded. */
                  rate,
                  /** Day of the rates, "YYYY-MM-DD", once loaded. */
                  date: rates.table?.date ?? null,
                  source: convert.source,
                  /** What the typed amount comes to in `home`. */
                  preview,
                  /** What the shown amount was converted from, after a conversion. */
                  converted,
              }
            : null,
    };
}

export type MoneyInputState = ReturnType<typeof useMoneyInput>;

type RatesStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Loads rates the first time they're needed (and again after a failure, when next needed). */
function useRates(load: CurrencyConversion['loadRates'] | undefined, needed: boolean) {
    const [state, setState] = useState<{ table: RateTable | null; status: RatesStatus }>({
        table: null,
        status: 'idle',
    });
    const loadRef = useRef(load);
    loadRef.current = load;
    useEffect(() => {
        const loader = loadRef.current;
        if (!loader || !needed || state.status === 'ready' || state.status === 'loading') return;
        const done = (table: RateTable | null) =>
            setState(table ? { table, status: 'ready' } : { table: null, status: 'error' });
        let result: ReturnType<typeof loader>;
        try {
            result = loader();
        } catch {
            return void done(null);
        }
        if (result && typeof (result as Promise<unknown>).then === 'function') {
            setState({ table: null, status: 'loading' });
            (result as Promise<RateTable | null>).then(done, () => done(null));
        } else done(result as RateTable | null);
    }, [needed]);
    return state;
}

const roundRate = (r: number) => (r >= 100 ? r.toFixed(2) : r >= 1 ? r.toFixed(4) : r.toPrecision(4));
const shortDate = (d: string, locale: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
        new Date(`${d}T00:00:00Z`),
    );

/** Typing amounts in other currencies, converted into the field's own. */
export interface CurrencyConversion {
    /** Currencies to offer besides the field's own, in order. Those the loaded rates lack are left out. */
    currencies: readonly string[];
    /**
     * Gets the rates, the first time another currency is picked. Return them
     * (from a cache) or a promise; null when unavailable. Cache as you see fit.
     */
    loadRates: () => RateTable | null | Promise<RateTable | null>;
    /** Named with the rate, e.g. "ECB". */
    source?: string;
    /** The original after a conversion, or null when the amount was typed in the field's currency. */
    onForeign?: (original: ForeignAmount | null) => void;
    /** Open showing a saved foreign amount (e.g. editing an entry that was converted). */
    initial?: ForeignAmount | null;
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
     * For forms: report the amount (converted, when typed in another currency) on
     * every keystroke instead of on blur, so a Save button can never miss it.
     * Invalid text reports null.
     */
    live?: boolean;
    /** Called on Escape, after reverting. */
    onCancel?: () => void;
    /** Let people type in another currency, converted at the rates you load. */
    convert?: CurrencyConversion;
}

export interface MoneyInputProps extends MoneyInputOptions {
    /** Replaces the currency symbol (or the currency switch), e.g. with your own. */
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
