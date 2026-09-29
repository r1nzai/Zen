import { cx } from '@zen/utils/cx';

/**
 * Small circular spinner in the current text colour; size it with className
 * (default size-4). Decorative by default (e.g. inside a loading Button). Give
 * it a `label` when it stands on its own, and screen readers announce it.
 */
export default function Spinner({ label, className }: SpinnerProps) {
    return (
        <span
            role={label ? 'status' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cx(
                'zen__spinner inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
                className,
            )}
        />
    );
}

export interface SpinnerProps {
    /** What is loading, e.g. "Loading entries". Makes the spinner announce itself. */
    label?: string;
    className?: string;
}
