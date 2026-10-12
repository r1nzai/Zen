import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { flattenTree, SortableHandle, SortableItem, type SortableNode, SortableTree } from './index';

const NAMES: Record<string, string> = {
    home: 'Home',
    rent: 'Rent',
    power: 'Power',
    food: 'Food',
    dining: 'Dining',
    coffee: 'Coffee',
};
const GROUPS = new Set(['home', 'food']);

function Planner({ onChange = () => {} }: { onChange?: (tree: SortableNode[]) => void }) {
    const [tree, setTree] = useState<SortableNode[]>([
        { id: 'home', children: [{ id: 'rent' }, { id: 'power' }] },
        { id: 'food', children: [{ id: 'dining', children: [{ id: 'coffee' }] }] },
    ]);
    return (
        <SortableTree
            value={tree}
            onValueChange={(next) => {
                setTree(next);
                onChange(next);
            }}
            // Groups stay at the top; items go only into groups or other items.
            accepts={(id, parent) => (GROUPS.has(id) ? parent === null : parent !== null)}
        >
            {flattenTree(tree).map(({ id, depth }) => (
                <SortableItem key={id} id={id} label={NAMES[id]} data-depth={depth}>
                    <SortableHandle id={id} label={NAMES[id]} />
                    {NAMES[id]}
                </SortableItem>
            ))}
        </SortableTree>
    );
}

const rows = () => screen.getAllByRole('listitem').map((li) => `${li.textContent}:${li.dataset.depth}`);
const handle = (name: string) => screen.getByRole('button', { name: `Reorder ${name}` });
const press = (name: string, ...keys: string[]) => keys.forEach((key) => fireEvent.keyDown(handle(name), { key }));

describe('SortableTree', () => {
    it('down the rows, into the next group, saying where in which group', () => {
        render(<Planner />);
        press('Power', ' ');
        expect(screen.getByText(/Power picked up, 2 of 2 in Home/)).toBeInTheDocument();
        // Not to the top level between the groups (not allowed): straight into Food.
        press('Power', 'ArrowDown');
        expect(rows()).toEqual(['Home:0', 'Rent:1', 'Food:0', 'Power:1', 'Dining:1', 'Coffee:2']);
        expect(screen.getByText('Power, 1 of 2 in Food.')).toBeInTheDocument();
        expect(handle('Power')).toHaveFocus();
    });

    it('right goes a level in, under the item above; left comes back out', () => {
        render(<Planner />);
        press('Power', ' ', 'ArrowRight');
        expect(rows()).toEqual(['Home:0', 'Rent:1', 'Power:2', 'Food:0', 'Dining:1', 'Coffee:2']);
        expect(screen.getByText('Power, 1 of 1 in Rent.')).toBeInTheDocument();
        press('Power', 'ArrowLeft');
        expect(rows()).toEqual(['Home:0', 'Rent:1', 'Power:1', 'Food:0', 'Dining:1', 'Coffee:2']);
        // A group can't go into anything.
        press('Power', ' ');
        press('Food', ' ', 'ArrowRight');
        expect(rows()).toEqual(['Home:0', 'Rent:1', 'Power:1', 'Food:0', 'Dining:1', 'Coffee:2']);
    });

    it('an item carries what is under it, into an expanded sub-item', () => {
        render(<Planner />);
        press('Rent', ' ', 'ArrowDown', 'ArrowDown', 'ArrowDown');
        // Past Power, past the gap into Food, and on among Dining's children.
        expect(rows()).toEqual(['Home:0', 'Power:1', 'Food:0', 'Dining:1', 'Rent:2', 'Coffee:2']);
        expect(screen.getByText('Rent, 1 of 2 in Dining.')).toBeInTheDocument();
        press('Rent', 'Enter');
        press('Dining', ' ', 'ArrowUp');
        expect(rows()).toEqual(['Home:0', 'Power:1', 'Dining:1', 'Rent:2', 'Coffee:2', 'Food:0']);
    });

    it('Escape puts it back where it was picked up', () => {
        const onChange = vi.fn();
        render(<Planner onChange={onChange} />);
        press('Rent', ' ', 'ArrowDown', 'ArrowDown', 'Escape');
        expect(rows()).toEqual(['Home:0', 'Rent:1', 'Power:1', 'Food:0', 'Dining:1', 'Coffee:2']);
        expect(screen.getByText('Rent put back, 1 of 2 in Home.')).toBeInTheDocument();
    });
});
