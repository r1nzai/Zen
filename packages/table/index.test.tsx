import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import Table, {
    TableBody,
    TableCell,
    TableContainer,
    TableEmpty,
    TableFooter,
    TableFooterCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSpacerRow,
    useSort,
} from './index';

describe('Table', () => {
    it('is a real table in a lit, solid panel', () => {
        const { container } = render(
            <TableContainer className="max-h-80">
                <Table className="min-w-96">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prop</TableHead>
                            <TableHead numeric>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>size</TableCell>
                            <TableCell numeric>12</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>,
        );
        expect(container.firstChild).toHaveClass('bg-card', 'glow-edge', 'overflow-auto', 'max-h-80');
        expect(screen.getByRole('table')).toHaveClass('min-w-96');
        expect(screen.getByRole('columnheader', { name: 'Prop' })).toHaveClass('sticky', 'top-0');
        expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass('text-right');
        expect(screen.getByRole('cell', { name: '12' })).toHaveClass('tabular-nums');
    });

    it('a labelled container is a focusable region', () => {
        render(<TableContainer label="Schedule" />);
        expect(screen.getByRole('region', { name: 'Schedule' })).toHaveAttribute('tabindex', '0');
    });

    it('keeps the first column and the footer in view', () => {
        render(
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell sticky="left">Rent</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableFooterCell sticky="left">Total</TableFooterCell>
                    </TableRow>
                </TableFooter>
            </Table>,
        );
        expect(screen.getByRole('cell', { name: 'Rent' })).toHaveClass('sticky', 'left-0', 'bg-card');
        expect(screen.getByRole('cell', { name: 'Total' }).closest('tfoot')).toHaveClass('sticky', 'bottom-0');
    });

    it('spacer rows hold scrolled-out space, and vanish at zero', () => {
        const { container, rerender } = render(
            <table>
                <tbody>
                    <TableSpacerRow height={360} colSpan={3} />
                </tbody>
            </table>,
        );
        expect(container.querySelector('td')).toHaveStyle({ height: '360px' });
        expect(container.querySelector('tr')).toHaveAttribute('aria-hidden', 'true');
        rerender(
            <table>
                <tbody>
                    <TableSpacerRow height={0} colSpan={3} />
                </tbody>
            </table>,
        );
        expect(container.querySelector('tr')).toBeNull();
    });

    it('shows an empty message across the table', () => {
        render(
            <table>
                <tbody>
                    <TableEmpty colSpan={4} />
                </tbody>
            </table>,
        );
        expect(screen.getByRole('cell', { name: 'Nothing here yet.' })).toHaveAttribute('colspan', '4');
    });
});

describe('useSort', () => {
    const rows = [{ n: 2 }, { n: 3 }, { n: 1 }];
    const compare = { n: (a: { n: number }, b: { n: number }) => a.n - b.n };

    it('sorts ascending, then descending, then back to the original order', () => {
        const { result } = renderHook(() => useSort(rows, compare));
        expect(result.current.rows.map((r) => r.n)).toEqual([2, 3, 1]);
        act(() => result.current.headProps('n').onSort());
        expect(result.current.rows.map((r) => r.n)).toEqual([1, 2, 3]);
        expect(result.current.headProps('n').sortDirection).toBe('asc');
        act(() => result.current.headProps('n').onSort());
        expect(result.current.rows.map((r) => r.n)).toEqual([3, 2, 1]);
        act(() => result.current.headProps('n').onSort());
        expect(result.current.rows.map((r) => r.n)).toEqual([2, 3, 1]);
        expect(result.current.headProps('n').sortDirection).toBeUndefined();
    });

    it('makes a sortable heading a button that announces its order', () => {
        function Sorted() {
            const sort = useSort(rows, compare);
            return (
                <table>
                    <thead>
                        <tr>
                            <TableHead {...sort.headProps('n')}>Amount</TableHead>
                        </tr>
                    </thead>
                </table>
            );
        }
        render(<Sorted />);
        fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
        expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending');
        expect(screen.getByRole('columnheader')).toHaveTextContent('▲');
    });
});
