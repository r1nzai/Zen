import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * Small circular spinner in the current text colour; size it with className
 * (default size-4). Decorative by default (e.g. inside a loading Button). Give
 * it a `label` when it stands on its own, and screen readers announce it.
 */
export default function Spinner({ label, className, ...rest }: SpinnerProps) {
    return (
        <span
            role={label ? 'status' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            {...rest}
            className={cx(
                'zen__spinner inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
                className,
            )}
        />
    );
}

/** Other props (data-*, a style) go on the spinner. */
export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
    /** What is loading, e.g. "Loading entries". Makes the spinner announce itself. */
    label?: string;
}
