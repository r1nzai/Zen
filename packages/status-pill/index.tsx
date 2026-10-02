import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

const TONE = {
    default: 'border-tint/10 bg-tint/[0.05] text-muted-foreground',
    positive: 'border-primary/35 bg-primary/12 text-primary',
    negative: 'border-destructive/40 bg-destructive/10 text-destructive',
};

/**
 * A small rounded status that changes in place, e.g. an app's "Saving…",
 * "Saved", "Not saved · Retry": an icon (a Spinner, a Check) and a few words.
 * `quiet` fades it back once the news is old (a save a few seconds ago).
 * Changes are read out politely (role="status"). For an action inside it,
 * such as Retry, use StatusPillAction. For a fixed label or count, use Badge.
 */
export default function StatusPill({ tone = 'default', quiet = false, className, ...rest }: StatusPillProps) {
    return (
        <span
            role="status"
            {...rest}
            className={cx(
                'zen__status-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0',
                'transition-[color,background-color,border-color,opacity] duration-300',
                quiet ? 'text-muted-foreground border-transparent bg-transparent' : TONE[tone],
                className,
            )}
        />
    );
}

/** A text button inside a StatusPill, e.g. Retry, in the pill's colour. */
export function StatusPillAction({ className, type = 'button', ...rest }: ComponentProps<'button'>) {
    return (
        <button
            type={type}
            {...rest}
            className={cx(
                'ml-0.5 cursor-pointer rounded-full underline underline-offset-2 outline-hidden focus-visible:ring-2 focus-visible:ring-current/50',
                className,
            )}
        />
    );
}

export interface StatusPillProps extends ComponentProps<'span'> {
    /** `positive` in the accent colour (done), `negative` in red (failed); `default` is muted (in progress). */
    tone?: 'default' | 'positive' | 'negative';
    /** Faded back into the page: the news is old. */
    quiet?: boolean;
}
