import { Pill, PillIndicator, Pills } from '@rinzai/zen';
import { Link, useLocation } from 'react-router';

const APPS = [
    { to: '/showcase/', label: 'Budget' },
    { to: '/showcase/music/', label: 'Music' },
];

/** Between the showcase apps. */
export function ShowcaseNav() {
    const { pathname } = useLocation();
    return (
        <nav aria-label="Showcase apps" className="mx-auto flex max-w-6xl px-6 pt-6 md:px-10 md:pt-10">
            <Pills>
                <PillIndicator />
                {APPS.map((app) => (
                    <Pill key={app.to} asChild active={pathname === app.to}>
                        <Link to={app.to}>{app.label}</Link>
                    </Pill>
                ))}
            </Pills>
        </nav>
    );
}
