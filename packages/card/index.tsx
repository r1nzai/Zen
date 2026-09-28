import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode } from 'react';

/** Glass panel whose border catches the pointer light. */
export default function Card({ title, action, children, className, ...rest }: CardProps) {
    return (
        <section
            className={cx('zen__card glass glow-edge text-card-foreground rounded-xl p-4 md:p-5', className)}
            {...rest}
        >
            {(title || action) && (
                <header className="mb-4 flex items-center justify-between gap-4">
                    {title && <h4 className="text-base tracking-tight">{title}</h4>}
                    {action}
                </header>
            )}
            {children}
        </section>
    );
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

export interface CardProps extends Omit<ComponentProps<'section'>, 'title'> {
    title?: ReactNode;
    /** Shown at the end of the header, e.g. a button or menu. */
    action?: ReactNode;
}

export interface StatProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: 'default' | 'positive' | 'negative';
    className?: string;
}
