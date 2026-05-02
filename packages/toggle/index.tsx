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
                'border-primary dark:bg-primary-foreground bg-secondary border',
                'flex items-center',
                className,
            )}
            onClick={() => onChange?.(!checked)}
        >
            <input type="hidden" {...rest} readOnly className="peer/toggle" {...{ defaultChecked, checked }} />
            <div
                className={cx(
                    '[animation-timing-function:cubic-bezier(1, 0, 0, 1)] bg-primary size-4 rounded-full transition-all duration-250',
                    checked ? 'translate-x-5' : 'translate-x-0.5',
                )}
            />
        </div>
    );
}
