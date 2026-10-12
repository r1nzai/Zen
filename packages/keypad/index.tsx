import ArrowLeft from '@zen/icons/arrow-left';
import { cx } from '@zen/utils/cx';
import { useControllable } from '@zen/utils/useControllable';
import { ComponentProps } from 'react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

/**
 * A number pad for typing an amount on a phone, where the system keyboard
 * covers half the screen. The value is the text typed ("12.5"), so a
 * trailing point or zero stays until you convert it: no leading zeros, one
 * point, at most `decimals` digits after it.
 */
export default function Keypad({
    value: valueProp,
    defaultValue = '',
    onValueChange: onValueChangeProp,
    decimals = 2,
    maxLength = 12,
    deleteLabel = 'Delete',
    'aria-label': label = 'Keypad',
    className,
    ...rest
}: KeypadProps) {
    const [value, onValueChange] = useControllable(valueProp, defaultValue, onValueChangeProp);
    const press = (key: (typeof KEYS)[number]) => {
        if (key === 'back') return onValueChange(value.slice(0, -1));
        const point = value.indexOf('.');
        if (key === '.') {
            if (decimals === 0 || point !== -1) return;
            return onValueChange((value || '0') + '.');
        }
        if (point !== -1 && value.length - point > decimals) return;
        if (value.length >= maxLength) return;
        onValueChange(value === '0' ? key : value + key);
    };
    return (
        <div role="group" aria-label={label} className={cx('zen__keypad grid grid-cols-3 gap-2', className)} {...rest}>
            {KEYS.map((key) => (
                <button
                    key={key}
                    type="button"
                    aria-label={key === 'back' ? deleteLabel : undefined}
                    disabled={key === '.' && decimals === 0}
                    onClick={() => press(key)}
                    className="bg-tint/[0.05] hover:bg-tint/[0.09] focus-ring grid h-14 cursor-pointer place-items-center rounded-xl text-xl font-medium tabular-nums outline-hidden transition-[background-color,scale] duration-150 select-none active:scale-95 disabled:invisible"
                >
                    {key === 'back' ? <ArrowLeft className="size-5" /> : key}
                </button>
            ))}
        </div>
    );
}

/** Other props (data-*, an id) go on the group. */
export interface KeypadProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'children'> {
    /** What's been typed, e.g. "12.5", when you keep it. */
    value?: string;
    /** What's typed at first, when the keypad keeps its own. */
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Digits allowed after the point (default 2; 0 hides the point). */
    decimals?: number;
    maxLength?: number;
    /** The delete key's name for screen readers. */
    deleteLabel?: string;
}
