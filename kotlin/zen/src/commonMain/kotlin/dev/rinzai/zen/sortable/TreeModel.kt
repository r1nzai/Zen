package dev.rinzai.zen.sortable

import androidx.compose.runtime.Immutable
import kotlin.math.abs

/** A node of a SortableTree's value: an id, and the nodes under it. */
@Immutable
data class SortableNode(val id: String, val children: List<SortableNode>? = null)

/** A row as shown: how deep it is, and what it's under (null at the top). */
@Immutable
data class SortableRow(val id: String, val depth: Int, val parentId: String?)

/** Somewhere a node can go: under `parentId` (null: the top), at `index` among its children. */
internal data class TreePlace(val parentId: String?, val index: Int)

/** A place, as where it is among the rows: before row `gap` (after the last, at the end), `depth` deep. */
internal data class TreeSlot(val place: TreePlace, val gap: Int, val depth: Int) {
    val parentId get() = place.parentId
}

/**
 * The rows to show, in order, each with its depth: a node's children follow it while `open(id)`
 * says it's expanded (by default, all are).
 */
fun flattenTree(nodes: List<SortableNode>, open: (String) -> Boolean = { true }): List<SortableRow> {
    val rows = mutableListOf<SortableRow>()
    fun walk(list: List<SortableNode>, depth: Int, parentId: String?) {
        for (node in list) {
            rows += SortableRow(node.id, depth, parentId)
            val kids = node.children
            if (!kids.isNullOrEmpty() && open(node.id)) walk(kids, depth + 1, node.id)
        }
    }
    walk(nodes, 0, null)
    return rows
}

internal class TreeInfo(val id: String, val depth: Int, val parentId: String?, val index: Int)

/** Every node's depth, parent and place among its siblings. */
internal fun indexTree(nodes: List<SortableNode>): Map<String, TreeInfo> {
    val all = LinkedHashMap<String, TreeInfo>()
    fun walk(list: List<SortableNode>, depth: Int, parentId: String?): Unit = list.forEachIndexed { index, node ->
        all[node.id] = TreeInfo(node.id, depth, parentId, index)
        node.children?.let { walk(it, depth + 1, node.id) }
    }
    walk(nodes, 0, null)
    return all
}

/** The tree without `id` (and what's under it), and that node. */
internal fun removeNode(nodes: List<SortableNode>, id: String): Pair<List<SortableNode>, SortableNode?> {
    var found: SortableNode? = null
    fun without(list: List<SortableNode>): List<SortableNode> = list.flatMap { node ->
        when {
            node.id == id -> { found = node; emptyList() }
            node.children != null -> listOf(node.copy(children = without(node.children)))
            else -> listOf(node)
        }
    }
    val rest = without(nodes)
    return rest to found
}

/** The tree with `node` put at `place`. */
internal fun insertNode(nodes: List<SortableNode>, place: TreePlace, node: SortableNode): List<SortableNode> {
    fun List<SortableNode>.with(index: Int) = toMutableList().apply { add(index, node) }
    if (place.parentId == null) return nodes.with(place.index)
    return nodes.map { n ->
        when {
            n.id == place.parentId -> n.copy(children = (n.children ?: emptyList()).with(place.index))
            n.children != null -> n.copy(children = insertNode(n.children, place, node))
            else -> n
        }
    }
}

/** The children of `id`, wherever it is in the tree. */
internal fun childrenOf(nodes: List<SortableNode>, id: String): List<SortableNode>? {
    for (node in nodes) {
        if (node.id == id) return node.children ?: emptyList()
        node.children?.let { kids -> childrenOf(kids, id)?.let { return it } }
    }
    return null
}

/**
 * Everywhere a node can go, given the tree without it and the rows still shown. Between two rows
 * it can be as deep as under the one above, or as shallow as the one below: it joins the group of
 * whichever level it's at. `allowed` says which parents take it.
 */
internal fun treeSlots(tree: List<SortableNode>, rows: List<String>, allowed: (String?) -> Boolean): List<TreeSlot> {
    val info = indexTree(tree)
    fun ancestorAt(id: String, depth: Int): TreeInfo {
        var row = info.getValue(id)
        while (row.depth > depth) row = info.getValue(row.parentId!!)
        return row
    }
    val slots = mutableListOf<TreeSlot>()
    for (gap in 0..rows.size) {
        val prev = if (gap > 0) info[rows[gap - 1]] else null
        val next = if (gap < rows.size) info[rows[gap]] else null
        val deepest = if (prev != null) prev.depth + 1 else 0
        val shallowest = next?.depth ?: 0
        for (depth in shallowest..deepest) {
            val place = when {
                prev == null -> TreePlace(null, 0)
                depth == prev.depth + 1 -> TreePlace(prev.id, 0)
                else -> ancestorAt(prev.id, depth).let { TreePlace(it.parentId, it.index + 1) }
            }
            if (allowed(place.parentId)) slots += TreeSlot(place, gap, depth)
        }
    }
    return slots
}

/** Of the slots at `gap`, the one nearest `depth`, the shallower on a tie. */
internal fun nearestSlot(slots: List<TreeSlot>, gap: Int, depth: Int): TreeSlot? {
    var best: TreeSlot? = null
    for (slot in slots) {
        if (slot.gap != gap) continue
        if (best == null || abs(slot.depth - depth) < abs(best.depth - depth)) best = slot
    }
    return best
}
