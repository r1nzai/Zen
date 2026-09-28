import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * A sticky bar across the top of the page: the page colour, translucent and
 * heavily blurred, over a hairline. Clears the notch on phones, where it's
 * solid instead (a live blur over scrolling content stutters there).
 */
export default function Header({ className, children, ...rest }: ComponentProps<'header'>) {
    return (
        <header
            className={cx(
                'zen__header border-tint/5 bg-background/60 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl',
                'pointer-coarse:bg-background/95 pointer-coarse:backdrop-blur-none',
                className,
            )}
            {...rest}
        >
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:gap-6 md:px-6 md:py-3">
                {children}
            </div>
        </header>
    );
}
