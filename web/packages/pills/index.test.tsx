import { render, screen, waitFor } from '@testing-library/react';
import { ComponentProps } from 'react';
import { renderToString } from 'react-dom/server';

import Pills, { Pill, PillIndicator } from './index';

// The sliding pill, once measured (before that, only a pending marker).
const DRAWN = '.zen__pill-indicator:not([data-pending])';

describe('Pills', () => {
    it('adds no role of its own: wrapped in a nav, it is navigation with the current page marked', () => {
        render(
            <nav aria-label="Main">
                <Pills>
                    <Pill href="/month" active>
                        Month
                    </Pill>
                    <Pill href="/goals">Goals</Pill>
                </Pills>
            </nav>,
        );
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Month' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Goals' })).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: 'Goals' })).toHaveAttribute('href', '/goals');
        expect(screen.getByRole('link', { name: 'Month' }).parentElement).not.toHaveAttribute('role');
    });

    it('draws the pill only when added and a pill is active', async () => {
        const { container, rerender } = render(
            <Pills>
                <Pill href="/a" active>
                    A
                </Pill>
            </Pills>,
        );
        expect(container.querySelector(DRAWN)).toBeNull();
        rerender(
            <Pills>
                <PillIndicator />
                <Pill href="/a">A</Pill>
            </Pills>,
        );
        await waitFor(() => expect(container.querySelector(DRAWN)).toBeNull());
        rerender(
            <Pills>
                <PillIndicator />
                <Pill href="/a" active>
                    A
                </Pill>
            </Pills>,
        );
        await waitFor(() => expect(container.querySelector(DRAWN)).not.toBeNull());
    });

    it('before it is measured, leaves a marker for the active item to wear the pill (server HTML)', () => {
        const html = renderToString(
            <Pills>
                <PillIndicator />
                <Pill href="/a" active>
                    A
                </Pill>
            </Pills>,
        );
        expect(html).toContain('data-pending');
        expect(html).not.toContain('translate');
    });

    it('follows a current page set outside React (a router flipping aria-current)', async () => {
        const { container } = render(
            <Pills>
                <PillIndicator />
                <Pill asChild>
                    <a href="/a">A</a>
                </Pill>
            </Pills>,
        );
        expect(container.querySelector(DRAWN)).toBeNull();
        screen.getByRole('link', { name: 'A' }).setAttribute('aria-current', 'page');
        // Noticed through a MutationObserver, which reports asynchronously.
        await waitFor(() => expect(container.querySelector(DRAWN)).not.toBeNull());
    });

    it('styles a custom link with asChild, keeping its own props', () => {
        // Stands in for a router link, which renders its own <a>.
        const RouterLink = ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a href={to} {...props} />;
        render(
            <Pills>
                <Pill asChild active>
                    <RouterLink to="/trends" className="custom">
                        Trends
                    </RouterLink>
                </Pill>
            </Pills>,
        );
        const link = screen.getByRole('link', { name: 'Trends' });
        expect(link).toHaveAttribute('href', '/trends');
        expect(link).toHaveAttribute('aria-current', 'page');
        expect(link).toHaveClass('custom', 'rounded-full');
    });

    it('lets the child set aria-current itself (e.g. React Router NavLink)', () => {
        render(
            <Pills>
                <Pill asChild>
                    <a href="/loans" aria-current="page">
                        Loans
                    </a>
                </Pill>
            </Pills>,
        );
        expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('aria-current', 'page');
    });

    it('passes props and ref to the track', () => {
        let track: HTMLDivElement | null = null;
        render(
            <Pills
                ref={(node) => {
                    track = node;
                }}
                data-testid="track"
                className="extra"
            />,
        );
        expect(track).toBe(screen.getByTestId('track'));
        expect(track).toHaveClass('extra', 'rounded-full');
    });
});
