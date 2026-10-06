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
    it('is a real table in a lit glass panel', () => {
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
        // The glass panel is sized by className; the table scrolls inside it.
        expect(container.firstChild).toHaveClass('glass', 'glow-edge', 'max-h-80');
        expect(container.firstChild!.firstChild).toHaveClass('overflow-auto');
        expect(screen.getByRole('table')).toHaveClass('min-w-96');
        expect(screen.getByRole('columnheader', { name: 'Prop' }).closest('thead')).toHaveClass('sticky', 'top-0');
        expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass('text-right');
        expect(screen.getByRole('cell', { name: '12' })).toHaveClass('tabular-nums');
    });

    it('a labelled container is a focusable region', () => {
        render(<TableContainer label="Schedule" />);
        expect(screen.getByRole('region', { name: 'Schedule' })).toHaveAttribute('tabindex', '0');
    });

    it('marks which edges have content scrolled under them (sticky cells frost only then)', () => {
        render(<TableContainer label="T" />);
        const el = screen.getByRole('region');
        const scroll = (top: number, left: number) => {
            Object.defineProperties(el, {
                scrollTop: { configurable: true, value: top },
                scrollLeft: { configurable: true, value: left },
                clientHeight: { configurable: true, value: 100 },
                scrollHeight: { configurable: true, value: 300 },
            });
            fireEvent.scroll(el);
        };
        scroll(0, 0);
        expect(el).not.toHaveAttribute('data-under-top');
        expect(el).not.toHaveAttribute('data-under-left');
        expect(el).toHaveAttribute('data-under-bottom');
        scroll(200, 30);
        expect(el).toHaveAttribute('data-under-top');
        expect(el).toHaveAttribute('data-under-left');
        expect(el).not.toHaveAttribute('data-under-bottom');
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
        expect(screen.getByRole('cell', { name: 'Rent' })).toHaveClass('sticky', 'left-0', 'zen__sticky-left');
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
        expect(screen.getByRole('columnheader').querySelector('svg')).toBeInTheDocument();
    });
});

describe('TableBody motion', () => {
    let animate: ReturnType<typeof vi.fn>;
    beforeEach(() => {
        animate = vi.fn();
        Element.prototype.animate = animate as unknown as Element['animate'];
        // jsdom has no layout: a row's top is its place in the body.
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
            return this instanceof HTMLTableRowElement ? this.sectionRowIndex * 40 : 0;
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
        delete (Element.prototype as Partial<Element>).animate;
    });

    const rows = (keys: string[], spacer = false) => (
        <Table>
            <TableBody>
                {spacer && <TableSpacerRow height={10} colSpan={1} />}
                {keys.map((k) => (
                    <TableRow key={k}>
                        <TableCell>{k}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
    const moves = () => animate.mock.calls.map(([keyframes]) => keyframes);

    it('slides reordered rows from where they were, and fades new ones in', () => {
        const { rerender } = render(rows(['a', 'b']));
        expect(animate).not.toHaveBeenCalled();
        rerender(rows(['b', 'a', 'c']));
        expect(moves()).toEqual([
            { translate: ['0 40px', '0 0'] },
            { translate: ['0 -40px', '0 0'] },
            { opacity: [0, 1], translate: ['0 -6px', '0 0'] },
        ]);
    });

    it('stays still when the rows are the same, in a virtual list, or with reduced motion', () => {
        const { rerender } = render(rows(['a', 'b']));
        rerender(rows(['a', 'b']));
        document.documentElement.classList.add('reduce-motion');
        rerender(rows(['b', 'a']));
        document.documentElement.classList.remove('reduce-motion');
        const virtual = render(rows(['a', 'b'], true));
        virtual.rerender(rows(['b', 'a'], true));
        expect(animate).not.toHaveBeenCalled();
    });

    const panel = (keys: string[]) => <TableContainer>{rows(keys)}</TableContainer>;
    const ghosts = () => [...document.querySelectorAll('.zen__table-container > table[aria-hidden]')];

    it('fades a deleted row where it was, then takes it away', () => {
        const fade = { onfinish: null as null | (() => void), oncancel: null };
        animate.mockImplementation(function (this: Element) {
            return this.tagName === 'TABLE' ? fade : undefined;
        });
        const { rerender } = render(panel(['a', 'b', 'c']));
        rerender(panel(['a', 'c']));
        expect(ghosts()).toHaveLength(1);
        expect(ghosts()[0]).toHaveTextContent('b');
        expect((ghosts()[0] as HTMLElement).style.top).toBe('40px');
        expect(moves()).toContainEqual({ opacity: [1, 0], translate: ['0 0', '-12px 0'] });
        fade.onfinish!();
        expect(ghosts()).toHaveLength(0);
    });

    it('fades nothing out when every row changed (a new page, not a deletion)', () => {
        const { rerender } = render(panel(['a', 'b']));
        rerender(panel(['x', 'y']));
        expect(ghosts()).toHaveLength(0);
    });
});
