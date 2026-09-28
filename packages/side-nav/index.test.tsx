import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import SideNav, { SideNavGroup, SideNavLink } from './index';

describe('SideNav', () => {
    it('groups links under titles and marks the current page', () => {
        render(
            <SideNav aria-label="Docs">
                <SideNavGroup title="Components">
                    <SideNavLink href="/button" active>
                        Button
                    </SideNavLink>
                    <SideNavLink href="/card">Card</SideNavLink>
                </SideNavGroup>
            </SideNav>,
        );
        expect(screen.getByRole('navigation', { name: 'Docs' })).toHaveTextContent('Components');
        expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Card' })).not.toHaveAttribute('aria-current');
    });

    it('styles a router link with asChild, which may set aria-current itself', () => {
        const RouterLink = ({ to, ...props }: ComponentProps<'a'> & { to: string }) => (
            <a href={to} aria-current="page" {...props} />
        );
        render(
            <SideNavLink asChild className="extra">
                <RouterLink to="/tabs">Tabs</RouterLink>
            </SideNavLink>,
        );
        const link = screen.getByRole('link', { name: 'Tabs' });
        expect(link).toHaveAttribute('href', '/tabs');
        expect(link).toHaveAttribute('aria-current', 'page');
        expect(link).toHaveClass('extra', 'rounded-lg');
    });
});
