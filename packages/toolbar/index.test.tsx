import { fireEvent, render, screen } from '@testing-library/react';

import Button from '@zen/button';
import ToggleGroup, { ToggleGroupItem } from '@zen/toggle-group';

import Toolbar, { ToolbarSeparator } from './index';

function Example() {
    return (
        <Toolbar aria-label="Entries">
            <ToggleGroup aria-label="View" defaultValue="list">
                <ToggleGroupItem value="table">Table</ToggleGroupItem>
                <ToggleGroupItem value="list">List</ToggleGroupItem>
            </ToggleGroup>
            <ToolbarSeparator />
            <Button>Filter</Button>
            <input aria-label="Search" />
        </Toolbar>
    );
}
const control = (name: string) => screen.getByRole('button', { name });

describe('Toolbar', () => {
    it('is a named toolbar with one tab stop', () => {
        render(<Example />);
        expect(screen.getByRole('toolbar', { name: 'Entries' })).toBeInTheDocument();
        const stops = [control('Table'), control('List'), control('Filter'), screen.getByRole('textbox')].filter(
            (el) => el.tabIndex === 0,
        );
        expect(stops).toEqual([control('Table')]);
    });

    it('arrow keys move through every control, a toggle group’s items included', () => {
        render(<Example />);
        control('Table').focus();
        fireEvent.keyDown(control('Table'), { key: 'ArrowRight' });
        expect(control('List')).toHaveFocus();
        fireEvent.keyDown(control('List'), { key: 'ArrowRight' });
        expect(control('Filter')).toHaveFocus();
        expect(control('Filter')).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(control('Filter'), { key: 'Home' });
        expect(control('Table')).toHaveFocus();
    });

    it("leaves the arrow keys to a text field's caret", () => {
        render(<Example />);
        const search = screen.getByRole('textbox');
        search.focus();
        fireEvent.keyDown(search, { key: 'ArrowLeft' });
        expect(search).toHaveFocus();
    });

    it('its separator stands across its direction', () => {
        render(<Example />);
        expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    });
});
