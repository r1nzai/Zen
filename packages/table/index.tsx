import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/** A plain HTML table on a glass panel whose edge catches the pointer light, scrolling sideways when it doesn't fit. Compose with the Table* parts. */
export default function Table({ className, containerClassName, ...rest }: TableProps) {
    return (
        <div className={cx('zen__table glass glow-edge overflow-x-auto rounded-xl', containerClassName)}>
            <table className={cx('w-full text-left text-sm', className)} {...rest} />
        </div>
    );
}

/** Column headings: small, muted, spaced caps. */
export function TableHeader({ className, ...rest }: ComponentProps<'thead'>) {
    return (
        <thead
            className={cx(
                'border-tint/[0.07] text-muted-foreground border-b text-[0.68rem] tracking-[0.1em] uppercase',
                className,
            )}
            {...rest}
        />
    );
}

/** Rows, split by hairlines. */
export function TableBody({ className, ...rest }: ComponentProps<'tbody'>) {
    return <tbody className={cx('divide-tint/[0.07] divide-y', className)} {...rest} />;
}

export function TableRow({ className, ...rest }: ComponentProps<'tr'>) {
    return <tr className={cx('hover:bg-tint/[0.02] align-top transition-colors', className)} {...rest} />;
}

export function TableHead({ className, ...rest }: ComponentProps<'th'>) {
    return <th className={cx('px-4 py-3 font-medium', className)} {...rest} />;
}

export function TableCell({ className, ...rest }: ComponentProps<'td'>) {
    return <td className={cx('px-4 py-3', className)} {...rest} />;
}

export interface TableProps extends ComponentProps<'table'> {
    /** Classes for the glass panel around the table (className goes to the <table>). */
    containerClassName?: string;
}
