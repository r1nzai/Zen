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
});
