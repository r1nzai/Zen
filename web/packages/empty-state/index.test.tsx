import { render, screen } from '@testing-library/react';

import EmptyState from './index';

describe('EmptyState', () => {
    it('shows the title, what to do, and the action', () => {
        render(
            <EmptyState icon={<svg data-testid="icon" />} title="No entries" description="Add one to start.">
                <button>Add entry</button>
            </EmptyState>,
        );
        expect(screen.getByText('No entries')).toBeInTheDocument();
        expect(screen.getByText('Add one to start.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument();
        // Decoration only.
        expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    });
});
