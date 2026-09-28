import { cx } from './cx';

/** Chevron for popup fields (select, month picker): turns over while the popup is open. */
export function FieldChevron({ open, className }: { open?: boolean; className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={cx(
                'text-muted-foreground size-4 shrink-0 transition-transform duration-300',
                open && 'rotate-180',
                className,
            )}
        >
            <path d="m4 6 4 4 4-4" />
        </svg>
    );
}
