import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

export default function Textarea(props: TextAreaProps) {
    const { className, ...rest } = props;
    return (
        <textarea
            className={cx(
                'border-input bg-background text-foreground h-32 w-full resize-y rounded border-2 px-3 py-2 text-sm transition',
                'placeholder:text-muted-foreground',
                'focus-visible:border-primary focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-hidden',
                'read-only:text-foreground read-only:cursor-default read-only:border-none! read-only:bg-transparent read-only:shadow-none! read-only:outline-hidden!',
                'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
                className,
            )}
            {...rest}
        />
    );
}

export type TextAreaProps = ComponentProps<'textarea'>;
