import { fireEvent, render, screen } from '@testing-library/react';

import { followSectionLink } from './section-link';

describe('followSectionLink', () => {
    let scrollIntoView: ReturnType<typeof vi.fn<Element['scrollIntoView']>>;
    beforeEach(() => {
        scrollIntoView = vi.fn<Element['scrollIntoView']>();
        Element.prototype.scrollIntoView = scrollIntoView;
        history.replaceState(null, '', '/');
    });
    afterEach(() => {
        document.documentElement.classList.remove('reduce-motion');
        delete (Element.prototype as Partial<Element>).scrollIntoView;
    });

    const page = () =>
        render(
            <>
                <a href="#usage" onClick={followSectionLink}>
                    Usage
                </a>
                <h2 id="usage">Usage</h2>
            </>,
        );

    it('scrolls smoothly to the section, puts its #id in the address (no new history entry) and moves focus there', () => {
        page();
        const { length } = history;
        const heading = screen.getByRole('heading');
        expect(fireEvent.click(screen.getByRole('link'))).toBe(false);
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        expect(location.hash).toBe('#usage');
        expect(history.length).toBe(length);
        expect(heading).toHaveFocus();
        expect(heading).toHaveAttribute('tabindex', '-1');
    });

    it('jumps without motion when motion is reduced', () => {
        document.documentElement.classList.add('reduce-motion');
        page();
        fireEvent.click(screen.getByRole('link'));
        expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
    });

    it('leaves opening in a new tab, and links to nothing on the page, to the browser', () => {
        page();
        expect(fireEvent.click(screen.getByRole('link'), { ctrlKey: true })).toBe(true);
        render(
            <a href="#elsewhere" onClick={followSectionLink}>
                Elsewhere
            </a>,
        );
        expect(fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))).toBe(true);
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});
