import { PageTransition, Pill, PillIndicator, Pills, Stat, StatRow } from '@rinzai/zen';
import { useState } from 'react';
import { flushSync } from 'react-dom';

const PAGES = {
    overview: {
        title: 'Overview',
        stats: [
            ['Net', '$2,410'],
            ['Spent', '$1,845'],
        ],
    },
    budgets: {
        title: 'Budgets',
        stats: [
            ['On track', '4 of 5'],
            ['Left', '$655'],
        ],
    },
    goals: {
        title: 'Goals',
        stats: [
            ['Saved', '$12,940'],
            ['Next', 'Holiday'],
        ],
    },
} as const;
type Page = keyof typeof PAGES;

/** A router does this for you (React Router: `viewTransition` on a Link); here, by hand. */
export default function Default() {
    const [page, setPage] = useState<Page>('overview');
    const go = (next: Page) => {
        if (!document.startViewTransition) return setPage(next);
        document.startViewTransition(() => flushSync(() => setPage(next)));
    };
    return (
        <div className="flex w-full max-w-md flex-col gap-4">
            <nav aria-label="Pages">
                <Pills>
                    <PillIndicator />
                    {(Object.keys(PAGES) as Page[]).map((p) => (
                        <Pill
                            key={p}
                            href={`#${p}`}
                            active={p === page}
                            onClick={(e) => {
                                e.preventDefault();
                                go(p);
                            }}
                        >
                            {PAGES[p].title}
                        </Pill>
                    ))}
                </Pills>
            </nav>
            <PageTransition>
                <h3 className="mb-3 text-lg font-semibold">{PAGES[page].title}</h3>
                <StatRow className="sm:grid-cols-2!">
                    {PAGES[page].stats.map(([label, value]) => (
                        <Stat key={label} label={label} value={value} />
                    ))}
                </StatRow>
            </PageTransition>
        </div>
    );
}
