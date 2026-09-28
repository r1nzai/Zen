import { SideNav, SideNavGroup, SideNavLink } from '@rinzai/zen';
import { NavLink } from 'react-router';

import { COMPONENTS, componentPath } from '../pages';

const GROUPS = [
    {
        title: 'Get started',
        links: [
            { to: '/', label: 'Introduction' },
            { to: '/showcase/', label: 'Showcase' },
        ],
    },
    { title: 'Components', links: COMPONENTS.map((c) => ({ to: componentPath(c.slug), label: c.title })) },
];

export function Sidebar() {
    return (
        <SideNav aria-label="Docs">
            {GROUPS.map((group) => (
                <SideNavGroup key={group.title} title={group.title}>
                    {group.links.map((link) => (
                        // NavLink sets aria-current on the current page; SideNavLink styles it.
                        <SideNavLink key={link.to} asChild>
                            <NavLink to={link.to} end>
                                {link.label}
                            </NavLink>
                        </SideNavLink>
                    ))}
                </SideNavGroup>
            ))}
        </SideNav>
    );
}
