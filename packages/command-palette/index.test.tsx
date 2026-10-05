import { fireEvent, render, screen } from '@testing-library/react';

import CommandPalette, { type CommandItem, search, useCommandPaletteShortcut } from './index';

const items = (onSelect = vi.fn()): CommandItem[] => [
    { label: 'Entries', group: 'Pages', keywords: ['transactions'], onSelect },
    { label: 'Settings', group: 'Pages', onSelect },
    { label: 'Add entry', group: 'Actions', onSelect },
];

describe('search', () => {
    it('finds by every word, in labels, keywords and groups, labels starting with it first', () => {
        expect(search(items(), 'entr').map((i) => i.label)).toEqual(['Entries', 'Add entry']);
        expect(search(items(), 'transact').map((i) => i.label)).toEqual(['Entries']);
        expect(search(items(), 'add actions').map((i) => i.label)).toEqual(['Add entry']);
        expect(search(items(), '  ')).toHaveLength(3);
    });
});

describe('CommandPalette', () => {
    it('narrows as you type, moves with the arrows, and runs the item on Enter, closing', () => {
        const onSelect = vi.fn();
        const onOpenChange = vi.fn();
        const list = items(onSelect);
        render(<CommandPalette open onOpenChange={onOpenChange} items={list} />);
        const input = screen.getByRole('combobox');
        expect(input).toHaveFocus();
        expect(screen.getAllByRole('option')).toHaveLength(3);
        fireEvent.change(input, { target: { value: 'e' } });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
        expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id);
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSelect).toHaveBeenCalledOnce();
    });

    it('says when nothing matches, and starts afresh each time it opens', () => {
        const { rerender } = render(<CommandPalette open onOpenChange={() => {}} items={items()} empty="Nothing" />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
        expect(screen.getByText('Nothing')).toBeInTheDocument();
        rerender(<CommandPalette open={false} onOpenChange={() => {}} items={items()} />);
        rerender(<CommandPalette open onOpenChange={() => {}} items={items()} />);
        expect(screen.getByRole('combobox', { hidden: true })).toHaveValue('');
    });

    it('opens on ⌘K or Ctrl+K', () => {
        const open = vi.fn();
        function Host() {
            useCommandPaletteShortcut(open);
            return null;
        }
        render(<Host />);
        fireEvent.keyDown(window, { key: 'k', metaKey: true });
        fireEvent.keyDown(window, { key: 'K', ctrlKey: true });
        fireEvent.keyDown(window, { key: 'k' });
        expect(open).toHaveBeenCalledTimes(2);
    });
});
