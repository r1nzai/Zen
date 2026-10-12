import { flattenTree, insertNode, nearestSlot, removeNode, treeSlots, type SortableNode } from './tree-model';

const TREE: SortableNode[] = [
    { id: 'home', children: [{ id: 'rent' }, { id: 'power' }] },
    { id: 'food', children: [{ id: 'dining', children: [{ id: 'coffee' }] }] },
];

describe('tree model', () => {
    it('flattens what is open, with depths', () => {
        expect(flattenTree(TREE).map((r) => `${r.id}:${r.depth}`)).toEqual([
            'home:0',
            'rent:1',
            'power:1',
            'food:0',
            'dining:1',
            'coffee:2',
        ]);
        expect(flattenTree(TREE, (id) => id !== 'dining').map((r) => r.id)).toEqual([
            'home',
            'rent',
            'power',
            'food',
            'dining',
        ]);
    });

    it('moves a node with what is under it', () => {
        const [rest, dining] = removeNode(TREE, 'dining');
        expect(dining).toEqual({ id: 'dining', children: [{ id: 'coffee' }] });
        expect(insertNode(rest, { parentId: 'home', index: 1 }, dining!)).toEqual([
            { id: 'home', children: [{ id: 'rent' }, dining, { id: 'power' }] },
            { id: 'food', children: [] },
        ]);
        expect(insertNode(rest, { parentId: null, index: 2 }, dining!).map((n) => n.id)).toEqual([
            'home',
            'food',
            'dining',
        ]);
    });

    it('between rows, any depth from the row below’s to under the row above', () => {
        const [rest] = removeNode(TREE, 'rent');
        const rows = flattenTree(rest);
        const slots = treeSlots(rest, rows, () => true);
        const at = (gap: number) => slots.filter((s) => s.gap === gap).map((s) => [s.depth, s.parentId, s.index]);
        // Before everything: the top.
        expect(at(0)).toEqual([[0, null, 0]]);
        // After "home": its first child.
        expect(at(1)).toEqual([[1, 'home', 0]]);
        // After "power", before "food": under power, after power in home, or after home at the top.
        expect(at(2)).toEqual([
            [0, null, 1],
            [1, 'home', 1],
            [2, 'power', 0],
        ]);
        // At the end: under coffee, after coffee in dining, after dining in food, or last at the top.
        expect(at(5)).toEqual([
            [0, null, 2],
            [1, 'food', 1],
            [2, 'dining', 1],
            [3, 'coffee', 0],
        ]);
    });

    it('only where allowed; the nearest allowed depth wins', () => {
        const [rest] = removeNode(TREE, 'rent');
        const categories = new Set(['home', 'food']);
        const slots = treeSlots(rest, flattenTree(rest), (parent) => parent !== null && categories.has(parent));
        expect(nearestSlot(slots, 2, 0)).toMatchObject({ parentId: 'home', index: 1 });
        expect(nearestSlot(slots, 0, 0)).toBeNull();
    });
});
