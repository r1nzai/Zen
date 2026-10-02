import { cx } from '@zen/utils/cx';
import { createContext, ReactNode, useContext, useId } from 'react';

interface RadioGroupContextValue {
    name: string;
    value: string | null;
    onChange: (value: string) => void;
    disabled: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Choose one of a list: native radios underneath, so arrow keys move and pick
 * within the group, and forms work as usual. Fill it with Radio. For a few
 * short options side by side use Segmented; for options that show themselves,
 * RadioCards.
 */
export default function RadioGroup<V extends string>({
    label,
    value,
    onChange,
    name,
    disabled = false,
    orientation = 'vertical',
    className,
    children,
    ...aria
}: RadioGroupProps<V>) {
    const id = useId();
    return (
        <div className="zen__radio-group flex flex-col gap-2">
            {label && (
                <span id={id} className="text-sm font-medium">
                    {label}
                </span>
            )}
            <div
                role="radiogroup"
                aria-labelledby={label ? id : undefined}
                aria-orientation={orientation}
                aria-disabled={disabled || undefined}
                {...aria}
                className={cx(
                    'flex',
                    orientation === 'vertical' ? 'flex-col gap-2.5' : 'flex-wrap gap-x-5 gap-y-2',
                    className,
                )}
            >
                <RadioGroupContext.Provider
                    value={{ name: name ?? id, value, onChange: onChange as (value: string) => void, disabled }}
                >
                    {children}
                </RadioGroupContext.Provider>
            </div>
        </div>
    );
}

/** One option: a round radio that fills with a glowing dot when chosen, its label, and an optional description. */
export function Radio({ value, disabled, description, className, children }: RadioProps) {
    const group = useContext(RadioGroupContext);
    if (!group) throw new Error('<Radio> must be inside <RadioGroup>');
    return (
        <label
            className={cx(
                'inline-flex cursor-pointer items-start gap-2.5 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60',
                className,
            )}
        >
            <span className="relative mt-px inline-grid size-[1.125rem] shrink-0 place-items-center">
                <input
                    type="radio"
                    name={group.name}
                    value={value}
                    checked={group.value === value}
                    disabled={disabled || group.disabled}
                    onChange={() => group.onChange(value)}
                    className={cx(
                        'peer bg-tint/[0.04] m-0 size-full cursor-pointer appearance-none rounded-full border border-[color:oklch(var(--tint)/var(--zen-control-edge))] outline-hidden',
                        'transition-[border-color,box-shadow] duration-200',
                        'focus-visible:ring-ring/50 focus-visible:ring-2 hover:enabled:border-[color:oklch(var(--tint)/var(--zen-control-edge-hover))]',
                        'checked:border-primary checked:shadow-[0_0_14px_-3px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] disabled:cursor-not-allowed',
                    )}
                />
                <span
                    aria-hidden
                    className="zen__radio-dot bg-primary pointer-events-none absolute size-2 scale-0 rounded-full shadow-[0_0_8px_oklch(var(--glow)/calc(0.9*var(--glow-k)))] transition-transform duration-200 ease-[cubic-bezier(0.3,1.6,0.5,1)] peer-checked:scale-100"
                />
            </span>
            <span className="flex flex-col gap-0.5">
                {children}
                {description && <span className="text-muted-foreground text-xs">{description}</span>}
            </span>
        </label>
    );
}

export interface RadioGroupProps<V extends string> {
    /** Shown above the options, naming the group. Without it, give the group an aria-label. */
    label?: ReactNode;
    /** The chosen option, or null for none yet. */
    value: V | null;
    onChange: (value: V) => void;
    /** Form field name; defaults to a generated one. */
    name?: string;
    disabled?: boolean;
    /** Options in a column (default) or wrapping in a row. */
    orientation?: 'vertical' | 'horizontal';
    'aria-label'?: string;
    'aria-describedby'?: string;
    /** Classes for the options' container. */
    className?: string;
    /** The Radios. */
    children: ReactNode;
}

export interface RadioProps {
    value: string;
    /** Can't be chosen (and the arrow keys skip it). */
    disabled?: boolean;
    /** A muted line under the label. */
    description?: ReactNode;
    className?: string;
    /** The label. */
    children: ReactNode;
}
