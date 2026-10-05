import ChevronLeft from '@zen/icons/chevron-left';
import ChevronRight from '@zen/icons/chevron-right';
import { buttonVariants } from '@zen/button';
import { cx } from '@zen/utils/cx';
import { ComponentProps, ReactNode } from 'react';

/**
 * The pages a long list is split into: previous and next, the first and last
 * pages, and those around the current one (`page`, from 1). Pages are buttons
 * calling `onPageChange`, or with `href`, links (render them with your router's
 * Link through `renderLink`).
 */
export default function Pagination({
    page,
    count,
    onPageChange,
    href,
    renderLink = (props) => <a {...props} />,
    siblings = 1,
    className,
    'aria-label': label = 'Pages',
}: PaginationProps) {
    if (count < 2) return null;
    const item = (to: number, content: ReactNode, props: { 'aria-label'?: string; current?: boolean }) => {
        const disabled = to < 1 || to > count;
        const className = cx(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'min-w-9 w-auto px-2 tabular-nums',
            props.current &&
                'bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.3),0_0_18px_-6px_oklch(var(--glow)/calc(0.6*var(--glow-k)))] hover:bg-primary/20',
        );
        const common = {
            'aria-label': props['aria-label'],
            'aria-current': props.current ? ('page' as const) : undefined,
            className,
        };
        if (href && !disabled)
            return renderLink(
                { ...common, href: href(to), onClick: onPageChange && (() => onPageChange(to)), children: content },
                to,
            );
        return (
            <button type="button" {...common} disabled={disabled} onClick={() => !props.current && onPageChange?.(to)}>
                {content}
            </button>
        );
    };
    return (
        <nav aria-label={label} className={cx('zen__pagination', className)}>
            <ul className="flex items-center gap-1">
                <li>{item(page - 1, <ChevronLeft className="size-4" />, { 'aria-label': 'Previous page' })}</li>
                {pageRange(page, count, siblings).map((p, i) => (
                    <li key={p === 'gap' ? `gap${i}` : p}>
                        {p === 'gap' ? (
                            <span aria-hidden className="text-muted-foreground grid w-6 place-items-center">
                                …
                            </span>
                        ) : (
                            item(p, p, { 'aria-label': `Page ${p}`, current: p === page })
                        )}
                    </li>
                ))}
                <li>{item(page + 1, <ChevronRight className="size-4" />, { 'aria-label': 'Next page' })}</li>
            </ul>
        </nav>
    );
}

/** The pages to show: the first, the last, `siblings` either side of `page`, and a gap where pages are skipped. */
export function pageRange(page: number, count: number, siblings = 1): (number | 'gap')[] {
    const shown = new Set([1, count]);
    for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= count) shown.add(p);
    const pages = [...shown].sort((a, b) => a - b);
    const out: (number | 'gap')[] = [];
    pages.forEach((p, i) => {
        const gap = p - (pages[i - 1] ?? p);
        // One page skipped shows as itself: a gap mark would be no shorter.
        if (gap === 2) out.push(p - 1);
        else if (gap > 2) out.push('gap');
        out.push(p);
    });
    return out;
}

export interface PaginationProps {
    /** The current page, from 1. */
    page: number;
    /** How many pages there are. With fewer than 2, nothing is shown. */
    count: number;
    onPageChange?: (page: number) => void;
    /** Pages as links: the URL of each. */
    href?: (page: number) => string;
    /** Renders a page link, e.g. with your router's Link. */
    renderLink?: (props: ComponentProps<'a'>, page: number) => ReactNode;
    /** Pages shown either side of the current one. */
    siblings?: number;
    className?: string;
    'aria-label'?: string;
}
