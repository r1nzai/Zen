import Popover, { PopoverContent, PopoverTrigger, type PopoverTriggerProps } from '@zen/popover';
import { cx } from '@zen/utils/cx';
import { useMessages } from '@zen/locale-provider';
import { useControllable } from '@zen/utils/useControllable';
import { CSSProperties, ReactNode, useId } from 'react';

/** The chart palette, so a category's colour matches it in charts. */
export const ICON_COLORS: IconColor[] = [
    { value: 'blue', color: 'var(--chart-1)' },
    { value: 'orange', color: 'var(--chart-2)' },
    { value: 'teal', color: 'var(--chart-3)' },
    { value: 'amber', color: 'var(--chart-4)' },
    { value: 'pink', color: 'var(--chart-5)' },
    { value: 'green', color: 'var(--chart-6)' },
    { value: 'violet', color: 'var(--chart-7)' },
    { value: 'red', color: 'var(--chart-8)' },
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
    value: valueProp,
    defaultValue = { icon: '' },
    onValueChange,
    label,
    name: nameProp,
    className,
    ...rest
}: IconPickerProps) {
    const [value, onChange] = useControllable(valueProp, defaultValue, onValueChange);
    const m = useMessages();
    const colourName = (c: IconColor) => c.label ?? m.colourNames[c.value as keyof typeof m.colourNames] ?? c.value;
    const id = useId();
    const name = nameProp ?? id;
    const icon = icons.find((i) => i.value === value.icon);
    const color = colors.find((c) => c.value === value.color);
    const tint = (c: string | undefined) => ({ '--icon-color': c ?? 'var(--color-muted-foreground)' }) as CSSProperties;
    return (
        <Popover>
            <PopoverTrigger
                {...rest}
                aria-label={`${label}: ${[icon?.label, color && colourName(color)].filter(Boolean).join(', ') || m.none}`}
                style={tint(color?.color)}
                className={cx(
                    'zen__icon-picker grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--icon-color)_18%,transparent)] text-lg text-(--icon-color) outline-hidden transition-colors focus-ring',
                    className,
                )}
            >
                {icon?.icon}
            </PopoverTrigger>
            <PopoverContent aria-label={label} className="flex w-72 flex-col gap-3 p-3">
                {colors.length > 0 && (
                    <fieldset className="flex flex-wrap gap-1.5">
                        <legend className="text-muted-foreground mb-1.5 text-xs">{m.colour}</legend>
                        {colors.map((c) => (
                            <label key={c.value} title={colourName(c)} className="relative cursor-pointer">
                                <input
                                    type="radio"
                                    name={`${name}-color`}
                                    aria-label={colourName(c)}
                                    checked={value.color === c.value}
                                    onChange={() => onChange({ ...value, color: c.value })}
                                    className="peer sr-only"
                                />
                                <span
                                    aria-hidden
                                    style={{ background: c.color }}
                                    className="ring-offset-background peer- peer-checked:ring-foreground/70 peer-focus-ring block size-6 rounded-full ring-offset-2 transition-shadow peer-checked:ring-2"
                                />
                            </label>
                        ))}
                    </fieldset>
                )}
                <fieldset className="grid grid-cols-6 gap-1" style={tint(color?.color)}>
                    <legend className="text-muted-foreground mb-1.5 text-xs">{m.icon}</legend>
                    {icons.map((i) => (
                        <label key={i.value} title={i.label} className="cursor-pointer">
                            <input
                                type="radio"
                                name={name}
                                aria-label={i.label}
                                checked={value.icon === i.value}
                                onChange={() => onChange({ ...value, icon: i.value })}
                                className="peer sr-only"
                            />
                            <span
                                aria-hidden
                                className="hover:bg-tint/[0.07] peer- peer-focus-ring grid size-10 place-items-center rounded-lg text-lg transition-colors peer-checked:bg-[color-mix(in_oklch,var(--icon-color)_22%,transparent)] peer-checked:text-(--icon-color)"
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
    /** Defaults to the LocaleProvider's name for the chart colours ("Blue"…), else the value. */
    label?: string;
    /** Any CSS colour. */
    color: string;
}

/** Other props (aria-*, data-*, an id) go on the button. */
export interface IconPickerProps extends Omit<PopoverTriggerProps, 'value' | 'defaultValue' | 'children'> {
    icons: { value: string; label: string; icon: ReactNode }[];
    /** Default: ICON_COLORS, the chart palette. */
    colors?: IconColor[];
    /** The choice, when you keep it. */
    value?: { icon: string; color?: string };
    /** The first choice, when the picker keeps its own. */
    defaultValue?: { icon: string; color?: string };
    onValueChange?: (value: { icon: string; color?: string }) => void;
    /** Form field name: the icon is submitted under it, the colour under `${name}-color`. */
    name?: string;
    /** What it's the icon of, e.g. "Category icon"; the button also says the current choice. */
    label: string;
    className?: string;
}
