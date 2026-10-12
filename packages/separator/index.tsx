import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * A hairline between groups of content, across (the default) or upright
 * (`orientation="vertical"`, e.g. between toolbar buttons; it takes its
 * container's height). Screen readers hear it only when it divides something
 * meaningful: pass `decorative` for one that's just visual.
 */
export default function Separator({ orientation = 'horizontal', decorative, className, ...rest }: SeparatorProps) {
    return (
        <div
            role={decorative ? 'none' : 'separator'}
            aria-orientation={decorative || orientation === 'horizontal' ? undefined : 'vertical'}
            data-orientation={orientation}
            className={cx(
                'zen__separator bg-tint/[0.09] shrink-0',
                orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
                className,
            )}
            {...rest}
        />
    );
}

export interface SeparatorProps extends ComponentProps<'div'> {
    orientation?: 'horizontal' | 'vertical';
    /** Only visual: hidden from screen readers. */
    decorative?: boolean;
}
