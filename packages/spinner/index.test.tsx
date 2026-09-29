import { render, screen } from '@testing-library/react';

import Spinner from './index';

describe('Spinner', () => {
    it('is hidden from screen readers without a label', () => {
        const { container } = render(<Spinner />);
        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('announces itself as a status with a label', () => {
        render(<Spinner label="Loading entries" />);
        expect(screen.getByRole('status', { name: 'Loading entries' })).not.toHaveAttribute('aria-hidden');
    });

    it('takes size and colour from className, replacing the default size', () => {
        const { container } = render(<Spinner className="text-primary size-8" />);
        expect(container.firstChild).toHaveClass('size-8', 'text-primary');
        expect(container.firstChild).not.toHaveClass('size-4');
    });
});
