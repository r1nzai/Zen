import { cx } from '@zen/utils/cx';
import { ComponentProps } from 'react';

/**
 * The page's content, which changes between pages: wrap your route's outlet in
 * it, and when the router changes page in a view transition (React Router's
 * `viewTransition`, or document.startViewTransition yourself) the old page
 * fades out as the new one rises in, while everything outside (header, nav)
 * stays still. One per page.
 */
export default function PageTransition({ className, style, ...rest }: ComponentProps<'div'>) {
    return (
        <div
            className={cx('zen__page-transition', className)}
            style={{ viewTransitionName: 'zen-page', ...style }}
            {...rest}
        />
    );
}
