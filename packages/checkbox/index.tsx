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
                    'peer border-tint/20 bg-tint/[0.04] m-0 size-full cursor-pointer appearance-none rounded-[5px] border',
                    'outline-hidden transition-[background-color,border-color,box-shadow] duration-200',
                    'hover:enabled:border-tint/35 focus-visible:ring-ring/50 focus-visible:ring-2',
                    'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
                    'checked:shadow-[0_0_14px_-2px_oklch(var(--glow)/0.8)] indeterminate:shadow-[0_0_14px_-2px_oklch(var(--glow)/0.8)]',
                    'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
                )}
            />
            <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity duration-150 peer-checked:opacity-100 peer-indeterminate:hidden [&>path]:transition-[stroke-dashoffset] [&>path]:duration-300 [&>path]:ease-out [&>path]:[stroke-dasharray:16] [&>path]:[stroke-dashoffset:16] peer-checked:[&>path]:[stroke-dashoffset:0]"
            >
                <path d="m3.5 8.5 3 3 6-7" />
            </svg>
            <svg
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
                className="text-primary-foreground pointer-events-none absolute hidden size-3 peer-indeterminate:block"
            >
                <path d="M4 8h8" />
            </svg>
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
