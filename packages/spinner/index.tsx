import { cx } from '@zen/utils/cx';

/** Small circular spinner in the current text colour. */
export default function Spinner({ className }: SpinnerProps) {
    return (
        <span
            aria-hidden
            className={cx(
                'zen__spinner inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
                className,
            )}
        />
    );
}

export interface SpinnerProps {
    className?: string;
}
