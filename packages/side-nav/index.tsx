import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { ComponentProps, ReactNode } from 'react';

/** Vertical navigation, e.g. a docs or settings sidebar. Give it an aria-label. */
export default function SideNav({ className, ...rest }: ComponentProps<'nav'>) {
    return <nav className={cx('zen__side-nav flex flex-col gap-6', className)} {...rest} />;
}

/** A titled group of links. */
export function SideNavGroup({
    title,
    children,
    className,
}: {
    title?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cx('flex flex-col gap-1', className)}>
            {title && (
                <span className="text-muted-foreground text-2xs px-3 pb-1 tracking-widest uppercase">{title}</span>
            )}
            {children}
        </div>
    );
}

const LINK = cx(
    'rounded-lg px-3 py-1.5 text-sm outline-hidden transition-[background-color,color,box-shadow] duration-200',
    'text-muted-foreground hover:bg-tint/[0.05] hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2',
    'aria-[current=page]:bg-primary/15 aria-[current=page]:text-foreground aria-[current=page]:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)]',
);

/**
 * One link. `active` marks the current page. With `asChild`, the styles go onto
 * your own link element instead (a router's Link or NavLink, which may set
 * aria-current itself).
 */
export function SideNavLink({ active, asChild, className, children, ...rest }: SideNavLinkProps) {
    const props = { ...rest, 'aria-current': active ? ('page' as const) : undefined, className: cx(LINK, className) };
    if (asChild) {
        if (!active) delete props['aria-current'];
        return <Slot {...props}>{children}</Slot>;
    }
    return <a {...props}>{children}</a>;
}

export interface SideNavLinkProps extends ComponentProps<'a'> {
    /** This link is the current page. */
    active?: boolean;
    /** Style the single child element (e.g. a router link) instead of rendering an <a>. */
    asChild?: boolean;
}
