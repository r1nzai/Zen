import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { ComponentProps, ReactNode } from 'react';

/**
 * Glass panel whose border catches the pointer light. For a title with an
 * action beside it, start it with a CardHeader holding a CardTitle and the action.
 */
export default function Card({ className, ...rest }: CardProps) {
    return (
        <section
            className={cx('zen__card glass glow-edge text-card-foreground rounded-xl p-4 md:p-5', className)}
            {...rest}
        />
    );
}

/** The top row of a Card: its title, and an action (a button, a menu) at the end. */
export function CardHeader({ className, ...rest }: ComponentProps<'header'>) {
    return <header className={cx('mb-4 flex items-center justify-between gap-4', className)} {...rest} />;
}

/** The card's title: an h4 by default; with `asChild`, your own heading (an h2, say) gets its look. */
export function CardTitle({ asChild, className, children, ...rest }: CardTitleProps) {
    const props = { ...rest, className: cx('text-base font-semibold tracking-tight', className) };
    if (asChild) return <Slot {...(props as ComponentProps<'a'>)}>{children}</Slot>;
    return <h4 {...props}>{children}</h4>;
}

/** A single figure with a label, e.g. "Revenue  $12,400". */
export function Stat({ label, value, hint, tone = 'default', className }: StatProps) {
    return (
        <div className={cx('zen__stat glass glow-edge flex flex-col gap-1 rounded-xl p-3.5 md:p-4', className)}>
            <span className="text-muted-foreground truncate text-[0.68rem] tracking-[0.1em] uppercase sm:text-xs">
                {label}
            </span>
            <span
                className={cx(
                    'truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl md:text-2xl',
                    tone === 'positive' && 'text-primary text-glow',
                    tone === 'negative' && 'text-destructive',
                )}
            >
                {value}
            </span>
            {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
        </div>
    );
}

/** Row of stats: two columns on phones (an odd last one spans both), three from `sm` up. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cx(
                'grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 [&>*]:min-w-0',
                '[&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1',
                className,
            )}
        >
            {children}
        </div>
    );
}

export type CardProps = ComponentProps<'section'>;

export interface CardTitleProps extends ComponentProps<'h4'> {
    /** Put the title's look on your own heading element instead of an h4. */
    asChild?: boolean;
}

export interface StatProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: 'default' | 'positive' | 'negative';
    className?: string;
}
