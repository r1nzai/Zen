import { SideNav, SideNavGroup, SideNavLink } from '@rinzai/zen';
import { NavLink, useLocation } from 'react-router';

import { componentPath, componentsFor, homePath, type Platform, platformOf, showcasePath } from '../pages';

const groups = (platform: Platform) => [
    {
        title: 'Get started',
        links: [
            { to: homePath(platform), label: 'Introduction' },
            { to: showcasePath('', platform), label: 'Showcase' },
        ],
    },
    {
        title: 'Components',
        links: componentsFor(platform).map((c) => ({ to: componentPath(c.slug, platform), label: c.title })),
    },
];

/** `storybook`: a link to it too, for where the header has no room for one. */
export function Sidebar({ storybook = false }: { storybook?: boolean }) {
    const GROUPS = groups(platformOf(useLocation().pathname));
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
                    {storybook && group === GROUPS[0] && (
                        // A full page load: Storybook is a separate app served from /storybook.
                        <SideNavLink asChild>
                            <a href="/storybook/">Storybook</a>
                        </SideNavLink>
                    )}
                </SideNavGroup>
            ))}
        </SideNav>
    );
}
