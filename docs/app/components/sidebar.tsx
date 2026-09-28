import { cx } from '@rinzai/zen';
import { NavLink } from 'react-router';

import { COMPONENTS, componentPath } from '../pages';

const GROUPS = [
    {
        title: 'Get started',
        links: [
            { to: '/', label: 'Introduction' },
            { to: '/showcase', label: 'Showcase' },
        ],
    },
    { title: 'Components', links: COMPONENTS.map((c) => ({ to: componentPath(c.slug), label: c.title })) },
];

export function Sidebar() {
    return (
        <nav aria-label="Docs" className="flex flex-col gap-6">
            {GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-1">
                    <span className="text-muted-foreground px-3 pb-1 text-[0.68rem] tracking-[0.1em] uppercase">
                        {group.title}
                    </span>
                    {group.links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({ isActive }) =>
                                cx(
                                    'rounded-lg px-3 py-1.5 text-sm transition-colors duration-200',
                                    isActive
                                        ? 'bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)]'
                                        : 'text-muted-foreground hover:bg-tint/[0.05] hover:text-foreground',
                                )
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </div>
            ))}
        </nav>
    );
}
