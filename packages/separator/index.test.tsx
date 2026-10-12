import { render, screen } from '@testing-library/react';

import Separator from './index';

describe('Separator', () => {
    it('is a horizontal separator by default', () => {
        render(<Separator />);
        const el = screen.getByRole('separator');
        expect(el).not.toHaveAttribute('aria-orientation');
        expect(el).toHaveClass('h-px', 'w-full');
    });

    it('says when it is upright', () => {
        render(<Separator orientation="vertical" />);
        expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('a decorative one is hidden from screen readers', () => {
        render(<Separator decorative />);
        expect(screen.queryByRole('separator')).toBeNull();
    });
});
