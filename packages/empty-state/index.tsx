import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode } from 'react';

/**
 * What a list, table or page shows when there's nothing in it yet: an icon on
 * a soft glow, a title, a line on what to do, and the action that does it
 * (children, e.g. a Button).
 */
export default function EmptyState({ icon, title, description, className, children, ...rest }: EmptyStateProps) {
    return (
        <div
            className={cx('zen__empty-state flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
            {...rest}
        >
            {icon && (
                <div
                    aria-hidden
                    className="text-primary bg-primary/10 mb-1 grid size-12 place-items-center rounded-2xl shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25),0_0_32px_-6px_oklch(var(--glow)/calc(0.6*var(--glow-k)))] [&_svg]:size-6"
                >
                    {icon}
                </div>
            )}
            <p className="text-foreground mt-0! text-base font-semibold tracking-tight text-balance">{title}</p>
            {description && (
                <p className="text-muted-foreground mt-0! max-w-sm text-sm leading-6 text-balance">{description}</p>
            )}
            {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
        </div>
    );
}

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** An icon, shown on the accent's glow. */
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
}
