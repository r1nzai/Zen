import { cx } from '@zen/utils/cx';
import { FIELD_WITHIN } from '@zen/utils/styles';
import { ComponentProps } from 'react';

/**
 * A field with slots: compose an InputGroupInput with InputGroupAddons before
 * or after it (a currency symbol, an icon, a unit, a button, a menu trigger).
 * The whole group looks like one field and glows while anything in it has
 * focus; clicking an addon's text focuses the input.
 */
export default function InputGroup({ invalid, className, onMouseDown, ...rest }: InputGroupProps) {
    return (
        <div
            data-invalid={invalid || undefined}
            className={cx(
                'zen__input-group cursor-text',
                FIELD_WITHIN,
                'has-disabled:bg-muted! has-disabled:text-muted-foreground has-disabled:cursor-not-allowed',
                invalid && 'border-destructive! focus-within:shadow-[0_0_0_3px_oklch(var(--destructive)/0.16)]!',
                className,
            )}
            onMouseDown={(e) => {
                onMouseDown?.(e);
                // Clicks on the shell or an addon's text focus the input; controls in addons keep theirs.
                const target = e.target as HTMLElement;
                if (e.defaultPrevented || target.closest('input, textarea, button, a, select, [tabindex]')) return;
                const input = e.currentTarget.querySelector<HTMLInputElement>('input:not(:disabled)');
                if (input) {
                    e.preventDefault();
                    input.focus();
                }
            }}
            {...rest}
        />
    );
}

/** The input inside an InputGroup: borderless, filling the space between the addons. */
export function InputGroupInput({ className, ...rest }: ComponentProps<'input'>) {
    return (
        <input
            className={cx(
                'placeholder:text-muted-foreground h-full w-full min-w-0 flex-1 bg-transparent text-sm outline-hidden disabled:cursor-not-allowed',
                className,
            )}
            {...rest}
        />
    );
}

/** Content before or after the input: text, an icon, a button or a menu trigger. */
export function InputGroupAddon({ className, ...rest }: ComponentProps<'span'>) {
    return (
        <span
            className={cx(
                'text-muted-foreground flex shrink-0 items-center gap-1 text-sm select-none [&_svg]:size-4',
                className,
            )}
            {...rest}
        />
    );
}

export interface InputGroupProps extends ComponentProps<'div'> {
    /** Show the field in its error state (e.g. alongside aria-invalid on the input). */
    invalid?: boolean;
}
