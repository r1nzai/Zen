import { render, screen } from '@testing-library/react';

import Collapse from './index';

const ITEMS = ['Alpha', 'Beta', 'Gamma', 'Delta'];

/**
 * jsdom has no layout: give each item a width of 50, the "+N" button 30, and
 * the row `room`, so the component's measuring sees a real layout.
 */
function layout(room: number) {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
        if (this.hasAttribute('data-collapse-item')) return 50;
        if (this.hasAttribute('data-collapse-more')) return 30;
        return 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(room);
}

const tags = (moreLabel?: string) => (
    <Collapse items={ITEMS} moreLabel={moreLabel}>
        {(item) => <span>{item}</span>}
    </Collapse>
);

describe('Collapse', () => {
    afterEach(() => vi.restoreAllMocks());

    it('shows every item when they all fit, with no "+N"', () => {
        layout(200);
        render(tags());
        for (const item of ITEMS) expect(screen.getByText(item)).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('shows as many as fit beside the "+N" button, the rest behind it', () => {
        // 2 items (100) + "+N" (30) fit in 140; a third would need 180.
        layout(140);
        render(tags());
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        const more = screen.getByRole('button', { name: 'Show 2' });
        expect(more).toHaveTextContent('+2');
        // The hidden ones are in its popover.
        expect(screen.getByRole('dialog', { hidden: true })).toHaveTextContent('GammaDelta');
    });

    it('uses the row gap it measures', () => {
        layout(140);
        const style = vi.spyOn(window, 'getComputedStyle');
        style.mockImplementation(() => ({ columnGap: '10px' }) as CSSStyleDeclaration);
        render(tags());
        // 50 + 10 + 30 = 90 fits; 50 + 10 + 50 + 10 + 30 = 150 doesn't.
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Beta', { selector: '[data-collapse-item] *' })).toBeNull();
        expect(screen.getByRole('button')).toHaveTextContent('+3');
    });

    it('puts the label after the count', () => {
        layout(140);
        render(tags('tags'));
        expect(screen.getByRole('button', { name: 'Show 2 tags' })).toHaveTextContent('+2 tags');
    });

    it('hands each item its index and data', () => {
        layout(200);
        const children = vi.fn((item: string) => <span>{item}</span>);
        render(
            <Collapse items={['a', 'b']} data={[1, 2]}>
                {children}
            </Collapse>,
        );
        expect(children).toHaveBeenCalledWith('a', 0, 1);
        expect(children).toHaveBeenCalledWith('b', 1, 2);
    });
});
