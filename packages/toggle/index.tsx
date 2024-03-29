import { cx } from '@zen/utils/cx';
import Component, { ComponentProps } from '@zen/component';
import Container from '@zen/container';

export interface ToggleProps extends Omit<ComponentProps<'input'>, 'onChange'> {
    onChange: (e: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const { className, checked, onChange, ...rest } = props;
    return (
        <Component
            tag={'div'}
            className={cx(
                'rounded-full',
                'h-5 w-10',
                'border border-muted bg-secondary',
                'flex items-center',
                className,
            )}
            onClick={() => {
                onChange(!checked);
            }}
        >
            <Component tag={'input'} type="hidden" checked={checked} {...rest} onChange={() => {}} />
            <Container
                className={cx(
                    'h-4 w-4 rounded-full bg-primary transition',
                    checked ? 'translate-x-5' : 'translate-x-1',
                )}
            />
        </Component>
    );
}
