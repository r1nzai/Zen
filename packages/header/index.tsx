import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/** A sticky glass bar across the top of the page, with its content in a row. */
export default function Header({ className, children, ...rest }: ComponentProps<'header'>) {
    return (
        <header
            className={cx(
                'zen__header glass glass-blur sticky top-0 z-40 rounded-none! border-x-0! border-t-0!',
                className,
            )}
            {...rest}
        >
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">{children}</div>
        </header>
    );
}
