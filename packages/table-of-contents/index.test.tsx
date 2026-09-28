import { act, render, screen } from '@testing-library/react';

import TableOfContents from './index';

describe('TableOfContents', () => {
    let callback: IntersectionObserverCallback;
    beforeEach(() => {
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback) {
                callback = cb;
            }
            observe = vi.fn();
            disconnect = vi.fn();
        } as unknown as typeof IntersectionObserver;
    });

    const items = [
        { id: 'install', label: 'Installation' },
        { id: 'usage', label: 'Usage', depth: 2 as const },
    ];

    it('links to each heading, nested ones indented', () => {
        render(<TableOfContents items={items} />);
        expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('href', '#usage');
        expect(screen.getByRole('link', { name: 'Usage' }).parentElement).toHaveClass('pl-3');
    });

    it('marks the section in view', () => {
        document.body.innerHTML = '<h2 id="install"></h2><h2 id="usage"></h2>';
        render(<TableOfContents items={items} />);
        act(() =>
            callback(
                [
                    {
                        target: document.getElementById('usage')!,
                        isIntersecting: true,
                    } as unknown as IntersectionObserverEntry,
                ],
                {} as IntersectionObserver,
            ),
        );
        expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('aria-current', 'location');
        expect(screen.getByRole('link', { name: 'Installation' })).not.toHaveAttribute('aria-current');
    });

    it('renders nothing without items', () => {
        const { container } = render(<TableOfContents items={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
