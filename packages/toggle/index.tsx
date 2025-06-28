import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

export interface ToggleProps extends Omit<ComponentProps<'input'>, 'onChange'> {
    onChange?: (e: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const { className, checked, onChange, defaultChecked, ...rest } = props;
    return (
        <div
            className={cx(
                'rounded-full',
                'h-5 w-10',
                'border-muted bg-secondary border',
                'flex items-center',
                className,
            )}
            onClick={() => onChange?.(!checked)}
        >
            <input type="hidden" readOnly {...rest} {...{ defaultChecked, checked }} />
            <div
                className={cx(
                    '[animation-timing-function:cubic-bezier(1, 0, 0, 1)] bg-primary size-4 rounded-full transition-all duration-250',
                    checked ? 'translate-x-5' : 'translate-x-0',
                )}
            />
        </div>
    );
}
