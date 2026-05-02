import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

export default function Input(props: InputProps) {
    const { className, ...rest } = props;
    return (
        <input
            className={cx(
                'border-input bg-background text-foreground h-10 w-full rounded border-2 px-3 py-2 text-sm transition',
                'placeholder:text-muted-foreground',
                'focus-visible:border-primary focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-hidden',
                'read-only:text-foreground read-only:cursor-default read-only:border-none! read-only:bg-transparent read-only:shadow-none! read-only:outline-hidden!',
                'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
                'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                '[[type="checkbox"]]:accent-primary [[type="checkbox"]]:h-4 [[type="checkbox"]]:w-4 [[type="checkbox"]]:rounded-sm',
                '[[type="radio"]]:accent-primary [[type="radio"]]:h-4 [[type="radio"]]:w-4',
                className,
            )}
            {...rest}
        />
    );
}

export type InputProps = ComponentProps<'input'>;
