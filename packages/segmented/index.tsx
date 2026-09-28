import { cx } from '@zen/utils/cx';
import { useId } from 'react';

/**
 * A small set of mutually exclusive options, shown as a pill row. Native radio
 * inputs underneath, so arrow keys and forms work as for any radio group.
 */
export default function Segmented<V extends string>({
    label,
    value,
    options,
    onChange,
    name,
    className,
}: SegmentedProps<V>) {
    const id = useId();
    return (
        <div className={cx('zen__segmented flex flex-col gap-2', className)}>
            <span id={id} className="text-sm font-medium">
                {label}
            </span>
            <div
                role="radiogroup"
                aria-labelledby={id}
                className="border-tint/10 bg-tint/[0.03] inline-flex w-fit flex-wrap gap-1 rounded-xl border p-1"
            >
                {options.map((o) => (
                    <label
                        key={o.value}
                        className={cx(
                            'text-muted-foreground cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-[background-color,color,box-shadow] duration-200',
                            'hover:text-foreground has-focus-visible:ring-ring/50 has-focus-visible:ring-2',
                            'has-checked:bg-primary/15 has-checked:text-foreground has-checked:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)]',
                        )}
                    >
                        <input
                            type="radio"
                            className="sr-only"
                            name={name ?? id}
                            value={o.value}
                            checked={value === o.value}
                            onChange={() => onChange(o.value)}
                        />
                        {o.label}
                    </label>
                ))}
            </div>
        </div>
    );
}

export interface SegmentedProps<V extends string> {
    label: string;
    value: V;
    options: readonly { value: V; label: string }[];
    onChange: (value: V) => void;
    /** Form field name; defaults to a generated one. */
    name?: string;
    className?: string;
}
