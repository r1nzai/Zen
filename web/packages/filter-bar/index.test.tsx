import { fireEvent, render, screen } from '@testing-library/react';

import FilterBar, { FilterChip } from './index';

describe('FilterBar', () => {
    it('renders nothing with no filters', () => {
        const { container } = render(<FilterBar onClear={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('removes a filter with its ×; Clear all only once there are two', () => {
        const onRemove = vi.fn();
        const onClear = vi.fn();
        const { rerender } = render(
            <FilterBar onClear={onClear}>
                <FilterChip onRemove={onRemove} removeLabel="Remove amount filter">
                    Amount: $50–$500
                </FilterChip>
            </FilterBar>,
        );
        expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('Amount: $50–$500');
        expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Remove amount filter' }));
        expect(onRemove).toHaveBeenCalledOnce();

        rerender(
            <FilterBar onClear={onClear}>
                <FilterChip onRemove={onRemove}>Amount: $50–$500</FilterChip>
                <FilterChip onRemove={onRemove}>Tag: Shared</FilterChip>
            </FilterBar>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
        expect(onClear).toHaveBeenCalledOnce();
    });

    it('a removed chip fades out where it was, out of reach, then goes', () => {
        const fade = { onfinish: null as null | (() => void), oncancel: null };
        const animate = vi.fn(() => fade);
        Element.prototype.animate = animate as unknown as Element['animate'];
        const bar = (tags: string[]) => (
            <FilterBar>
                {tags.map((t) => (
                    <FilterChip key={t} onRemove={() => {}}>
                        {t}
                    </FilterChip>
                ))}
            </FilterBar>
        );
        const { rerender } = render(bar(['Amount', 'Tag']));
        rerender(bar(['Tag']));
        const ghost = screen.getByText('Amount', { exact: false });
        expect(ghost).toHaveAttribute('aria-hidden', 'true');
        expect(ghost).toHaveStyle({ position: 'absolute' });
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(animate).toHaveBeenCalledWith({ opacity: [1, 0], scale: [1, 0.9] }, expect.anything());
        fade.onfinish!();
        expect(screen.queryByText('Amount', { exact: false })).toBeNull();
        delete (Element.prototype as Partial<Element>).animate;
    });
});
