import { cx } from '@zen/utils/cx';
import { Slot } from '@zen/utils/slot';
import { ReactElement, useState } from 'react';

/**
 * Shimmering placeholder in the shape of content that's on its way. Size it with className.
 *
 * Give it the content as its child and `loading`: the placeholder shows while
 * loading, then the content fades in where it was.
 */
export default function Skeleton({ className, loading, children }: SkeletonProps) {
    const [waited, setWaited] = useState(!!loading);
    if (loading && !waited) setWaited(true);
    if (children && !loading) return waited ? <Slot className="zen__reveal">{children}</Slot> : children;
    return <span aria-hidden className={cx('zen__skeleton block rounded-md', className)} />;
}

export interface SkeletonProps {
    className?: string;
    /** With children: show the placeholder instead of them while true. */
    loading?: boolean;
    /** The content this stands in for, a single element. */
    children?: ReactElement;
}
