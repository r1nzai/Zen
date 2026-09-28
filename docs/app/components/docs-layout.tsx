import type { ReactNode } from 'react';

import { Sidebar } from './sidebar';

/** Sidebar, page, and an optional "On this page" list. */
export function DocsLayout({ children, toc }: { children: ReactNode; toc?: { id: string; label: string; depth?: number }[] }) {
    return (
        <div className="mx-auto flex max-w-7xl gap-10 px-4 md:px-6">
            <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 overflow-y-auto py-10 md:block">
                <Sidebar />
            </aside>
            <main className="rise min-w-0 flex-1 py-10 md:py-14">{children}</main>
            {toc && toc.length > 0 && (
                <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-48 shrink-0 py-14 xl:block">
                    <p className="text-muted-foreground mb-3 text-[0.68rem] tracking-[0.1em] uppercase">On this page</p>
                    <ul className="flex flex-col gap-2 text-sm">
                        {toc.map((item) => (
                            <li key={item.id} className={item.depth === 2 ? 'pl-3' : undefined}>
                                <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
            )}
        </div>
    );
}

/** Page title block: group badge, gradient title, lead paragraph. */
export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
    return (
        <header className="mb-12 flex flex-col gap-3">
            {eyebrow && <p className="text-muted-foreground mt-0! text-xs tracking-[0.1em] uppercase">{eyebrow}</p>}
            <h1 className="text-aurora">{title}</h1>
            {lead && <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">{lead}</p>}
        </header>
    );
}
