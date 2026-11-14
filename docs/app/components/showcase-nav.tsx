import { Pill, PillIndicator, Pills } from '@rinzai/zen';
import { Link, useLocation } from 'react-router';

import { platformOf, showcasePath } from '../pages';

const APPS = [
    { app: '', label: 'Budget' },
    { app: 'music', label: 'Music' },
] as const;

/** Between the showcase apps. */
export function ShowcaseNav() {
    const { pathname } = useLocation();
    const platform = platformOf(pathname);
    return (
        <nav aria-label="Showcase apps" className="mx-auto flex max-w-6xl px-6 pt-6 md:px-10 md:pt-10">
            <Pills>
                <PillIndicator />
                {APPS.map(({ app, label }) => {
                    const to = showcasePath(app, platform);
                    return (
                        <Pill key={app} asChild active={pathname === to}>
                            <Link to={to}>{label}</Link>
                        </Pill>
                    );
                })}
            </Pills>
        </nav>
    );
}
