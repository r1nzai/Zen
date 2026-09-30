import { cx } from '@zen/utils/cx';
import { useIndicator } from '@zen/utils/indicator';
import { createContext, ReactNode, useContext, useId, useRef } from 'react';

interface SegmentedContextValue {
    name: string;
    value: string;
    onChange: (value: string) => void;
    /** Whether the sliding indicator is measured (until then, the checked option has its own background). */
    measured: boolean;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

/**
 * A small set of mutually exclusive options, shown as a pill row. Native radio
 * inputs underneath, so arrow keys and forms work as for any radio group. The
 * selection slides between options, like Pills. Fill it with
 * SegmentedItem (any content: text, icons, a disabled option).
 */
export default function Segmented<V extends string>({
    label,
    value,
    onChange,
    name,
    className,
    children,
}: SegmentedProps<V>) {
    const id = useId();
    const trackRef = useRef<HTMLDivElement>(null);
    // Where the checked option is, for the sliding indicator (null until measured:
    // before then, e.g. in server HTML, the checked option has its own background).
    // A radio's checked state isn't an attribute, so the value is a dependency.
    const box = useIndicator(trackRef, 'label:has(input:checked)', [value, children]);

    return (
        <div className={cx('zen__segmented flex flex-col gap-2', className)}>
            <span id={id} className="text-sm font-medium">
                {label}
            </span>
            <div
                ref={trackRef}
                role="radiogroup"
                aria-labelledby={id}
                className="glow-edge border-tint/10 bg-tint/[0.03] relative inline-flex w-fit flex-wrap gap-1 rounded-xl border p-1"
            >
                {box && (
                    <span
                        aria-hidden
                        className="bg-primary/15 absolute top-0 left-0 rounded-lg shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)] transition-[translate,width,height] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                        style={{ translate: `${box.x}px ${box.y}px`, width: box.w, height: box.h }}
                    />
                )}
                <SegmentedContext.Provider
                    value={{
                        name: name ?? id,
                        value,
                        onChange: onChange as (value: string) => void,
                        measured: box !== null,
                    }}
                >
                    {children}
                </SegmentedContext.Provider>
            </div>
        </div>
    );
}

/** One option of a Segmented: a native radio covering whatever you put inside. */
export function SegmentedItem({ value, disabled, className, children }: SegmentedItemProps) {
    const group = useContext(SegmentedContext);
    if (!group) throw new Error('SegmentedItem must be inside a Segmented');
    return (
        <label
            className={cx(
                'text-muted-foreground relative cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors duration-300',
                'hover:text-foreground has-checked:text-foreground has-focus-visible:ring-ring/50 has-focus-visible:ring-2',
                'has-disabled:hover:text-muted-foreground has-disabled:cursor-not-allowed has-disabled:opacity-50',
                !group.measured &&
                    'has-checked:bg-primary/15 has-checked:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)]',
                className,
            )}
        >
            <input
                type="radio"
                // The real radio covers its option, invisible: it's what gets clicked,
                // tapped and focused, so the pointer and assistive tech hit the same element.
                className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-[inherit] opacity-0 disabled:cursor-not-allowed"
                name={group.name}
                value={value}
                checked={group.value === value}
                disabled={disabled}
                onChange={() => group.onChange(value)}
            />
            {children}
        </label>
    );
}

export interface SegmentedProps<V extends string> {
    label: string;
    value: V;
    onChange: (value: V) => void;
    /** Form field name; defaults to a generated one. */
    name?: string;
    className?: string;
    /** The SegmentedItems. */
    children: ReactNode;
}

export interface SegmentedItemProps {
    value: string;
    /** Skipped by the arrow keys and can't be chosen. */
    disabled?: boolean;
    className?: string;
    /** What the option shows: text, an icon, both. */
    children: ReactNode;
}
