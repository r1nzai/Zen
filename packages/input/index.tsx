import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { FIELD, FIELD_SIZE, type FieldSize } from '@zen/utils/styles';
import { ComponentProps } from 'react';

export default function Input(props: InputProps) {
    const { className, size = 'default', ...rest } = props;
    const field = useFieldProps(rest);
    return (
        <input
            className={cx(
                'zen__input',
                FIELD,
                FIELD_SIZE[size],
                'w-full',
                'read-only:text-foreground read-only:cursor-default read-only:border-none! read-only:bg-transparent read-only:shadow-none! read-only:outline-hidden!',
                'file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
                '[[type="checkbox"]]:accent-primary [[type="checkbox"]]:h-4 [[type="checkbox"]]:w-4 [[type="checkbox"]]:rounded-sm',
                '[[type="radio"]]:accent-primary [[type="radio"]]:h-4 [[type="radio"]]:w-4',
                className,
            )}
            {...rest}
            {...field}
        />
    );
}

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
    /** Height, matching Button's: sm (32px), default (40px) or lg (44px). */
    size?: FieldSize;
}
