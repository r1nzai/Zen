import { Button, buttonVariants, Dialog, Header, Pill, PillIndicator, Pills, ThemeToggle } from '@rinzai/zen';
import Bars from '@zen/icons/bars';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { version } from '../../../package.json';

import { COMPONENTS, componentPath } from '../pages';
import { Sidebar } from './sidebar';

const GITHUB = 'https://github.com/r1nzai/Zen';

export function SiteHeader() {
    const { pathname } = useLocation();
    const section = pathname.startsWith('/components')
        ? 'components'
        : pathname.startsWith('/showcase')
          ? 'showcase'
          : 'docs';
    return (
        <Header>
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MobileMenu />
                    <Link to="/" className="text-lg font-semibold tracking-tight">
                        Zen
                    </Link>
                    <a
                        href={`https://www.npmjs.com/package/@rinzai/zen/v/${version}`}
                        aria-label={`Version ${version} on npm`}
                        className="border-tint/10 text-muted-foreground hover:text-foreground hover:border-tint/20 touch-target rounded-md border px-1.5 py-0.5 font-mono text-xs transition-colors"
                    >
                        v{version}
                    </a>
                </div>
                <nav aria-label="Main" className="hidden md:block">
                    <Pills>
                        <PillIndicator />
                        <Pill asChild active={section === 'docs'}>
                            <Link to="/">Docs</Link>
                        </Pill>
                        <Pill asChild active={section === 'components'}>
                            <Link to={componentPath(COMPONENTS[0].slug)}>Components</Link>
                        </Pill>
                        <Pill asChild active={section === 'showcase'}>
                            <Link to="/showcase/">Showcase</Link>
                        </Pill>
                    </Pills>
                </nav>
                <div className="flex items-center gap-1">
                    {/* A full page load: Storybook is a separate app served from /storybook. */}
                    <a
                        href="/storybook/"
                        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'max-sm:hidden' })}
                    >
                        Storybook
                    </a>
                    <a
                        href={GITHUB}
                        aria-label="GitHub"
                        className="text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground grid size-9 place-items-center rounded-lg"
                    >
                        {/* GitHub's mark, Octicons mark-github-16.svg: https://github.com/primer/octicons/blob/ea8e6bb79894cc7e85564ee9b53d86b418738d04/icons/mark-github-16.svg */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="size-4"
                            aria-hidden
                        >
                            <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
                        </svg>
                    </a>
                    <ThemeToggle />
                </div>
            </div>
        </Header>
    );
}

/** Phones: the sidebar in a panel from the left. */
function MobileMenu() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    // Following a link closes it.
    useEffect(() => setOpen(false), [pathname]);
    const menu = useRef<HTMLDivElement>(null);
    // Opens on the current page, however far down the list.
    useEffect(() => {
        if (open) menu.current?.querySelector('[aria-current=page]')?.scrollIntoView({ block: 'center' });
    }, [open]);
    return (
        <div className="md:hidden">
            <Button variant="icon" size="icon" aria-label="Menu" onClick={() => setOpen(true)}>
                <Bars className="size-5" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen} side="left" title="Zen">
                <div ref={menu}>
                    <Sidebar storybook />
                </div>
            </Dialog>
        </div>
    );
}
