import { cx } from '@zen/utils/cx';
import { useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * A small set of mutually exclusive options, shown as a pill row. Native radio
 * inputs underneath, so arrow keys and forms work as for any radio group. The
 * selection slides between options, like NavPills.
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
    const trackRef = useRef<HTMLDivElement>(null);
    // Where the checked option is, for the sliding indicator (null until measured:
    // before then, e.g. in server HTML, the checked option has its own background).
    const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    useLayoutEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const measure = () => {
            const checked = track.querySelector<HTMLElement>('label:has(input:checked)');
            setBox(
                checked
                    ? { x: checked.offsetLeft, y: checked.offsetTop, w: checked.offsetWidth, h: checked.offsetHeight }
                    : null,
            );
        };
        measure();
        // Labels change width as fonts load, and the row can wrap when it resizes.
        const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        resizes?.observe(track);
        return () => resizes?.disconnect();
    }, [value, options]);

    return (
        <div className={cx('zen__segmented flex flex-col gap-2', className)}>
            <span id={id} className="text-sm font-medium">
                {label}
            </span>
            <div
                ref={trackRef}
                role="radiogroup"
                aria-labelledby={id}
                className="border-tint/10 bg-tint/[0.03] relative inline-flex w-fit flex-wrap gap-1 rounded-xl border p-1"
            >
                {box && (
                    <span
                        aria-hidden
                        className="bg-primary/15 absolute top-0 left-0 rounded-lg shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)] transition-[translate,width,height] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                        style={{ translate: `${box.x}px ${box.y}px`, width: box.w, height: box.h }}
                    />
                )}
                {options.map((o) => (
                    <label
                        key={o.value}
                        className={cx(
                            'text-muted-foreground relative cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors duration-300',
                            'hover:text-foreground has-checked:text-foreground has-focus-visible:ring-ring/50 has-focus-visible:ring-2',
                            !box &&
                                'has-checked:bg-primary/15 has-checked:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.4)]',
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
