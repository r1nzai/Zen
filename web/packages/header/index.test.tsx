import { fireEvent, render, screen } from '@testing-library/react';

import Header from './index';

describe('Header', () => {
    it('starts with a link that skips to the page’s main content', () => {
        render(
            <>
                <Header>
                    <a href="/docs">Docs</a>
                </Header>
                <main>Content</main>
            </>,
        );
        const skip = screen.getByRole('link', { name: 'Skip to content' });
        expect(skip.compareDocumentPosition(screen.getByRole('link', { name: 'Docs' }))).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        fireEvent.click(skip);
        const main = screen.getByRole('main');
        expect(main).toHaveFocus();
        // Reachable by the link only, not by tabbing.
        expect(main).toHaveAttribute('tabindex', '-1');
    });

    it('takes another label, or none', () => {
        const { rerender } = render(<Header skipLabel="Zum Inhalt" />);
        expect(screen.getByRole('link', { name: 'Zum Inhalt' })).toBeInTheDocument();
        rerender(<Header skipLabel={null} />);
        expect(screen.queryByRole('link')).toBeNull();
    });
});
