import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

export default function Input(props: TextAreaProps) {
    const { className, ...rest } = props;
    return (
        <textarea
            className={cx(
                'border-input bg-background text-foreground h-10 w-full rounded border-2 px-3 py-2 text-sm transition',
                'focus-visible:border-primary focus-visible:shadow-ring focus-visible:shadow-xs focus-visible:outline-hidden',
                'read-only:text-foreground read-only:cursor-pointer read-only:border-none! read-only:bg-transparent read-only:shadow-none! read-only:outline-hidden!',
                'disabled:bg-muted disabled:text-muted disabled:cursor-not-allowed',
                'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                className,
            )}
            {...rest}
        />
    );
}

export type TextAreaProps = ComponentProps<'textarea'>;
