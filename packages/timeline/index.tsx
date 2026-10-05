import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode } from 'react';

/** Events in order, each on a dot joined by a line: an activity feed, a history. */
export default function Timeline({ className, ...rest }: ComponentProps<'ol'>) {
    return <ol className={cx('zen__timeline flex flex-col', className)} {...rest} />;
}

/**
 * One event: its title, when (`time`), and anything more as children. `icon`
 * replaces the dot; `active` lights it in the accent, e.g. what's happening now.
 */
export function TimelineItem({ title, time, icon, active, className, children, ...rest }: TimelineItemProps) {
    return (
        <li className={cx('group/timeline relative flex gap-3 pb-6 last:pb-0', className)} {...rest}>
            {/* The line on to the next event. */}
            <span
                aria-hidden
                className="bg-tint/10 absolute top-7 bottom-1 left-[11px] w-px group-last/timeline:hidden"
            />
            <span
                aria-hidden
                className={cx(
                    'relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3.5',
                    icon
                        ? 'bg-tint/[0.06] text-muted-foreground shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.1)]'
                        : 'after:bg-tint/30 after:size-2 after:rounded-full',
                    active &&
                        'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.35),0_0_16px_-2px_oklch(var(--glow)/calc(0.7*var(--glow-k)))] after:bg-primary',
                )}
            >
                {icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-foreground text-sm font-medium">{title}</span>
                    {time && <span className="text-muted-foreground text-xs tabular-nums">{time}</span>}
                </div>
                {children && <div className="text-muted-foreground text-sm leading-6">{children}</div>}
            </div>
        </li>
    );
}

export interface TimelineItemProps extends Omit<ComponentProps<'li'>, 'title'> {
    title: ReactNode;
    /** When it happened, e.g. a <time> or "2 hours ago". */
    time?: ReactNode;
    /** An icon in place of the dot. */
    icon?: ReactNode;
    /** Lit in the accent: the current or latest event. */
    active?: boolean;
}
