import { useFieldProps } from '@zen/field';
import { cx } from '@zen/utils/cx';
import { FIELD } from '@zen/utils/styles';
import { ComponentProps } from 'react';

export default function Textarea(props: TextAreaProps) {
    const { className, ...rest } = props;
    const field = useFieldProps(rest);
    return (
        <textarea
            className={cx(
                'zen__textarea',
                // FIELD's fixed height swapped for a taller, resizable box
                FIELD.replace('h-10', ''),
                'h-32 w-full resize-y py-2',
                'read-only:text-foreground read-only:cursor-default read-only:border-none! read-only:bg-transparent read-only:shadow-none! read-only:outline-hidden!',
                className,
            )}
            {...rest}
            {...field}
        />
    );
}

export type TextAreaProps = ComponentProps<'textarea'>;
