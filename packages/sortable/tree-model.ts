/** A node of a SortableTree's value: an id, and the nodes under it. */
export interface SortableNode {
    id: string;
    children?: SortableNode[];
}

/** A row as shown: how deep it is, and what it's under (null at the top). */
export interface SortableRow {
    id: string;
    depth: number;
    parentId: string | null;
}

/** Somewhere a node can go: under `parentId` (null: the top), at `index` among its children. */
export interface TreePlace {
    parentId: string | null;
    index: number;
}

/** A place, as where it is among the rows: before row `gap` (after the last, at the end), `depth` deep. */
export interface TreeSlot extends TreePlace {
    gap: number;
    depth: number;
}

/**
 * The rows to render, in order, each with its depth: a node's children follow
 * it while `open(id)` says it's expanded (by default, all are).
 */
export function flattenTree(
    nodes: readonly SortableNode[],
    open: (id: string) => boolean = () => true,
    depth = 0,
    parentId: string | null = null,
): SortableRow[] {
    return nodes.flatMap((node) => [
        { id: node.id, depth, parentId },
        ...(node.children?.length && open(node.id) ? flattenTree(node.children, open, depth + 1, node.id) : []),
    ]);
}

/** Every node's depth, parent and place among its siblings. */
export function indexTree(nodes: readonly SortableNode[]) {
    const all = new Map<string, SortableRow & { index: number }>();
    const walk = (list: readonly SortableNode[], depth: number, parentId: string | null) =>
        list.forEach((node, index) => {
            all.set(node.id, { id: node.id, depth, parentId, index });
            if (node.children) walk(node.children, depth + 1, node.id);
        });
    walk(nodes, 0, null);
    return all;
}

/** The tree without `id` (and what's under it), and that node. */
export function removeNode(nodes: readonly SortableNode[], id: string): [SortableNode[], SortableNode | null] {
    let found: SortableNode | null = null;
    const without = (list: readonly SortableNode[]): SortableNode[] =>
        list.flatMap((node) => {
            if (node.id === id) {
                found = node;
                return [];
            }
            return node.children ? [{ ...node, children: without(node.children) }] : [node];
        });
    const rest = without(nodes);
    return [rest, found];
}

/** The tree with `node` put at `place`. */
export function insertNode(nodes: readonly SortableNode[], place: TreePlace, node: SortableNode): SortableNode[] {
    if (place.parentId === null) return [...nodes.slice(0, place.index), node, ...nodes.slice(place.index)];
    return nodes.map((n) => {
        if (n.id === place.parentId) {
            const kids = n.children ?? [];
            return { ...n, children: [...kids.slice(0, place.index), node, ...kids.slice(place.index)] };
        }
        return n.children ? { ...n, children: insertNode(n.children, place, node) } : n;
    });
}

/**
 * Everywhere a node can go, given the tree without it and the rows still
 * shown. Between two rows it can be as deep as under the one above, or as
 * shallow as the one below: it joins the group of whichever level it's at.
 * `allowed` says which parents take it.
 */
export function treeSlots(
    tree: readonly SortableNode[],
    rows: readonly { id: string }[],
    allowed: (parentId: string | null) => boolean,
): TreeSlot[] {
    const info = indexTree(tree);
    const ancestorAt = (id: string, depth: number) => {
        let row = info.get(id)!;
        while (row.depth > depth) row = info.get(row.parentId!)!;
        return row;
    };
    const slots: TreeSlot[] = [];
    for (let gap = 0; gap <= rows.length; gap++) {
        const prev = gap > 0 ? info.get(rows[gap - 1].id) : undefined;
        const next = gap < rows.length ? info.get(rows[gap].id) : undefined;
        const deepest = prev ? prev.depth + 1 : 0;
        const shallowest = next ? next.depth : 0;
        for (let depth = shallowest; depth <= deepest; depth++) {
            const place: TreePlace = !prev
                ? { parentId: null, index: 0 }
                : depth === prev.depth + 1
                  ? { parentId: prev.id, index: 0 }
                  : (() => {
                        const sibling = ancestorAt(prev.id, depth);
                        return { parentId: sibling.parentId, index: sibling.index + 1 };
                    })();
            if (allowed(place.parentId)) slots.push({ ...place, gap, depth });
        }
    }
    return slots;
}

/** Of the slots at `gap`, the one nearest `depth`, the shallower on a tie. */
export function nearestSlot(slots: readonly TreeSlot[], gap: number, depth: number): TreeSlot | null {
    let best: TreeSlot | null = null;
    for (const slot of slots) {
        if (slot.gap !== gap) continue;
        if (!best || Math.abs(slot.depth - depth) < Math.abs(best.depth - depth)) best = slot;
    }
    return best;
}
