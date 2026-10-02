import { render } from '@testing-library/react';
import Skeleton from './index';

describe('Skeleton', () => {
    it('is a decorative span, hidden from assistive tech', () => {
        const { container } = render(<Skeleton />);
        const el = container.firstChild as HTMLElement;
        expect(el.tagName.toLowerCase()).toBe('span');
        expect(el).toHaveAttribute('aria-hidden');
        expect(el).toHaveClass('zen__skeleton');
    });

    it('takes its size from className', () => {
        const { container } = render(<Skeleton className="h-4 w-24" />);
        expect(container.firstChild).toHaveClass('h-4', 'w-24');
    });
});
