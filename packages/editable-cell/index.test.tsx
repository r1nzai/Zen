import { fireEvent, render, screen } from '@testing-library/react';

import EditableCell from './index';

describe('EditableCell', () => {
    const editor = (close: () => void) => (
        <input
            aria-label="Amount"
            autoFocus
            onKeyDown={(e) => {
                if (e.key === 'Escape') close();
            }}
        />
    );

    it('shows the value as a button, and swaps in the editor on click', () => {
        render(
            <EditableCell label="Rent: ₹18,500" editor={editor}>
                ₹18,500
            </EditableCell>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Rent: ₹18,500. Edit' }));
        expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveFocus();
    });

    it('returns to the value when the editor closes', () => {
        render(<EditableCell editor={editor}>₹18,500</EditableCell>);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
        expect(screen.getByRole('button')).toHaveTextContent('₹18,500');
    });

    it('can be read-only, or controlled', () => {
        const onEditingChange = vi.fn();
        const { rerender } = render(
            <EditableCell readOnly editor={editor}>
                ₹0
            </EditableCell>,
        );
        expect(screen.queryByRole('button')).toBeNull();
        rerender(
            <EditableCell editing={false} onEditingChange={onEditingChange} editor={editor}>
                ₹0
            </EditableCell>,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onEditingChange).toHaveBeenCalledWith(true);
        expect(screen.queryByRole('textbox')).toBeNull(); // still controlled: not editing until the prop says so
    });
});
