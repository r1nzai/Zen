import { cx } from '@zen/utils/cx';
import { ComponentProps, CSSProperties, useEffect, useRef } from 'react';

/**
 * A range slider on the native <input type="range"> (keyboard, forms and
 * screen readers work as usual): a rounded track, filled up to the value in
 * the accent unless you give it your own `trackBackground` (e.g. a hue
 * gradient), and a glowing thumb.
 */
export default function Slider({
    value,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    onValueCommit,
    trackBackground,
    thumbColor,
    valueText,
    className,
    style,
    ...rest
}: SliderProps) {
    const ref = useRef<HTMLInputElement>(null);
    // The native change event fires once the user lets go (pointer up, key up).
    const commit = useRef(onValueCommit);
    commit.current = onValueCommit;
    useEffect(() => {
        const input = ref.current;
        if (!input) return;
        const onChange = () => commit.current?.(Number(input.value));
        input.addEventListener('change', onChange);
        return () => input.removeEventListener('change', onChange);
    }, []);

    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const track =
        trackBackground ?? `linear-gradient(to right, oklch(var(--primary)) ${pct}%, oklch(var(--muted)) ${pct}%)`;

    return (
        <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-valuetext={valueText?.(value)}
            onChange={(e) => onValueChange?.(Number(e.target.value))}
            style={
                {
                    ...style,
                    '--zen-track': track,
                    '--zen-thumb': thumbColor ?? 'oklch(var(--primary))',
                } as CSSProperties
            }
            className={cx(
                'zen__slider h-5 w-full cursor-pointer appearance-none bg-transparent outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
                // Track
                '[&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:var(--zen-track)]',
                '[&::-moz-range-track]:h-2.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:[background:var(--zen-track)]',
                // Thumb
                '[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_0_16px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] [&::-webkit-slider-thumb]:[background:var(--zen-thumb)]',
                '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_0_16px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] [&::-moz-range-thumb]:[background:var(--zen-thumb)]',
                // Focus ring on the thumb
                'focus-visible:[&::-webkit-slider-thumb]:ring-ring/40 focus-visible:[&::-webkit-slider-thumb]:ring-4',
                'focus-visible:[&::-moz-range-thumb]:ring-ring/40 focus-visible:[&::-moz-range-thumb]:ring-4',
                className,
            )}
            {...rest}
        />
    );
}

export interface SliderProps extends Omit<
    ComponentProps<'input'>,
    'type' | 'value' | 'min' | 'max' | 'step' | 'onChange' | 'defaultValue'
> {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    /** While dragging (every step). */
    onValueChange?: (value: number) => void;
    /** Once the user lets go: the moment to save. */
    onValueCommit?: (value: number) => void;
    /** CSS background for the track, e.g. a gradient of hues. */
    trackBackground?: string;
    /** CSS colour for the thumb (default: the accent). */
    thumbColor?: string;
    /** Spoken value, e.g. (v) => `Hue ${v} degrees`. */
    valueText?: (value: number) => string;
}
