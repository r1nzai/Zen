import { flattenTree, SortableHandle, SortableItem, type SortableNode, SortableTree } from '@rinzai/zen';
import { useState } from 'react';

const NAMES: Record<string, string> = {
    bills: 'Bills',
    rent: 'Rent',
    phone: 'Phone',
    streaming: 'Streaming',
    life: 'Lifestyle',
    gym: 'Gym',
    books: 'Books',
};
const GROUPS = new Set(['bills', 'life']);
const AMOUNTS: Record<string, string> = {
    rent: '$1,800',
    phone: '$45',
    streaming: '$32',
    gym: '$60',
    books: '$25',
};

/**
 * Budgets in groups, with SortableTree: drag one within its group, into the
 * other, or sideways to tuck it under another budget. Groups stay at the top
 * and take budgets; budgets never sit at the top on their own.
 */
export default function Groups() {
    const [tree, setTree] = useState<SortableNode[]>([
        { id: 'bills', children: [{ id: 'rent' }, { id: 'phone' }, { id: 'streaming' }] },
        { id: 'life', children: [{ id: 'gym' }, { id: 'books' }] },
    ]);
    return (
        <SortableTree
            aria-label="Budgets"
            value={tree}
            onValueChange={setTree}
            accepts={(id, parent) => (GROUPS.has(id) ? parent === null : parent !== null)}
            className="w-full max-w-sm gap-1.5"
        >
            {flattenTree(tree).map(({ id, depth }) => (
                <SortableItem key={id} id={id} style={{ marginInlineStart: Math.max(0, depth - 1) * 24 }}>
                    {GROUPS.has(id) ? (
                        <div className="flex items-center gap-1 pt-2">
                            <SortableHandle id={id} label={NAMES[id]} />
                            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                {NAMES[id]}
                            </span>
                        </div>
                    ) : (
                        <div className="glass glow-edge flex items-center gap-1 rounded-xl py-1.5 ps-1.5 pe-4">
                            <SortableHandle id={id} label={NAMES[id]} />
                            <span className="flex-1 text-sm">{NAMES[id]}</span>
                            <span className="text-muted-foreground text-sm tabular-nums">{AMOUNTS[id]}</span>
                        </div>
                    )}
                </SortableItem>
            ))}
        </SortableTree>
    );
}
