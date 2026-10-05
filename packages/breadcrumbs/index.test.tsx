import { render, screen } from '@testing-library/react';

import Breadcrumbs, { Breadcrumb } from './index';

describe('Breadcrumbs', () => {
    it('lists the parents as links and marks the current page, which is not a link', () => {
        render(
            <Breadcrumbs>
                <Breadcrumb href="/budgets">Budgets</Breadcrumb>
                <Breadcrumb current>September</Breadcrumb>
            </Breadcrumbs>,
        );
        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(nav.querySelectorAll('li:not([aria-hidden])')).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'Budgets' })).toHaveAttribute('href', '/budgets');
        expect(screen.queryByRole('link', { name: 'September' })).toBeNull();
        expect(screen.getByText('September')).toHaveAttribute('aria-current', 'page');
    });

    it('styles your own link with asChild', () => {
        render(
            <Breadcrumbs>
                <Breadcrumb asChild>
                    <a href="/home" data-router>
                        Home
                    </a>
                </Breadcrumb>
            </Breadcrumbs>,
        );
        const link = screen.getByRole('link', { name: 'Home' });
        expect(link).toHaveAttribute('data-router');
        expect(link.className).toContain('hover:text-foreground');
    });
});
