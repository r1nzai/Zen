import { cx } from '@zen/utils/cx';

/** Shimmering placeholder in the shape of content that's on its way. Size it with className. */
export default function Skeleton({ className }: SkeletonProps) {
    return <span aria-hidden className={cx('zen__skeleton block rounded-md', className)} />;
}

export interface SkeletonProps {
    className?: string;
}
