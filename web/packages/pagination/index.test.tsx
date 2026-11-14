import { fireEvent, render, screen } from '@testing-library/react';

import Pagination, { pageRange } from './index';

describe('pageRange', () => {
    it('keeps the first, the last and those around the page, with gaps between', () => {
        expect(pageRange(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12]);
        expect(pageRange(1, 5)).toEqual([1, 2, 'gap', 5]);
        // A single skipped page shows as itself.
        expect(pageRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(pageRange(2, 2)).toEqual([1, 2]);
    });
});

describe('Pagination', () => {
    it('moves between pages and marks the current one', () => {
        const onPageChange = vi.fn();
        render(<Pagination page={1} count={3} onPageChange={onPageChange} />);
        expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
        fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
        expect(onPageChange.mock.calls).toEqual([[2], [3]]);
    });

    it('renders links with href, through renderLink', () => {
        render(
            <Pagination
                page={2}
                count={3}
                href={(p) => `?page=${p}`}
                renderLink={(props, page) => <a {...props} data-page={page} />}
            />,
        );
        expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('href', '?page=3');
        expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute('data-page', '3');
    });

    it('shows nothing for a single page', () => {
        const { container } = render(<Pagination page={1} count={1} />);
        expect(container).toBeEmptyDOMElement();
    });
});
