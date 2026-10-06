import Button from '@zen/button';
import Spinner from '@zen/spinner';
import { cx } from '@zen/utils/cx';
import { useEffect, useRef } from 'react';

/**
 * The end of a long list that has more: a "Load more" button, which also
 * presses itself when it scrolls into view (`auto`, default). While `loading`
 * it shows a spinner and won't ask again; once there's nothing left
 * (`hasMore` false) it's gone. Put it after the list, or in a table's last row.
 */
export default function LoadMore({
    onLoadMore,
    hasMore,
    loading = false,
    auto = true,
    label = 'Load more',
    loadingLabel = 'Loading more…',
    className,
}: LoadMoreProps) {
    const ref = useRef<HTMLDivElement>(null);
    const load = useRef(onLoadMore);
    useEffect(() => {
        load.current = onLoadMore;
    });
    // Watched afresh after each load, so a page too short to scroll keeps filling.
    useEffect(() => {
        const el = ref.current;
        if (!auto || !hasMore || loading || !el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                observer.disconnect();
                load.current();
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [auto, hasMore, loading]);

    if (!hasMore) return null;
    return (
        <div ref={ref} className={cx('zen__load-more flex justify-center py-3', className)}>
            <Button variant="ghost" size="sm" aria-busy={loading} disabled={loading} onClick={onLoadMore}>
                {loading ? (
                    <>
                        <Spinner className="size-3.5" />
                        {loadingLabel}
                    </>
                ) : (
                    label
                )}
            </Button>
        </div>
    );
}

export interface LoadMoreProps {
    onLoadMore: () => void;
    hasMore: boolean;
    /** While true, it shows a spinner and won't ask for more. */
    loading?: boolean;
    /** Load when it scrolls into view, not only on press (default true). */
    auto?: boolean;
    label?: string;
    loadingLabel?: string;
    className?: string;
}
