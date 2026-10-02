import { cx } from '@zen/utils/cx';
import { useEffect, useState } from 'react';

/**
 * "On this page": links to the page's headings, highlighting the section being
 * read. Items point at element ids; nested items (depth 2) are indented.
 */
export default function TableOfContents({ items, title = 'On this page', className }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>();

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
        const visible = new Set<string>();
        // A heading counts as current while it's in the top part of the viewport.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) visible.add(e.target.id);
                    else visible.delete(e.target.id);
                }
                const first = items.find((i) => visible.has(i.id));
                if (first) setActiveId(first.id);
            },
            { rootMargin: '0px 0px -65% 0px' },
        );
        targets.forEach((t) => observer.observe(t));
        return () => observer.disconnect();
    }, [items]);

    if (!items.length) return null;
    return (
        <nav aria-label={title} className={cx('zen__toc flex flex-col gap-3', className)}>
            <p className="text-muted-foreground text-2xs mt-0! tracking-widest uppercase">{title}</p>
            <ul className="border-tint/[0.07] flex flex-col gap-2 border-l text-sm">
                {items.map((item) => (
                    <li key={item.id} className={cx('-ml-px', item.depth === 2 && 'pl-3')}>
                        <a
                            href={`#${item.id}`}
                            aria-current={item.id === activeId ? 'location' : undefined}
                            className={cx(
                                'text-muted-foreground hover:text-foreground block border-l border-transparent pl-3 transition-colors',
                                'aria-[current=location]:border-primary aria-[current=location]:text-foreground',
                            )}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export interface TableOfContentsItem {
    /** Id of the heading (or section) to link to. */
    id: string;
    label: string;
    /** 1 (default) or 2 for a nested entry. */
    depth?: 1 | 2;
}

export interface TableOfContentsProps {
    items: TableOfContentsItem[];
    title?: string;
    className?: string;
}
