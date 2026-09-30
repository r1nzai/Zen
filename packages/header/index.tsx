import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { ComponentProps } from 'react';

/**
 * A sticky bar across the top of the page: the page colour, translucent and
 * heavily blurred, over a hairline. Clears the notch on phones, where it's
 * solid instead (a live blur over scrolling content stutters there).
 *
 * Its first stop for the keyboard is a "Skip to content" link, hidden until
 * focused, that moves focus to the page's <main> past the bar's links (WCAG
 * 2.4.1). Change its text with `skipLabel`, or pass null to leave it out.
 */
export default function Header({ skipLabel = 'Skip to content', className, children, ...rest }: HeaderProps) {
    useGraphicsMode();
    return (
        <header
            className={cx(
                'zen__header glow-edge border-tint/5 bg-background/60 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl',
                'pointer-coarse:bg-background/95 pointer-coarse:backdrop-blur-none',
                className,
            )}
            {...rest}
        >
            {skipLabel !== null && (
                <a
                    href="#main"
                    onClick={(e) => {
                        const main = document.querySelector('main');
                        if (!main) return;
                        e.preventDefault();
                        // Focusable only for this: it isn't a stop when tabbing through the page,
                        // and gets no focus ring (theme.css) since the whole page would be outlined.
                        if (!main.hasAttribute('tabindex')) {
                            main.tabIndex = -1;
                            main.dataset.zenSkipTarget = '';
                        }
                        main.focus();
                    }}
                    className="bg-primary text-primary-foreground focus-visible:ring-glow/50 sr-only rounded-lg px-3 py-2 text-sm font-medium outline-hidden focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus-visible:ring-2"
                >
                    {skipLabel}
                </a>
            )}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:gap-6 md:px-6 md:py-3">
                {children}
            </div>
        </header>
    );
}

export interface HeaderProps extends ComponentProps<'header'> {
    /** The skip link's text; null for no skip link (e.g. when the page has its own). */
    skipLabel?: string | null;
}
