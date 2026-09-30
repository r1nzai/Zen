import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * A small rounded button that can be pressed in, for quick picks beside a
 * field (e.g. common tenures): `pressed` marks the one matching the field.
 * For choosing exactly one of a few options, use Segmented.
 */
export default function Chip({ pressed, className, ...rest }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            className={cx(
                'zen__chip border-tint/10 text-muted-foreground cursor-pointer rounded-full border px-3 py-1 text-xs outline-hidden transition-colors disabled:cursor-not-allowed',
                'hover:border-tint/20 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2',
                'aria-pressed:border-primary/40 aria-pressed:bg-primary/15 aria-pressed:text-foreground',
                className,
            )}
            {...rest}
        />
    );
}

export interface ChipProps extends ComponentProps<'button'> {
    /** Shown pressed in (aria-pressed). */
    pressed?: boolean;
}
