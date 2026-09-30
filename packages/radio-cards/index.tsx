import { cx } from '@zen/utils/cx';
import { createContext, CSSProperties, ReactNode, useContext, useId } from 'react';

interface RadioCardsContextValue {
    name: string;
    value: string;
    onChange: (value: string) => void;
}

const RadioCardsContext = createContext<RadioCardsContextValue | null>(null);

/**
 * A choice of one among a few cards, each showing what it picks (a palette, a
 * plan). Native radio inputs underneath, so arrow keys and forms work as for any
 * radio group. Lay the cards out with className (e.g. a grid); fill it with
 * RadioCard. For short text options, use Segmented.
 */
export default function RadioCards<V extends string>({
    label,
    value,
    onChange,
    name,
    className,
    children,
}: RadioCardsProps<V>) {
    const id = useId();
    return (
        <div className="zen__radio-cards flex flex-col gap-2">
            <span id={id} className="text-sm font-medium">
                {label}
            </span>
            <div role="radiogroup" aria-labelledby={id} className={className}>
                <RadioCardsContext.Provider
                    value={{ name: name ?? id, value, onChange: onChange as (value: string) => void }}
                >
                    {children}
                </RadioCardsContext.Provider>
            </div>
        </div>
    );
}

/**
 * One card: a native radio covering whatever you put inside, so the whole card
 * is the click target. Outlined, lit when chosen; style it further with
 * className and style (e.g. a background showing the choice).
 */
export function RadioCard({ value, disabled, className, style, children }: RadioCardProps) {
    const group = useContext(RadioCardsContext);
    if (!group) throw new Error('<RadioCard> must be inside <RadioCards>');
    return (
        <label
            style={style}
            className={cx(
                'zen__radio-card border-tint/10 relative flex items-center gap-3 rounded-xl border p-2.5 text-left text-sm transition-[border-color,box-shadow] duration-200',
                'hover:has-enabled:border-tint/20 has-checked:border-primary/60 has-checked:shadow-[0_0_0_3px_oklch(var(--primary)/0.15)]',
                'has-focus-visible:ring-ring/50 has-focus-visible:ring-2 has-disabled:opacity-60',
                className,
            )}
        >
            <input
                type="radio"
                name={group.name}
                value={value}
                checked={group.value === value}
                disabled={disabled}
                onChange={() => group.onChange(value)}
                className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-[inherit] opacity-0 disabled:cursor-not-allowed"
            />
            {children}
        </label>
    );
}

export interface RadioCardsProps<V extends string> {
    label: string;
    value: V;
    onChange: (value: V) => void;
    /** Form field name; defaults to a generated one. */
    name?: string;
    /** Classes for the cards' container: its layout (e.g. a grid). */
    className?: string;
    /** The RadioCards. */
    children: ReactNode;
}

export interface RadioCardProps {
    value: string;
    /** Can't be chosen (and the arrow keys skip it). */
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}
