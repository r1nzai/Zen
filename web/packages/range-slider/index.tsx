import { useMessages } from '@zen/locale-provider';
import { SLIDER_SIZES, THUMB } from '@zen/slider';
import { cx } from '@zen/utils/cx';
import { useFormReset } from '@zen/utils/form-value';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps, CSSProperties, useRef } from 'react';

/**
 * Two thumbs on one track, for a span such as an amount from $50 to $500:
 * two native range inputs (keyboard, forms and screen readers work as on
 * Slider), the span between them filled. The thumbs can meet but not cross.
 */
export default function RangeSlider({
    value: valueProp,
    defaultValue,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    onValueCommit,
    label,
    thumbLabels: thumbLabelsProp,
    valueText,
    size = 'md',
    name,
    disabled,
    className,
    style,
    ...rest
}: RangeSliderProps) {
    const m = useMessages();
    const thumbLabels = thumbLabelsProp ?? [m.minimum, m.maximum];
    const [[low, high], setValue, reset] = useControllable<readonly [number, number], [number, number]>(
        valueProp,
        defaultValue ?? [min, max],
        onValueChange,
    );
    const first = useRef<HTMLInputElement>(null);
    useFormReset(first, reset);
    const at = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
    const thumbs = [
        { value: low, set: (v: number) => [Math.min(v, high), high] as const },
        { value: high, set: (v: number) => [low, Math.max(v, low)] as const },
    ];
    return (
        <div
            role="group"
            aria-label={label}
            {...rest}
            className={cx('zen__range-slider relative h-5 w-full', disabled && 'opacity-50', className)}
            style={{ '--zen-thumb': 'oklch(var(--primary))', ...style } as CSSProperties}
        >
            <div
                aria-hidden
                className={cx(
                    'absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full [--zen-end:right] rtl:[--zen-end:left]',
                    size === 'sm' ? 'h-1' : 'h-2.5',
                )}
                style={{
                    background: `linear-gradient(to var(--zen-end), oklch(var(--muted)) ${at(low)}%, oklch(var(--primary)) ${at(low)}% ${at(high)}%, oklch(var(--muted)) ${at(high)}%)`,
                }}
            />
            {thumbs.map((thumb, i) => (
                <input
                    key={i}
                    ref={i === 0 ? first : undefined}
                    type="range"
                    name={name}
                    min={min}
                    max={max}
                    step={step}
                    value={thumb.value}
                    disabled={disabled}
                    aria-label={thumbLabels[i]}
                    aria-valuetext={valueText?.(thumb.value)}
                    onChange={(e) => {
                        const [a, b] = thumb.set(Number(e.target.value));
                        setValue([a, b]);
                    }}
                    onPointerUp={() => onValueCommit?.([low, high])}
                    onKeyUp={() => onValueCommit?.([low, high])}
                    // Both thumbs at the top end: the low one goes on top, or it couldn't be moved back.
                    style={{ zIndex: i === 0 && low > (min + max) / 2 ? 2 : 1 }}
                    className={cx(
                        'pointer-events-none absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent outline-hidden disabled:cursor-not-allowed',
                        '[&::-moz-range-track]:bg-transparent',
                        '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto',
                        THUMB,
                        SLIDER_SIZES[size],
                    )}
                />
            ))}
        </div>
    );
}

/** Other props (aria-*, data-*, an id) go on the group around the thumbs. */
export interface RangeSliderProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'children'> {
    /** The span, low then high, when you keep it. */
    value?: readonly [number, number];
    /** The first span, when the slider keeps its own (default the whole range). */
    defaultValue?: readonly [number, number];
    /** Form field name: low and high are submitted under it, in that order. */
    name?: string;
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
    /** `'sm'`: a thin track and small thumbs, as on Slider. */
    size?: 'md' | 'sm';
    disabled?: boolean;
    className?: string;
}
