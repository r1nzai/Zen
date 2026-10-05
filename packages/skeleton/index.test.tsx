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

describe('Skeleton with content', () => {
    const content = <p className="own">Balance</p>;

    it('stands in for its child while loading', () => {
        const { container } = render(<Skeleton loading>{content}</Skeleton>);
        expect(container.querySelector('.zen__skeleton')).toBeInTheDocument();
        expect(container).not.toHaveTextContent('Balance');
    });

    it('fades the child in once loaded', () => {
        const { container, rerender } = render(<Skeleton loading>{content}</Skeleton>);
        rerender(<Skeleton loading={false}>{content}</Skeleton>);
        expect(container.querySelector('.zen__skeleton')).toBeNull();
        expect(container.firstChild).toHaveClass('own', 'zen__reveal');
    });

    it('shows already-loaded content as it is', () => {
        const { container } = render(<Skeleton loading={false}>{content}</Skeleton>);
        expect(container.firstChild).toHaveClass('own');
        expect(container.firstChild).not.toHaveClass('zen__reveal');
    });
});
