import { SideNav, SideNavGroup, SideNavLink } from '@rinzai/zen';
import { useState } from 'react';

const GROUPS = [
    { title: 'Account', links: ['Profile', 'Security', 'Passkeys'] },
    { title: 'Workspace', links: ['Members', 'Billing', 'Integrations'] },
];

/** With a router, pass its link as the child: <SideNavLink asChild><NavLink to="/billing">Billing</NavLink></SideNavLink>. */
export default function Default() {
    const [current, setCurrent] = useState('Security');
    return (
        <SideNav aria-label="Settings" className="w-56">
            {GROUPS.map((group) => (
                <SideNavGroup key={group.title} title={group.title}>
                    {group.links.map((link) => (
                        <SideNavLink
                            key={link}
                            href={`#${link.toLowerCase()}`}
                            active={link === current}
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrent(link);
                            }}
                        >
                            {link}
                        </SideNavLink>
                    ))}
                </SideNavGroup>
            ))}
        </SideNav>
    );
}
