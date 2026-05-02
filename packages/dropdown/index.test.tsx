import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dropdown from './index';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

/**
 * Replace the real virtualizer with a trivial implementation that renders
 * every item without any scroll/intersection magic.  This lets us query
 * list items directly without scrolling the container.
 */
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => ({
        getTotalSize: () => count * estimateSize(),
        getVirtualItems: () =>
            Array.from({ length: count }, (_, i) => ({
                key: i,
                index: i,
                start: i * estimateSize(),
                size: estimateSize(),
            })),
    }),
}));

/**
 * jsdom does not implement ResizeObserver — provide a no-op stub so that the
 * Collapse component's `new ResizeObserver(cb)` call does not throw.
 * vi.fn() with an arrow-function implementation is NOT a valid constructor in
 * Vitest v4; using a class avoids the "is not a constructor" error.
 */
global.ResizeObserver = class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
} as unknown as typeof ResizeObserver;

/**
 * The Collapse component measures text widths via an offscreen Canvas context.
 * Return a fixed width of 50px for every string so the maths is deterministic.
 */
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    font: '',
    measureText: vi.fn(() => ({ width: 50 })),
})) as never;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const defaultItems = [
    { text: 'Item 1', key: 'item1' },
    { text: 'Item 2', key: 'item2' },
    { text: 'Item 3', key: 'item3' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dropdown', () => {
    // ── 1. Single-select: shows selected text ───────────────────────────────
    it('shows the selected item text in the trigger button (single-select)', () => {
        render(<Dropdown items={defaultItems} selected={{ text: 'Item 1', key: 'item1' }} onChange={vi.fn()} />);

        // In single-select mode there is exactly one <button> (the popover
        // trigger).  Its text content should reflect the selected item.
        expect(screen.getByRole('button')).toHaveTextContent('Item 1');
    });

    // ── 2. Single-select: shows placeholder ─────────────────────────────────
    it('shows the placeholder when no text is present on the selected item (single-select)', () => {
        // Pass `text: undefined` (cast away TS strictness) so that the
        // `selected.text ?? placeholder` branch resolves to the placeholder.
        render(
            <Dropdown
                items={defaultItems}
                selected={{ text: undefined as unknown as string, key: '' }}
                onChange={vi.fn()}
                placeholder="Pick an item"
            />,
        );

        expect(screen.getByRole('button')).toHaveTextContent('Pick an item');
    });

    // ── 3. Disabled ──────────────────────────────────────────────────────────
    it('applies cursor-not-allowed class to the trigger button when disabled', () => {
        render(
            <Dropdown items={defaultItems} selected={{ text: 'Item 1', key: 'item1' }} onChange={vi.fn()} disabled />,
        );

        expect(screen.getByRole('button')).toHaveClass('cursor-not-allowed');
    });

    // ── 4. Search filters items ──────────────────────────────────────────────
    it('filters the visible list items when the user types in the search box', async () => {
        const user = userEvent.setup();

        render(<Dropdown items={defaultItems} selected={{ text: 'Item 1', key: 'item1' }} onChange={vi.fn()} />);

        // The search <input> is always rendered inside the popover panel
        // regardless of whether the panel is open — query it directly.
        await user.type(screen.getByPlaceholderText('Search'), 'Item 2');

        // 'Item 2' must be in the list; 'Item 3' must no longer be there.
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
    });

    // ── 5. Single-select: onChange ───────────────────────────────────────────
    it('calls onChange with the clicked item object in single-select mode', () => {
        const onChange = vi.fn();

        render(<Dropdown items={defaultItems} selected={{ text: 'Item 1', key: 'item1' }} onChange={onChange} />);

        // 'Item 2' only appears in the <li> items (the trigger shows 'Item 1'),
        // so getByText is unambiguous here.
        fireEvent.click(screen.getByText('Item 2'));

        expect(onChange).toHaveBeenCalledWith({ text: 'Item 2', key: 'item2' });
    });

    // ── 6. Multi-select: badge chips ─────────────────────────────────────────
    it('renders a badge chip for every selected item in multi-select mode', () => {
        // Use 'A' / 'B' as labels — they don't overlap with defaultItems text
        // ('Item 1' … 'Item 3'), so getByText is unambiguous.
        render(
            <Dropdown
                items={defaultItems}
                selected={[
                    { text: 'A', key: 'a' },
                    { text: 'B', key: 'b' },
                ]}
                onChange={vi.fn()}
                multiple
            />,
        );

        // After mount, jsdom's offsetWidth === 0 causes Collapse to move all
        // chips into its "hidden" bucket, which it renders inside a Popover div
        // that is always present in the DOM — so the text remains queryable.
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    // ── 7. Multi-select: deselect ────────────────────────────────────────────
    it('calls onChange with the item removed when clicking an already-selected item (deselect)', () => {
        const onChange = vi.fn();

        render(
            <Dropdown
                items={defaultItems}
                selected={[
                    { text: 'Item 1', key: 'item1' },
                    { text: 'Item 2', key: 'item2' },
                ]}
                onChange={onChange}
                multiple
            />,
        );

        // 'Item 1' appears in two places: as a badge chip <span> (inside the
        // Collapse Popover, which lives inside the trigger <button>) AND as an
        // <li> in the dropdown panel.  getByText would throw on the ambiguity,
        // so we grab all matches and pick the list-item element explicitly.
        const liItem1 = screen.getAllByText('Item 1').find((el) => el.tagName === 'LI')!;
        fireEvent.click(liItem1);

        expect(onChange).toHaveBeenCalledWith([{ text: 'Item 2', key: 'item2' }]);
    });

    // ── 8. Multi-select: add ─────────────────────────────────────────────────
    it('calls onChange with the new item appended when clicking an unselected item (add)', () => {
        const onChange = vi.fn();

        render(
            <Dropdown
                items={defaultItems}
                selected={[{ text: 'Item 1', key: 'item1' }]}
                onChange={onChange}
                multiple
            />,
        );

        // With only 'Item 1' selected, 'Item 2' only appears in the <li>
        // (not in any badge chip), so getByText is unambiguous here.
        fireEvent.click(screen.getByText('Item 2'));

        expect(onChange).toHaveBeenCalledWith([
            { text: 'Item 1', key: 'item1' },
            { text: 'Item 2', key: 'item2' },
        ]);
    });

    // ── 9. Mutable: shows "Add {term}" option ───────────────────────────────
    it('shows an "Add {term}" list item when mutable and the search term has no matches', async () => {
        const user = userEvent.setup();

        render(
            <Dropdown
                items={defaultItems}
                selected={{ text: 'Item 1', key: 'item1' }}
                onChange={vi.fn()}
                mutable
                onAdd={vi.fn()}
            />,
        );

        await user.type(screen.getByPlaceholderText('Search'), 'xyz');

        expect(screen.getByText('Add xyz')).toBeInTheDocument();
    });

    // ── 10. Mutable: onAdd called ────────────────────────────────────────────
    it('calls onAdd with { text, key } matching the typed term when "Add {term}" is clicked', async () => {
        const user = userEvent.setup();
        const onAdd = vi.fn();

        render(
            <Dropdown
                items={defaultItems}
                selected={{ text: 'Item 1', key: 'item1' }}
                onChange={vi.fn()}
                mutable
                onAdd={onAdd}
            />,
        );

        await user.type(screen.getByPlaceholderText('Search'), 'xyz');
        fireEvent.click(screen.getByText('Add xyz'));

        expect(onAdd).toHaveBeenCalledWith({ text: 'xyz', key: 'xyz' });
    });
});
