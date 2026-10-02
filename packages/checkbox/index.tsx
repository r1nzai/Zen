import CheckMicro from '@zen/icons/micro/check';
import MinusMicro from '@zen/icons/micro/minus';
import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode, useEffect, useRef } from 'react';

/**
 * A checkbox: a native one, styled, so forms, the keyboard and screen readers
 * work as usual. The tick draws itself in when checked; `indeterminate` shows a
 * dash (e.g. "some selected"). With children, they're its label (and
 * `description` a line under it); without, label it yourself or put it in a Field.
 */
export default function Checkbox({
    children,
    description,
    indeterminate = false,
    onChange,
    className,
    ...rest
}: CheckboxProps) {
    const ref = useRef<HTMLInputElement>(null);
    // Only settable from script: there's no indeterminate attribute.
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);
    const field = useFieldProps(rest);
    const box = (
        <span
            className={cx(
                'zen__checkbox relative inline-grid size-[1.125rem] shrink-0 place-items-center',
                !children && className,
            )}
        >
            <input
                ref={ref}
                type="checkbox"
                {...rest}
                {...field}
                aria-checked={indeterminate ? 'mixed' : undefined}
                onChange={(e) => onChange?.(e.target.checked)}
                className={cx(
                    'peer bg-tint/[0.04] m-0 size-full cursor-pointer appearance-none rounded-[5px] border border-[color:oklch(var(--tint)/var(--zen-control-edge))]',
                    'outline-hidden transition-[background-color,border-color,box-shadow] duration-200',
                    'focus-visible:ring-ring/50 focus-visible:ring-2 hover:enabled:border-[color:oklch(var(--tint)/var(--zen-control-edge-hover))]',
                    'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
                    'checked:shadow-[0_0_14px_-2px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] indeterminate:shadow-[0_0_14px_-2px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]',
                    'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
                )}
            />
            {/* The tick is uncovered from left to right, as if drawn, as the box is checked. */}
            <CheckMicro className="zen__checkbox-check text-primary-foreground pointer-events-none absolute size-3.5 opacity-0 transition-[opacity,clip-path] duration-300 ease-out [clip-path:inset(0_100%_0_0)] peer-checked:opacity-100 peer-checked:[clip-path:inset(0)] peer-indeterminate:hidden" />
            <MinusMicro className="text-primary-foreground pointer-events-none absolute hidden size-3.5 peer-indeterminate:block" />
        </span>
    );
    if (!children) return box;
    return (
        <label
            className={cx(
                'inline-flex cursor-pointer items-start gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60',
                className,
            )}
        >
            <span className="mt-px flex">{box}</span>
            <span className="flex flex-col gap-0.5">
                {children}
                {description && <span className="text-muted-foreground text-xs">{description}</span>}
            </span>
        </label>
    );
}

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'onChange' | 'type' | 'children'> {
    onChange?: (checked: boolean) => void;
    /** Shows a dash instead of the tick, e.g. when some of a group are checked. */
    indeterminate?: boolean;
    /** The label. */
    children?: ReactNode;
    /** A muted line under the label. */
    description?: ReactNode;
    /** Classes for the label (or, without one, the box). */
    className?: string;
}
