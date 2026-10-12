import {
    flattenTree,
    SortableHandle,
    SortableItem,
    type SortableNode,
    SortableTree,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
} from '@rinzai/zen';
import ChevronRightMicro from '@zen/icons/micro/chevron-right';
import { useState } from 'react';

const NAMES: Record<string, string> = {
    home: 'Home',
    rent: 'Rent',
    power: 'Electricity',
    internet: 'Internet',
    food: 'Food',
    groceries: 'Groceries',
    dining: 'Eating out',
    coffee: 'Coffee',
    takeaway: 'Takeaway',
};

const AMOUNTS: Record<string, number[]> = {
    rent: [1800, 1800, 1800, 1800],
    power: [92, 88, 75, 70],
    internet: [60, 60, 60, 60],
    groceries: [420, 395, 410, 430],
    dining: [180, 150, 210, 160],
    coffee: [42, 38, 45, 40],
    takeaway: [64, 50, 80, 55],
};

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct'];
const CATEGORIES = new Set(['home', 'food']);

/**
 * Rows reordered by drag and drop (SortableTree, with asChild on the table and
 * its rows). Drag a row by its grip within its category, into the other one,
 * into an open sub-item (Eating out), or under another row (drag sideways a
 * level in or out); or Tab to a grip and use Space and the arrow keys.
 * Categories stay at the top level and can be reordered too. The first column
 * stays in view as it scrolls sideways.
 */
export default function Reorder() {
    const [tree, setTree] = useState<SortableNode[]>([
        { id: 'home', children: [{ id: 'rent' }, { id: 'power' }, { id: 'internet' }] },
        {
            id: 'food',
            children: [{ id: 'groceries' }, { id: 'dining', children: [{ id: 'coffee' }, { id: 'takeaway' }] }],
        },
    ]);
    const [closed, setClosed] = useState(new Set<string>());
    const toggle = (id: string) =>
        setClosed((now) => {
            const next = new Set(now);
            if (!next.delete(id)) next.add(id);
            return next;
        });
    const childrenOf = (id: string, nodes = tree): SortableNode[] | undefined => {
        for (const node of nodes) {
            if (node.id === id) return node.children;
            const found = node.children && childrenOf(id, node.children);
            if (found) return found;
        }
    };
    return (
        <TableContainer label="Planner" className="w-full max-w-xl">
            <SortableTree
                asChild
                value={tree}
                onValueChange={setTree}
                accepts={(id, parent) => (CATEGORIES.has(id) ? parent === null : parent !== null)}
            >
                <Table className="min-w-[36rem]">
                    <TableHeader>
                        <TableRow>
                            <TableHead sticky="start">Item</TableHead>
                            {MONTHS.map((m) => (
                                <TableHead key={m} numeric>
                                    {m}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenTree(tree, (id) => !closed.has(id)).map(({ id, depth }) => {
                            const category = CATEGORIES.has(id);
                            const kids = childrenOf(id);
                            return (
                                <SortableItem key={id} id={id} label={NAMES[id]} asChild>
                                    <TableRow>
                                        <TableCell sticky="start" className="py-1.5">
                                            <span
                                                className="flex items-center gap-1"
                                                style={{ paddingInlineStart: Math.max(0, depth - 1) * 24 }}
                                            >
                                                <SortableHandle id={id} label={NAMES[id]} />
                                                {!category && kids?.length ? (
                                                    <button
                                                        type="button"
                                                        aria-expanded={!closed.has(id)}
                                                        aria-label={NAMES[id]}
                                                        onClick={() => toggle(id)}
                                                        className="text-muted-foreground hover:text-foreground -ms-1 grid size-6 cursor-pointer place-items-center rounded-md"
                                                    >
                                                        <ChevronRightMicro
                                                            className={`size-4 transition-transform rtl:-scale-x-100 ${closed.has(id) ? '' : 'rotate-90'}`}
                                                        />
                                                    </button>
                                                ) : null}
                                                <span
                                                    className={
                                                        category
                                                            ? 'text-muted-foreground text-xs font-medium tracking-wide uppercase'
                                                            : ''
                                                    }
                                                >
                                                    {NAMES[id]}
                                                </span>
                                            </span>
                                        </TableCell>
                                        {MONTHS.map((m, i) => (
                                            <TableCell key={m} numeric className="py-1.5">
                                                {AMOUNTS[id] ? `$${AMOUNTS[id][i]}` : ''}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </SortableItem>
                            );
                        })}
                    </TableBody>
                </Table>
            </SortableTree>
        </TableContainer>
    );
}
