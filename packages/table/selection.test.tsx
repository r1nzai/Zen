import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import Table, {
    SelectionBar,
    TableBody,
    TableHeader,
    TableRow,
    TableSelectCell,
    TableSelectHead,
    useSelection,
} from './index';

function Entries({ initial = ['Rent', 'Groceries', 'Train', 'Dinner'] }) {
    const [rows, setRows] = useState(initial);
    const selection = useSelection(rows);
    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableSelectHead {...selection.allProps()} />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => (
                        <TableRow key={r} selected={selection.selected.has(r)}>
                            <TableSelectCell label={`Select ${r}`} {...selection.rowProps(r)} />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <SelectionBar count={selection.selected.size} onClear={selection.clear}>
                <button type="button" onClick={() => setRows((rs) => rs.filter((r) => !selection.selected.has(r)))}>
                    Delete
                </button>
            </SelectionBar>
        </>
    );
}
const box = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name });
const click = (name: string, shiftKey = false) => fireEvent.click(box(name), { shiftKey });

describe('Row selection', () => {
    it('selects rows one by one, marks them, and shows the bar with the count', () => {
        render(<Entries />);
        expect(screen.queryByRole('toolbar')).toBeNull();
        click('Select Rent');
        click('Select Train');
        expect(box('Select Rent')).toBeChecked();
        expect(box('Select Rent').closest('tr')).toHaveAttribute('data-selected');
        expect(screen.getByRole('toolbar', { name: 'Selection' })).toHaveTextContent('2 selected');
        expect(box('Select all')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('shift-click selects everything between', () => {
        render(<Entries />);
        click('Select Rent');
        click('Select Train', true);
        expect(['Rent', 'Groceries', 'Train', 'Dinner'].map((r) => box(`Select ${r}`).checked)).toEqual([
            true,
            true,
            true,
            false,
        ]);
    });

    it('selects all, then none; clearing hides the bar', () => {
        render(<Entries />);
        click('Select all');
        expect(screen.getByRole('toolbar')).toHaveTextContent('4 selected');
        click('Select all');
        expect(screen.queryByRole('toolbar')).toBeNull();
        click('Select Dinner');
        fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
        expect(box('Select Dinner')).not.toBeChecked();
    });

    it('rows that go away leave the selection', () => {
        render(<Entries />);
        click('Select Rent');
        click('Select Groceries');
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(screen.queryByRole('toolbar')).toBeNull();
        expect(box('Select all')).not.toBeChecked();
    });
});
