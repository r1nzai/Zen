import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import TabBar, { TabBarItem } from './index';

describe('TabBar', () => {
    it('is a nav of evenly spread links, the current one marked', () => {
        render(
            <TabBar aria-label="Main">
                <TabBarItem href="/month" icon={<svg />} active>
                    Month
                </TabBarItem>
                <TabBarItem href="/goals" icon={<svg />}>
                    Goals
                </TabBarItem>
            </TabBar>,
        );
        const nav = screen.getByRole('navigation', { name: 'Main' });
        expect(nav).toHaveClass('fixed', 'bottom-0', 'md:hidden');
        expect((nav.firstChild as HTMLElement).style.gridTemplateColumns).toBe('repeat(2, 1fr)');
        expect(screen.getByRole('link', { name: 'Month' })).toHaveAttribute('aria-current', 'page');
    });

    it('can always show, and style a router link', () => {
        const Link = ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a href={to} {...props} />;
        render(
            <TabBar hideFrom={false}>
                <TabBarItem asChild active>
                    <Link to="/planner">Planner</Link>
                </TabBarItem>
            </TabBar>,
        );
        expect(screen.getByRole('navigation')).not.toHaveClass('md:hidden');
        expect(screen.getByRole('link', { name: 'Planner' })).toHaveAttribute('href', '/planner');
        expect(screen.getByRole('link', { name: 'Planner' })).toHaveAttribute('aria-current', 'page');
    });
});
