import { THUMB } from '@zen/slider';
import { cx } from '@zen/utils/cx';
import { CSSProperties } from 'react';

/**
 * Two thumbs on one track, for a span such as an amount from $50 to $500:
 * two native range inputs (keyboard, forms and screen readers work as on
 * Slider), the span between them filled. The thumbs can meet but not cross.
 */
export default function RangeSlider({
    value: [low, high],
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    onValueCommit,
    label,
    thumbLabels = ['Minimum', 'Maximum'],
    valueText,
    disabled,
    className,
}: RangeSliderProps) {
    const at = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
    const thumbs = [
        { value: low, set: (v: number) => [Math.min(v, high), high] as const },
        { value: high, set: (v: number) => [low, Math.max(v, low)] as const },
    ];
    return (
        <div
            role="group"
            aria-label={label}
            className={cx('zen__range-slider relative h-5 w-full', disabled && 'opacity-50', className)}
            style={{ '--zen-thumb': 'oklch(var(--primary))' } as CSSProperties}
        >
            <div
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full"
                style={{
                    background: `linear-gradient(to right, oklch(var(--muted)) ${at(low)}%, oklch(var(--primary)) ${at(low)}% ${at(high)}%, oklch(var(--muted)) ${at(high)}%)`,
                }}
            />
            {thumbs.map((thumb, i) => (
                <input
                    key={i}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={thumb.value}
                    disabled={disabled}
                    aria-label={thumbLabels[i]}
                    aria-valuetext={valueText?.(thumb.value)}
                    onChange={(e) => {
                        const [a, b] = thumb.set(Number(e.target.value));
                        onValueChange?.([a, b]);
                    }}
                    onPointerUp={() => onValueCommit?.([low, high])}
                    onKeyUp={() => onValueCommit?.([low, high])}
                    // Both thumbs at the top end: the low one goes on top, or it couldn't be moved back.
                    style={{ zIndex: i === 0 && low > (min + max) / 2 ? 2 : 1 }}
                    className={cx(
                        'pointer-events-none absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent outline-hidden disabled:cursor-not-allowed',
                        '[&::-webkit-slider-runnable-track]:h-2.5 [&::-moz-range-track]:h-2.5 [&::-moz-range-track]:bg-transparent',
                        '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto',
                        THUMB,
                    )}
                />
            ))}
        </div>
    );
}

export interface RangeSliderProps {
    /** The span, low then high. */
    value: readonly [number, number];
    min?: number;
    max?: number;
    step?: number;
    /** While dragging (every step). */
    onValueChange?: (value: [number, number]) => void;
    /** Once the user lets go: the moment to save or filter. */
    onValueCommit?: (value: [number, number]) => void;
    /** Accessible name of the pair, e.g. "Amount". */
    label: string;
    /** Each thumb's name (default "Minimum", "Maximum"). */
    thumbLabels?: readonly [string, string];
    /** Spoken value of a thumb, e.g. (v) => `$${v}`. */
    valueText?: (value: number) => string;
    disabled?: boolean;
    className?: string;
}
