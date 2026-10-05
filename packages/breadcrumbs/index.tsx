import ChevronRight from '@zen/icons/micro/chevron-right';
import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { Children, ComponentProps, Fragment, isValidElement } from 'react';

/** Where a page sits: its parents as links, then the page itself. Give the last crumb `current`. */
export default function Breadcrumbs({
    className,
    children,
    'aria-label': label = 'Breadcrumb',
    ...rest
}: ComponentProps<'nav'>) {
    const crumbs = Children.toArray(children).filter(isValidElement);
    return (
        <nav aria-label={label} className={cx('zen__breadcrumbs', className)} {...rest}>
            <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
                {crumbs.map((crumb, i) => (
                    <Fragment key={crumb.key ?? i}>
                        {i > 0 && (
                            <li aria-hidden className="text-muted-foreground/60 flex">
                                <ChevronRight className="size-3.5" />
                            </li>
                        )}
                        <li className="flex min-w-0">{crumb}</li>
                    </Fragment>
                ))}
            </ol>
        </nav>
    );
}

/**
 * One crumb: a link, or with `current`, the page you're on (not a link). With
 * `asChild`, the styles go onto your own link element (a router's Link).
 */
export function Breadcrumb({ current, asChild, className, ...rest }: BreadcrumbProps) {
    const classes = cx(
        'truncate rounded-sm outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
        current ? 'text-foreground font-medium' : 'hover:text-foreground touch-target',
        className,
    );
    if (current) return <span aria-current="page" className={classes} {...(rest as ComponentProps<'span'>)} />;
    return asChild ? <Slot className={classes} {...rest} /> : <a className={classes} {...rest} />;
}

export interface BreadcrumbProps extends ComponentProps<'a'> {
    /** The page you're on: the last crumb. */
    current?: boolean;
    /** Style the single child element (e.g. a router link) instead of rendering an <a>. */
    asChild?: boolean;
}
