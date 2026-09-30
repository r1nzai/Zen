import { fireEvent, render, screen } from '@testing-library/react';

import Table, { TableBody } from '../table';

import { TreeCell, TreeLabel, TreeRow, useTree } from './index';

interface Node {
    name: string;
    children?: Node[];
}

const ITEMS: Node[] = [
    { name: 'docs', children: [{ name: 'app' }, { name: 'public' }] },
    { name: 'packages', children: [{ name: 'button' }] },
    { name: 'README.md' },
];

function Files() {
    const tree = useTree({
        items: ITEMS,
        getKey: (n) => n.name,
        getChildren: (n) => n.children,
        defaultExpanded: false,
    });
    return (
        <Table {...tree.tableProps} aria-label="Files">
            <TableBody>
                {tree.rows.map((row) => (
                    <TreeRow key={row.key} row={row} tree={tree}>
                        <TreeCell>
                            <TreeLabel row={row} tree={tree}>
                                {row.item.name}
                            </TreeLabel>
                        </TreeCell>
                    </TreeRow>
                ))}
            </TableBody>
        </Table>
    );
}

const row = (name: string) => screen.getByRole('row', { name: new RegExp(`^(Expand |Collapse )?${name}$`) });

describe('Tree', () => {
    it('is a tree grid: levels, places among siblings, open state', () => {
        render(<Files />);
        expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
        expect(row('docs')).toHaveAttribute('aria-level', '1');
        expect(row('docs')).toHaveAttribute('aria-expanded', 'false');
        expect(row('docs')).toHaveAttribute('aria-posinset', '1');
        expect(row('docs')).toHaveAttribute('aria-setsize', '3');
        expect(row('README.md')).not.toHaveAttribute('aria-expanded');
    });

    it('is one tab stop, the rows moved between with the keyboard', () => {
        render(<Files />);
        const docs = row('docs');
        expect(docs).toHaveAttribute('tabindex', '0');
        expect(row('packages')).toHaveAttribute('tabindex', '-1');
        // The toggles are for the pointer: the keyboard opens rows with the arrows.
        for (const button of screen.getAllByRole('button')) expect(button).toHaveAttribute('tabindex', '-1');

        docs.focus();
        fireEvent.keyDown(docs, { key: 'ArrowDown' });
        expect(row('packages')).toHaveFocus();
        expect(row('packages')).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(row('packages'), { key: 'End' });
        expect(row('README.md')).toHaveFocus();
        fireEvent.keyDown(row('README.md'), { key: 'Home' });
        expect(docs).toHaveFocus();
    });

    it('opens with Right, then goes in; closes with Left, then goes out', () => {
        render(<Files />);
        const docs = row('docs');
        docs.focus();
        fireEvent.keyDown(docs, { key: 'ArrowRight' });
        expect(docs).toHaveAttribute('aria-expanded', 'true');
        expect(docs).toHaveFocus();
        fireEvent.keyDown(docs, { key: 'ArrowRight' });
        const app = row('app');
        expect(app).toHaveFocus();
        expect(app).toHaveAttribute('aria-level', '2');
        fireEvent.keyDown(app, { key: 'ArrowLeft' });
        expect(docs).toHaveFocus();
    });

    it('leaves keys pressed inside a cell alone', () => {
        render(<Files />);
        const toggle = screen.getAllByRole('button')[0];
        toggle.focus();
        fireEvent.keyDown(toggle, { key: 'ArrowDown' });
        expect(toggle).toHaveFocus();
    });
});
