import { act, fireEvent, render, screen } from '@testing-library/react';

import LoadMore from './index';

describe('LoadMore', () => {
    let seen: (visible: boolean) => void;
    beforeEach(() => {
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: IntersectionObserverCallback) {
                    seen = (visible) => cb([{ isIntersecting: visible } as IntersectionObserverEntry], this as never);
                }
                observe() {}
                disconnect() {}
            },
        );
    });
    afterEach(() => vi.unstubAllGlobals());

    it('loads when pressed, and when it comes into view', () => {
        const onLoadMore = vi.fn();
        render(<LoadMore hasMore onLoadMore={onLoadMore} />);
        fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
        expect(onLoadMore).toHaveBeenCalledTimes(1);
        act(() => seen(true));
        expect(onLoadMore).toHaveBeenCalledTimes(2);
    });

    it('shows it is loading, and asks no more meanwhile', () => {
        const onLoadMore = vi.fn();
        render(<LoadMore hasMore loading onLoadMore={onLoadMore} />);
        const button = screen.getByRole('button', { name: 'Loading more…' });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        act(() => seen(true));
        expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('is gone when there is no more', () => {
        const { container } = render(<LoadMore hasMore={false} onLoadMore={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });
});
