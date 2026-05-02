import { cx } from '@zen/utils/cx';
import { ComponentProps, useId } from 'react';

export interface ToggleProps extends Omit<ComponentProps<'input'>, 'onChange'> {
    onChange?: (checked: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const { className, checked, onChange, defaultChecked, id, ...rest } = props;
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div
            role="switch"
            aria-checked={checked ?? defaultChecked ?? false}
            tabIndex={0}
            className={cx(
                'relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full',
                'border-primary bg-secondary dark:bg-muted border',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
                'transition-colors duration-300 ease-in-out',
                className,
            )}
            onClick={() => onChange?.(!checked)}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onChange?.(!checked);
                }
            }}
        >
            <input
                type="checkbox"
                id={inputId}
                className="sr-only"
                checked={checked}
                defaultChecked={defaultChecked}
                onChange={(e) => onChange?.(e.target.checked)}
                tabIndex={-1}
                {...rest}
            />
            <span
                className={cx(
                    'bg-primary size-4 rounded-full transition-all duration-300 ease-in-out',
                    checked ? 'translate-x-5' : 'translate-x-0.5',
                )}
            />
        </div>
    );
}
