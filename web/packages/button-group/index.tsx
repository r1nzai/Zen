import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * Buttons joined into one: shared edges, rounded only at the ends, e.g. a
 * split button (an action and a menu of others) or Previous / Today / Next.
 * Best with `outline` buttons, whose hairlines meet. Upright with
 * `orientation="vertical"`. Give it an aria-label when the buttons' names
 * don't say what they're for together.
 */
export default function ButtonGroup({ orientation = 'horizontal', className, ...rest }: ButtonGroupProps) {
    return (
        <div
            role="group"
            data-orientation={orientation}
            className={cx(
                'zen__button-group isolate inline-flex w-fit',
                // Raised while hovered or focused, so its whole border and focus ring show over its neighbours'.
                '[&>:not([popover])]:rounded-none [&>:focus-visible]:z-10 [&>:hover]:z-10',
                // The ends are the first and last buttons, not counting popups (a Menu's) beside their triggers.
                orientation === 'horizontal'
                    ? '[&>:nth-child(1_of_:not([popover]))]:rounded-s-lg [&>:nth-last-child(1_of_:not([popover]))]:rounded-e-lg [&>:not([popover]):not(:nth-child(1_of_:not([popover])))]:-ms-px'
                    : 'flex-col [&>:nth-child(1_of_:not([popover]))]:rounded-t-lg [&>:nth-last-child(1_of_:not([popover]))]:rounded-b-lg [&>:not([popover]):not(:nth-child(1_of_:not([popover])))]:-mt-px',
                className,
            )}
            {...rest}
        />
    );
}

export interface ButtonGroupProps extends ComponentProps<'div'> {
    orientation?: 'horizontal' | 'vertical';
}
