import { Button, buttonVariants, Header, NavPill, NavPillIndicator, NavPills, Popover, ThemeToggle } from '@rinzai/zen';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

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
                </div>
                <NavPills aria-label="Main" className="hidden md:block">
                    <NavPillIndicator />
                    <NavPill asChild active={section === 'docs'}>
                        <Link to="/">Docs</Link>
                    </NavPill>
                    <NavPill asChild active={section === 'components'}>
                        <Link to="/components/button/">Components</Link>
                    </NavPill>
                    <NavPill asChild active={section === 'showcase'}>
                        <Link to="/showcase/">Showcase</Link>
                    </NavPill>
                </NavPills>
                <div className="flex items-center gap-1">
                    {/* A full page load: Storybook is a separate app served from /storybook. */}
                    <a href="/storybook/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                        Storybook
                    </a>
                    <a
                        href={GITHUB}
                        aria-label="GitHub"
                        className="text-muted-foreground hover:bg-tint/[0.06] hover:text-foreground grid size-9 place-items-center rounded-lg"
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                    </a>
                    <ThemeToggle />
                </div>
            </div>
        </Header>
    );
}

/** Phones: the sidebar in a popover. */
function MobileMenu() {
    const [show, setShow] = useState(false);
    const { pathname } = useLocation();
    useEffect(() => setShow(false), [pathname]);
    return (
        <div className="md:hidden">
            <Popover
                triggerType="manual"
                show={show}
                setShow={setShow}
                role="dialog"
                content={
                    <div className="max-h-[70vh] w-64 overflow-y-auto p-3">
                        <Sidebar />
                    </div>
                }
            >
                <Button variant="icon" size="icon" aria-label="Menu">
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="size-4"
                        aria-hidden
                    >
                        <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
                    </svg>
                </Button>
            </Popover>
        </div>
    );
}
