import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/** A key on the keyboard, for shortcuts in hints and tooltips: <Kbd>⌘</Kbd><Kbd>K</Kbd>. Sized from the text around it. */
export default function Kbd({ className, ...rest }: ComponentProps<'kbd'>) {
    return (
        <kbd
            className={cx(
                'zen__kbd border-tint/15 bg-tint/[0.06] text-muted-foreground inline-flex h-[1.7em] min-w-[1.7em] items-center justify-center rounded-[0.4em] border px-[0.45em] font-sans text-[0.8em] leading-none font-medium shadow-[inset_0_-1px_0_oklch(var(--tint)/0.12)]',
                className,
            )}
            {...rest}
        />
    );
}
