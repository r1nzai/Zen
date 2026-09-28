import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';

import Table, { TableBody } from '../table';
import { TreeCell, TreeLabel, TreeRow, useTree } from './index';

interface Node {
    id: string;
    children?: Node[];
}
const DATA: Node[] = [
    { id: 'home', children: [{ id: 'rent' }, { id: 'power', children: [{ id: 'solar' }] }] },
    { id: 'food', children: [{ id: 'groceries' }] },
];
const options = { items: DATA, getKey: (n: Node) => n.id, getChildren: (n: Node) => n.children };

describe('useTree', () => {
    it('lists the visible rows in order, with depth and parent', () => {
        const { result } = renderHook(() => useTree(options));
        expect(result.current.rows.map((r) => `${r.depth}:${r.key}`)).toEqual([
            '0:home',
            '1:rent',
            '1:power',
            '2:solar',
            '0:food',
            '1:groceries',
        ]);
        expect(result.current.rows[3]).toMatchObject({ parentKey: 'power', hasChildren: false });
    });

    it('can start collapsed, and expand and collapse everything', () => {
        const { result } = renderHook(() => useTree({ ...options, defaultExpanded: false }));
        expect(result.current.rows.map((r) => r.key)).toEqual(['home', 'food']);
        act(() => result.current.expandAll());
        expect(result.current.rows).toHaveLength(6);
        act(() => result.current.collapseAll());
        expect(result.current.rows).toHaveLength(2);
    });

    it('opens a row with an entering animation', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useTree({ ...options, defaultExpanded: false }));
        act(() => result.current.toggle('home'));
        const rent = result.current.rows.find((r) => r.key === 'rent')!;
        expect(result.current.rowProps(rent).className).toContain('zen__tree-row-enter');
        act(() => vi.advanceTimersByTime(320));
        expect(result.current.rowProps(rent).className).not.toContain('zen__tree-row-enter');
        vi.useRealTimers();
    });

    it('closes a row after its children shrink away', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useTree(options));
        act(() => result.current.toggle('food'));
        // Still there, shrinking.
        const groceries = result.current.rows.find((r) => r.key === 'groceries')!;
        expect(result.current.rowProps(groceries).className).toContain('zen__tree-row-exit');
        act(() => result.current.rowProps(groceries).onAnimationEnd({ animationName: 'zen-row-close' }));
        expect(result.current.rows.map((r) => r.key)).not.toContain('groceries');
        vi.useRealTimers();
    });
});

describe('Tree parts', () => {
    function Grid() {
        const tree = useTree(options);
        return (
            <Table>
                <TableBody>
                    {tree.rows.map((row) => (
                        <TreeRow key={row.key} row={row} tree={tree}>
                            <TreeCell>
                                <TreeLabel row={row} tree={tree}>
                                    {row.key}
                                </TreeLabel>
                            </TreeCell>
                        </TreeRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    it('gives rows tree semantics and parents a toggle', () => {
        render(<Grid />);
        const home = screen.getByText('home').closest('tr')!;
        expect(home).toHaveAttribute('aria-level', '1');
        expect(home).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('solar').closest('tr')).toHaveAttribute('aria-level', '3');
        expect(screen.getByText('rent').closest('tr')).not.toHaveAttribute('aria-expanded');
        expect(screen.getAllByRole('button', { name: 'Collapse' })).toHaveLength(3);
    });

    it('collapses from the toggle (instantly with reduced motion)', () => {
        document.documentElement.classList.add('reduce-motion');
        render(<Grid />);
        fireEvent.click(screen.getByText('food').closest('tr')!.querySelector('button')!);
        expect(screen.queryByText('groceries')).toBeNull();
        expect(screen.getByText('food').closest('tr')).toHaveAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('reduce-motion');
    });
});
