import {
    Disclosure,
    DisclosureContent,
    DisclosureTrigger,
    PageHeader as ZenPageHeader,
    TableOfContents,
    type TableOfContentsItem,
} from '@rinzai/zen';
import type { ComponentProps, ReactNode } from 'react';

import { Sidebar } from './sidebar';

/** Sidebar, page, and an optional "On this page" list. */
export function DocsLayout({ children, toc }: { children: ReactNode; toc?: TableOfContentsItem[] }) {
    return (
        <div className="mx-auto flex max-w-7xl gap-10 px-4 md:px-6">
            <aside className="sticky top-[4.25rem] hidden h-[calc(100dvh-4.25rem)] w-56 shrink-0 overflow-y-auto py-10 md:block">
                <Sidebar />
            </aside>
            <main className="rise min-w-0 flex-1 py-10 md:py-14">
                {/* Where the side column isn't shown: the same list, folded away above the page. */}
                {toc && toc.length > 0 && (
                    <div className="mb-8 xl:hidden">
                        <Disclosure>
                            <DisclosureTrigger className="pointer-coarse:py-2">On this page</DisclosureTrigger>
                            <DisclosureContent className="pt-3">
                                <TableOfContents items={toc} title="" />
                            </DisclosureContent>
                        </Disclosure>
                    </div>
                )}
                {children}
            </main>
            {toc && toc.length > 0 && (
                <aside className="sticky top-[4.25rem] hidden h-[calc(100dvh-4.25rem)] w-48 shrink-0 py-14 xl:block">
                    <TableOfContents items={toc} />
                </aside>
            )}
        </div>
    );
}

/** Zen's PageHeader, spaced for the top of a docs page. */
export function PageHeader(props: ComponentProps<typeof ZenPageHeader>) {
    return <ZenPageHeader {...props} className="mb-12" />;
}
