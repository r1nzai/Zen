import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { ComponentProps, useState } from 'react';

/**
 * A one-time code (sign-in, verification): a box per character. It's one real
 * field under the boxes, so typing, pasting, deleting and the phone's
 * autofill from a text message all work as in any field. `onComplete` gets the
 * code once every box is filled.
 */
export default function CodeInput({
    length = 6,
    value: controlled,
    defaultValue = '',
    onValueChange,
    onComplete,
    allowed = /\d/,
    className,
    disabled,
    ...rest
}: CodeInputProps) {
    const [own, setOwn] = useState(defaultValue);
    const value = controlled ?? own;
    const [focused, setFocused] = useState(false);
    const field = useFieldProps(rest);
    const digits = allowed.source === '\\d';

    return (
        <div className={cx('zen__code-input relative inline-flex gap-2', disabled && 'opacity-50', className)}>
            <input
                autoComplete="one-time-code"
                inputMode={digits ? 'numeric' : 'text'}
                spellCheck={false}
                maxLength={length}
                {...rest}
                {...field}
                disabled={disabled}
                value={value}
                onChange={(e) => {
                    const next = e.target.value
                        .split('')
                        .filter((c) => allowed.test(c))
                        .join('')
                        .slice(0, length);
                    if (controlled === undefined) setOwn(next);
                    onValueChange?.(next);
                    if (next.length === length && value.length !== length) onComplete?.(next);
                }}
                onFocus={(e) => {
                    rest.onFocus?.(e);
                    setFocused(true);
                    // Typing goes on from the end, wherever the box clicked.
                    const end = e.target.value.length;
                    e.target.setSelectionRange(end, end);
                }}
                onBlur={(e) => {
                    rest.onBlur?.(e);
                    setFocused(false);
                }}
                className="absolute inset-0 z-10 cursor-text font-mono text-transparent caret-transparent opacity-0 outline-hidden selection:bg-transparent disabled:cursor-not-allowed"
            />
            {Array.from({ length }, (_, i) => {
                const active = focused && (i === value.length || (i === length - 1 && value.length === length));
                return (
                    <span
                        key={i}
                        aria-hidden
                        className={cx(
                            'glow-border bg-tint/[0.035] relative grid h-12 w-10 place-items-center rounded-lg border font-mono text-lg tabular-nums [--glow-border-color:oklch(var(--glow)/0.22)]',
                            'transition-[border-color,box-shadow,background-color] duration-200',
                            active &&
                                'border-glow/60 bg-tint/[0.05] shadow-glow-focus [--glow-border-color:transparent]',
                            field['aria-invalid'] && 'border-destructive/60',
                        )}
                    >
                        {value[i]}
                        {active && i === value.length && (
                            <span className="zen__code-caret bg-foreground absolute h-5 w-px" />
                        )}
                    </span>
                );
            })}
        </div>
    );
}

export interface CodeInputProps extends Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'maxLength'> {
    /** How many characters (boxes). */
    length?: number;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Called with the code when the last box is filled. */
    onComplete?: (code: string) => void;
    /** Which characters count (one at a time); digits by default. Others typed or pasted are dropped. */
    allowed?: RegExp;
}
