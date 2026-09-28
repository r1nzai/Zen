import { cx } from './cx';

/** Small 16px status icons in the current text colour (toasts, field errors). */
export function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <path d="m3.5 8.5 3 3 6-7" />
        </svg>
    );
}

export function AlertIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <path d="M8 2.2 1.6 13.3h12.8L8 2.2Z" />
            <path d="M8 6.5v3M8 11.6v.1" />
        </svg>
    );
}

export function InfoIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={cx('size-3.5', className)}
            aria-hidden
        >
            <circle cx="8" cy="8" r="6.3" />
            <path d="M8 7.3v3.8M8 4.9v.1" />
        </svg>
    );
}
