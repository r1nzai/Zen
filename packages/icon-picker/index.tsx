import Popover, { PopoverContent, PopoverTrigger } from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { CSSProperties, ReactNode, useId } from 'react';

/** The chart palette, so a category's colour matches it in charts. */
export const ICON_COLORS: IconColor[] = [
    { value: 'blue', label: 'Blue', color: 'var(--chart-1)' },
    { value: 'orange', label: 'Orange', color: 'var(--chart-2)' },
    { value: 'teal', label: 'Teal', color: 'var(--chart-3)' },
    { value: 'amber', label: 'Amber', color: 'var(--chart-4)' },
    { value: 'pink', label: 'Pink', color: 'var(--chart-5)' },
    { value: 'green', label: 'Green', color: 'var(--chart-6)' },
    { value: 'violet', label: 'Violet', color: 'var(--chart-7)' },
    { value: 'red', label: 'Red', color: 'var(--chart-8)' },
];

/**
 * Pick an icon and a colour for something, e.g. a spending category: a button
 * showing the choice opens a grid of icons and a row of colours. Icons are
 * yours (emoji work); colours default to the chart palette. Both are radio
 * groups, so arrow keys move through them.
 */
export default function IconPicker({
    icons,
    colors = ICON_COLORS,
    value,
    onChange,
    label,
    className,
}: IconPickerProps) {
    const name = useId();
    const icon = icons.find((i) => i.value === value.icon);
    const color = colors.find((c) => c.value === value.color);
    const tint = (c: string | undefined) => ({ '--icon-color': c ?? 'var(--color-muted-foreground)' }) as CSSProperties;
    return (
        <Popover>
            <PopoverTrigger
                aria-label={`${label}: ${[icon?.label, color?.label].filter(Boolean).join(', ') || 'none'}`}
                style={tint(color?.color)}
                className={cx(
                    'zen__icon-picker focus-visible:ring-ring/50 grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--icon-color)_18%,transparent)] text-lg text-(--icon-color) outline-hidden transition-colors focus-visible:ring-2',
                    className,
                )}
            >
                {icon?.icon}
            </PopoverTrigger>
            <PopoverContent aria-label={label} className="flex w-72 flex-col gap-3 p-3">
                <fieldset className="flex flex-wrap gap-1.5">
                    <legend className="text-muted-foreground mb-1.5 text-xs">Colour</legend>
                    {colors.map((c) => (
                        <label key={c.value} title={c.label} className="relative cursor-pointer">
                            <input
                                type="radio"
                                name={`${name}-color`}
                                aria-label={c.label}
                                checked={value.color === c.value}
                                onChange={() => onChange({ ...value, color: c.value })}
                                className="peer sr-only"
                            />
                            <span
                                aria-hidden
                                style={{ background: c.color }}
                                className="ring-offset-background peer-focus-visible:ring-ring/60 peer-checked:ring-foreground/70 block size-6 rounded-full ring-offset-2 transition-shadow peer-checked:ring-2 peer-focus-visible:ring-2"
                            />
                        </label>
                    ))}
                </fieldset>
                <fieldset className="grid grid-cols-6 gap-1" style={tint(color?.color)}>
                    <legend className="text-muted-foreground mb-1.5 text-xs">Icon</legend>
                    {icons.map((i) => (
                        <label key={i.value} title={i.label} className="cursor-pointer">
                            <input
                                type="radio"
                                name={`${name}-icon`}
                                aria-label={i.label}
                                checked={value.icon === i.value}
                                onChange={() => onChange({ ...value, icon: i.value })}
                                className="peer sr-only"
                            />
                            <span
                                aria-hidden
                                className="hover:bg-tint/[0.07] peer-focus-visible:ring-ring/50 grid size-10 place-items-center rounded-lg text-lg transition-colors peer-checked:bg-[color-mix(in_oklch,var(--icon-color)_22%,transparent)] peer-checked:text-(--icon-color) peer-focus-visible:ring-2"
                            >
                                {i.icon}
                            </span>
                        </label>
                    ))}
                </fieldset>
            </PopoverContent>
        </Popover>
    );
}

export interface IconColor {
    /** What's stored, e.g. "blue". */
    value: string;
    label: string;
    /** Any CSS colour. */
    color: string;
}

export interface IconPickerProps {
    icons: { value: string; label: string; icon: ReactNode }[];
    /** Default: ICON_COLORS, the chart palette. */
    colors?: IconColor[];
    value: { icon: string; color?: string };
    onChange: (value: { icon: string; color?: string }) => void;
    /** What it's the icon of, e.g. "Category icon"; the button also says the current choice. */
    label: string;
    className?: string;
}
