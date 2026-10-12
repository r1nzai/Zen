import { useFieldProps } from '@zen/field';
import Input from '@zen/input';
import Slider from '@zen/slider';
import { type Hsv, hexToHsv, hsvToHex } from '@zen/utils/color';
import { cx } from '@zen/utils/cx';
import { FormValue } from '@zen/utils/form-value';
import { useControllable } from '@zen/utils/useControllable';
import { FieldChevron } from '@zen/utils/field-chevron';
import { FIELD_SIZE, type FieldSize, POPUP, TRIGGER, TRIGGER_OPEN } from '@zen/utils/styles';
import { useAnchoredPopup } from '@zen/utils/useAnchoredPopup';
import { ComponentProps, KeyboardEvent, PointerEvent, useId, useState } from 'react';

const BLACK: Hsv = { h: 0, s: 0, v: 0, a: 1 };
const CHECKER = 'repeating-conic-gradient(#9ca3af 0 25%, #f3f4f6 0 50%) 0 0 / 8px 8px';
const HUES = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `hsl(${h} 100% 50%)`).join(', ')})`;
const pct = (x: number) => Math.round(x * 100);
const ARROWS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowDown: [0, -1],
    ArrowUp: [0, 1],
};

/** The value as this picker keeps it: lower-case, and opaque without `alpha`. */
function normalize(value: string, alpha: boolean) {
    const hsv = hexToHsv(value);
    return hsv ? hsvToHex(alpha ? hsv : { ...hsv, a: 1 }) : null;
}

/**
 * Everything ColorPicker opens: a saturation and brightness area, hue and
 * alpha sliders, the hex, and your swatches. Use it inline, or in a popup of
 * your own. Values are hex: "#rrggbb", or "#rrggbbaa" with `alpha`.
 */
export function ColorPanel({
    value: valueProp,
    defaultValue = '#000000',
    onValueChange,
    onValueCommit,
    alpha = false,
    swatches,
    className,
    ...rest
}: ColorPanelProps) {
    const [value, onChange] = useControllable(valueProp, defaultValue, onValueChange);
    const name = useId();
    // Kept as HSV, so the hue survives greys and black, where hex has none.
    const [hsv, setHsv] = useState(() => hexToHsv(value) ?? BLACK);
    const [seen, setSeen] = useState(value);
    if (value !== seen) {
        setSeen(value);
        const next = normalize(value, alpha);
        if (next && next !== hsvToHex(hsv)) setHsv(hexToHsv(next)!);
    }
    const hex = hsvToHex(hsv);
    const opaque = hsvToHex({ ...hsv, a: 1 });
    const [draft, setDraft] = useState<string | null>(null);

    const set = (patch: Partial<Hsv>) => {
        const next = { ...hsv, ...patch };
        if (!alpha) next.a = 1;
        setHsv(next);
        onChange(hsvToHex(next));
        return hsvToHex(next);
    };
    const commit = (to = hex) => onValueCommit?.(to);

    const pointAt = (e: PointerEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const s = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
        const v = 1 - Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
        return set({ s, v });
    };
    const onAreaKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const step = ARROWS[e.key];
        if (!step) return;
        e.preventDefault();
        const by = (e.shiftKey ? 10 : 1) / 100;
        const clampTo = (x: number) => Math.min(1, Math.max(0, Math.round((x + Number.EPSILON) * 100) / 100));
        commit(set({ s: clampTo(hsv.s + step[0] * by), v: clampTo(hsv.v + step[1] * by) }));
    };

    const applyDraft = () => {
        if (draft === null) return;
        const next = normalize(draft.startsWith('#') ? draft : `#${draft}`, alpha);
        setDraft(null);
        if (!next || next === hex) return;
        setHsv(hexToHsv(next)!);
        onChange(next);
        commit(next);
    };

    return (
        <div className={cx('zen__color-panel flex w-64 flex-col gap-3', className)} {...rest}>
            <div
                role="slider"
                tabIndex={0}
                aria-label="Saturation and brightness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct(hsv.s)}
                aria-valuetext={`Saturation ${pct(hsv.s)}%, brightness ${pct(hsv.v)}%`}
                onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    e.currentTarget.focus();
                    pointAt(e);
                }}
                onPointerMove={(e) => e.currentTarget.hasPointerCapture?.(e.pointerId) && pointAt(e)}
                onPointerUp={(e) => commit(pointAt(e))}
                onKeyDown={onAreaKey}
                style={{
                    background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
                }}
                className="focus-ring relative h-40 cursor-crosshair touch-none rounded-lg shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.1)] outline-hidden"
            >
                <span
                    aria-hidden
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: opaque }}
                    className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_0_12px_oklch(0_0_0/0.35)]"
                />
            </div>
            <Slider
                aria-label="Hue"
                min={0}
                max={359}
                value={Math.round(hsv.h)}
                onValueChange={(h) => set({ h })}
                onValueCommit={() => commit()}
                trackBackground={HUES}
                thumbColor={`hsl(${hsv.h} 100% 50%)`}
                valueText={(h) => `Hue ${h} degrees`}
            />
            {alpha && (
                <Slider
                    aria-label="Opacity"
                    min={0}
                    max={100}
                    value={pct(hsv.a)}
                    onValueChange={(a) => set({ a: a / 100 })}
                    onValueCommit={() => commit()}
                    trackBackground={`linear-gradient(to right, transparent, ${opaque}), ${CHECKER}`}
                    thumbColor={opaque}
                    valueText={(a) => `Opacity ${a}%`}
                />
            )}
            <Input
                aria-label="Hex"
                spellCheck={false}
                autoComplete="off"
                value={draft ?? hex}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={applyDraft}
                onKeyDown={(e) => e.key === 'Enter' && applyDraft()}
                className="h-9 font-mono tabular-nums"
            />
            {swatches && swatches.length > 0 && (
                <fieldset className="flex flex-wrap gap-1.5">
                    <legend className="sr-only">Swatches</legend>
                    {swatches.map((sw) => {
                        const swHex = normalize(sw.value, alpha);
                        return (
                            <label key={sw.value} title={sw.label} className="relative cursor-pointer">
                                <input
                                    type="radio"
                                    name={name}
                                    aria-label={sw.label}
                                    checked={swHex === hex}
                                    onChange={() => {
                                        if (!swHex) return;
                                        setHsv(hexToHsv(swHex)!);
                                        onChange(swHex);
                                        commit(swHex);
                                    }}
                                    className="peer sr-only"
                                />
                                <span
                                    aria-hidden
                                    style={{ background: `linear-gradient(${sw.value}, ${sw.value}), ${CHECKER}` }}
                                    className="ring-offset-background peer- peer-checked:ring-foreground/70 peer-focus-ring block size-6 rounded-full shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.12)] ring-offset-2 transition-shadow peer-checked:ring-2"
                                />
                            </label>
                        );
                    })}
                </fieldset>
            )}
        </div>
    );
}

/**
 * A field showing a colour and its hex that opens a ColorPanel: drag or use
 * the arrow keys in the area, slide the hue (and opacity, with `alpha`), type
 * a hex or pick a swatch. Works in a Field like any input.
 */
export default function ColorPicker({
    value: valueProp,
    defaultValue = '#000000',
    onValueChange,
    onValueCommit,
    alpha,
    swatches,
    name,
    size = 'default',
    id,
    disabled,
    className,
    style,
    ...rest
}: ColorPickerProps) {
    const [value, setValue, reset] = useControllable(valueProp, defaultValue, onValueChange);
    const popup = useAnchoredPopup<HTMLDivElement>();
    const field = useFieldProps({ ...rest, id });
    return (
        <>
            <button
                type="button"
                {...rest}
                {...field}
                id={id}
                disabled={disabled}
                {...popup.triggerProps}
                style={{ ...popup.triggerProps.style, ...style }}
                className={cx(
                    'zen__color-picker group',
                    TRIGGER,
                    FIELD_SIZE[size],
                    'w-full',
                    popup.open && TRIGGER_OPEN,
                    className,
                )}
            >
                <span className="flex min-w-0 items-center gap-2.5">
                    <span
                        aria-hidden
                        style={{ background: `linear-gradient(${value}, ${value}), ${CHECKER}` }}
                        className="size-5 shrink-0 rounded-md shadow-[inset_0_0_0_1px_oklch(var(--tint)/0.15)]"
                    />
                    <span className="truncate font-mono tabular-nums">{value}</span>
                </span>
                <FieldChevron open={popup.open} />
            </button>
            <FormValue name={name} value={value} onReset={reset} />
            <div
                {...popup.popupProps}
                role="dialog"
                aria-label="Choose colour"
                className={cx('zen__popover', POPUP, 'p-3')}
            >
                <ColorPanel
                    value={value}
                    onValueChange={setValue}
                    onValueCommit={onValueCommit}
                    alpha={alpha}
                    swatches={swatches}
                />
            </div>
        </>
    );
}

export interface ColorSwatch {
    label: string;
    /** Hex, like the picker's value. */
    value: string;
}

interface ColorValueProps {
    /** "#rrggbb", or "#rrggbbaa" with `alpha`, when you keep it. */
    value?: string;
    /** The first colour, when the picker keeps its own. Black by default. */
    defaultValue?: string;
    /** Every change, while dragging too. */
    onValueChange?: (value: string) => void;
    /** Once a change is made: let go of the area or a slider, a key, a hex entered, a swatch picked. */
    onValueCommit?: (value: string) => void;
    /** Offer opacity; values may then be "#rrggbbaa". */
    alpha?: boolean;
    /** Colours to pick in one press, such as your theme's. */
    swatches?: ColorSwatch[];
}

export interface ColorPanelProps extends ColorValueProps, Omit<ComponentProps<'div'>, 'defaultValue'> {}

export interface ColorPickerProps extends ColorValueProps, Omit<ComponentProps<'button'>, 'value' | 'defaultValue'> {
    /** Form field name: the hex is submitted with the form. */
    name?: string;
    /** Height, matching Button's: sm (32px), default (40px) or lg (44px). */
    size?: FieldSize;
}
