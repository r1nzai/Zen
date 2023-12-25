import Component, { ComponentProps } from '@zen/component';
import { cx } from '@zen/utils/cx';

export default function Input(props: InputProps) {
    const { width = '215px', height = '40px', className, style, ...rest } = props;
    return (
        <Component
            tag="input"
            className={cx(
                'rounded border-2 border-input px-3 py-2 text-sm text-foreground transition',
                'focus:border-primary focus:shadow-sm focus:shadow-ring focus:outline-none',
                'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted',
                className,
            )}
            style={{ width: width, height: height, ...style }}
            {...rest}
        />
    );
}

export interface InputProps extends ComponentProps<'input'> {
    width?: string;
    height?: string;
}
