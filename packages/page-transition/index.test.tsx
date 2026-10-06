import { render, screen } from '@testing-library/react';

import PageTransition from './index';

describe('PageTransition', () => {
    it('puts the page in its own view-transition layer, keeping your styles', () => {
        render(
            <PageTransition className="p-4" style={{ color: 'red' }}>
                Page
            </PageTransition>,
        );
        const page = screen.getByText('Page');
        expect(page).toHaveClass('zen__page-transition', 'p-4');
        expect(page.style.viewTransitionName).toBe('zen-page');
        expect(page).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});
