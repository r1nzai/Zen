import { render, screen } from '@testing-library/react';

import PageTransition from './index';

describe('PageTransition', () => {
    it('marks the page for its view-transition layer, keeping your styles', () => {
        render(
            <PageTransition className="p-4" style={{ color: 'red' }}>
                Page
            </PageTransition>,
        );
        const page = screen.getByText('Page');
        expect(page).toHaveClass('zen__page-transition', 'p-4');
        // Named only during a transition (theme.css), so it isn't a backdrop root the rest of the time.
        expect(page.style.viewTransitionName).toBe('');
        expect(page).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
});
