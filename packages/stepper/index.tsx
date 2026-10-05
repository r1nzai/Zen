import Check from '@zen/icons/micro/check';
import { cx } from '@zen/utils/cx';
import { Children, ComponentProps, isValidElement, ReactNode } from 'react';

/**
 * The steps of a flow (sign-up, checkout, import), with where you are: steps
 * before `value` (from 0) are done, the one at it is current. The line between
 * them fills in as you go.
 */
export default function Stepper({
    value,
    className,
    children,
    'aria-label': label = 'Progress',
    ...rest
}: StepperProps) {
    const steps = Children.toArray(children).filter(isValidElement);
    return (
        <ol aria-label={label} className={cx('zen__stepper flex w-full items-start', className)} {...rest}>
            {steps.map((step, i) => {
                const state = i < value ? 'done' : i === value ? 'current' : 'upcoming';
                return (
                    <li
                        key={step.key ?? i}
                        data-state={state}
                        aria-current={state === 'current' ? 'step' : undefined}
                        className="group/step relative flex flex-1 flex-col items-center gap-2 text-center"
                    >
                        {i > 0 && (
                            <span
                                aria-hidden
                                className="bg-tint/10 absolute top-3.5 right-[calc(50%+1.25rem)] left-[calc(-50%+1.25rem)] h-px overflow-hidden"
                            >
                                <span
                                    className={cx(
                                        'bg-primary ease-out-soft block h-full origin-left transition-transform duration-500',
                                        state === 'upcoming' && 'scale-x-0',
                                    )}
                                />
                            </span>
                        )}
                        <span
                            aria-hidden
                            className={cx(
                                'grid size-7 place-items-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300',
                                state === 'upcoming' &&
                                    'bg-tint/[0.05] text-muted-foreground shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.12)]',
                                state === 'current' &&
                                    'bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.5),0_0_18px_-2px_oklch(var(--glow)/calc(0.7*var(--glow-k)))]',
                                state === 'done' && 'bg-primary text-primary-foreground',
                            )}
                        >
                            {state === 'done' ? <Check className="size-3.5" /> : i + 1}
                        </span>
                        {step}
                        <span className="sr-only">
                            {state === 'done' ? ', done' : state === 'upcoming' ? ', not started' : ''}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

/** One step's label, and optionally a line under it (`description`). */
export function Step({ description, className, children }: StepProps) {
    return (
        <span className={cx('flex flex-col gap-0.5 px-1', className)}>
            <span className="text-muted-foreground group-data-[state=current]/step:text-foreground group-data-[state=done]/step:text-foreground text-sm font-medium">
                {children}
            </span>
            {description && <span className="text-muted-foreground text-xs max-sm:hidden">{description}</span>}
        </span>
    );
}

export interface StepperProps extends ComponentProps<'ol'> {
    /** The current step, from 0. Steps before it are done; past the last, all are. */
    value: number;
}

export interface StepProps {
    children: ReactNode;
    description?: ReactNode;
    className?: string;
}
