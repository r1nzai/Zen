import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { Children, ComponentProps, ReactNode } from 'react';

/**
 * Phone navigation: a glass bar fixed to the bottom, clear of the home
 * indicator, hidden from `hideFrom` up (default md). Fill it with TabBarItems.
 * Inside a rounded frame, round the bar to match (className, e.g.
 * rounded-b-[15px]): with GPU compositing, Chrome doesn't clip a blurred
 * backdrop to an ancestor's rounded corners, only to the element's own.
 */
export default function TabBar({ hideFrom = 'md', className, children, ...rest }: TabBarProps) {
    return (
        <nav
            className={cx(
                'zen__tab-bar glass glass-blur glow-edge fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0! border-b-0! pb-[env(safe-area-inset-bottom)]',
                hideFrom === 'sm' && 'sm:hidden',
                hideFrom === 'md' && 'md:hidden',
                hideFrom === 'lg' && 'lg:hidden',
                className,
            )}
            {...rest}
        >
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Children.count(children)}, 1fr)` }}>
                {children}
            </div>
        </nav>
    );
}

const ITEM = cx(
    'flex flex-col items-center gap-1 py-2.5 text-2xs outline-hidden transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset',
    'text-muted-foreground aria-[current=page]:text-primary [&_svg]:size-5 aria-[current=page]:[&_svg]:drop-shadow-[0_0_8px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]',
);

/**
 * One destination: an icon over a label. `active` marks the current page; with
 * `asChild`, the styles go onto your own link (e.g. a router's NavLink, which
 * sets aria-current itself).
 */
export function TabBarItem({ icon, active, asChild, className, children, ...rest }: TabBarItemProps) {
    const props = { ...rest, 'aria-current': active ? ('page' as const) : undefined, className: cx(ITEM, className) };
    if (asChild) {
        if (!active) delete props['aria-current'];
        return <Slot {...props}>{children}</Slot>;
    }
    return (
        <a {...props}>
            {icon}
            {children}
        </a>
    );
}

export interface TabBarProps extends ComponentProps<'nav'> {
    /** Hide the bar from this breakpoint up (false: always show). */
    hideFrom?: 'sm' | 'md' | 'lg' | false;
}

export interface TabBarItemProps extends ComponentProps<'a'> {
    icon?: ReactNode;
    active?: boolean;
    /** Style the single child element (a router link holding the icon and label) instead of rendering an <a>. */
    asChild?: boolean;
}
