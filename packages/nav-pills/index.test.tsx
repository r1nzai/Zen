import { render, screen, waitFor } from '@testing-library/react';
import { ComponentProps } from 'react';

import NavPills, { NavPill, NavPillIndicator } from './index';

describe('NavPills', () => {
    it('is a labelled nav of links, the active one marked as the current page', () => {
        render(
            <NavPills aria-label="Main">
                <NavPill href="/month" active>
                    Month
                </NavPill>
                <NavPill href="/goals">Goals</NavPill>
            </NavPills>,
        );
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Month' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Goals' })).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: 'Goals' })).toHaveAttribute('href', '/goals');
    });

    it('draws the pill only when added and a link is current', async () => {
        const { container, rerender } = render(
            <NavPills>
                <NavPill href="/a" active>
                    A
                </NavPill>
            </NavPills>,
        );
        expect(container.querySelector('[aria-hidden]')).toBeNull();
        rerender(
            <NavPills>
                <NavPillIndicator />
                <NavPill href="/a">A</NavPill>
            </NavPills>,
        );
        await waitFor(() => expect(container.querySelector('[aria-hidden]')).toBeNull());
        rerender(
            <NavPills>
                <NavPillIndicator />
                <NavPill href="/a" active>
                    A
                </NavPill>
            </NavPills>,
        );
        // The track notices aria-current changes through a MutationObserver, which reports asynchronously.
        await waitFor(() => expect(container.querySelector('[aria-hidden]')).not.toBeNull());
    });

    it('styles a custom link with asChild, keeping its own props', () => {
        // Stands in for a router link, which renders its own <a>.
        const RouterLink = ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a href={to} {...props} />;
        render(
            <NavPills>
                <NavPill asChild active>
                    <RouterLink to="/trends" className="custom">
                        Trends
                    </RouterLink>
                </NavPill>
            </NavPills>,
        );
        const link = screen.getByRole('link', { name: 'Trends' });
        expect(link).toHaveAttribute('href', '/trends');
        expect(link).toHaveAttribute('aria-current', 'page');
        expect(link).toHaveClass('custom', 'rounded-full');
    });

    it('lets the child set aria-current itself (e.g. React Router NavLink)', () => {
        render(
            <NavPills>
                <NavPill asChild>
                    <a href="/loans" aria-current="page">
                        Loans
                    </a>
                </NavPill>
            </NavPills>,
        );
        expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('aria-current', 'page');
    });
});
