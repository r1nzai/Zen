import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

export interface ToggleProps extends Omit<ComponentProps<'input'>, 'onChange' | 'type'> {
    onChange?: (checked: boolean) => void;
}

/**
 * On/off switch. A native checkbox with the switch role underneath, so forms
 * and screen readers work as they do for any checkbox. Space and Enter both
 * flip it (Enter doesn't submit a surrounding form), as for a switch button.
 */
export default function Toggle(props: ToggleProps) {
    const { className, onChange, onKeyDown, disabled, ...rest } = props;

    return (
        <label
            className={cx(
                'zen__toggle border-tint/10 bg-tint/[0.06] relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border p-0.5',
                'has-focus-visible:ring-glow/50 transition-[background-color,box-shadow,border-color] duration-300 has-focus-visible:ring-2',
                'has-checked:border-glow/60 has-checked:bg-glow/40 has-checked:shadow-[0_0_18px_-2px_oklch(var(--glow)/0.8)]',
                'has-disabled:cursor-not-allowed has-disabled:opacity-50',
                className,
            )}
        >
            <input
                type="checkbox"
                role="switch"
                // The real checkbox covers the switch, invisible: it's what gets clicked, tapped
                // and focused, so the pointer and assistive tech hit the same element.
                className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed"
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.checked)}
                onKeyDown={(e) => {
                    onKeyDown?.(e);
                    if (e.key === 'Enter' && !e.defaultPrevented) {
                        e.preventDefault();
                        e.currentTarget.click();
                    }
                }}
                {...rest}
            />
            <span
                aria-hidden
                className={cx(
                    'size-[1.125rem] rounded-full bg-white/70 shadow-md',
                    'transition-[translate,background-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                    'peer-checked:translate-x-5 peer-checked:bg-white',
                )}
            />
        </label>
    );
}
