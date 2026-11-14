package dev.rinzai.zen

import dev.rinzai.zen.sortable.SortableNode
import dev.rinzai.zen.sortable.TreePlace
import dev.rinzai.zen.sortable.flattenTree
import dev.rinzai.zen.sortable.insertNode
import dev.rinzai.zen.sortable.nearestSlot
import dev.rinzai.zen.sortable.removeNode
import dev.rinzai.zen.sortable.treeSlots
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class TreeModelTest {
    private val tree = listOf(
        SortableNode("home", listOf(SortableNode("rent"), SortableNode("power"))),
        SortableNode("food", listOf(SortableNode("dining", listOf(SortableNode("coffee"))))),
    )

    @Test
    fun flattensWhatIsOpenWithDepths() {
        assertEquals(listOf("home:0", "rent:1", "power:1", "food:0", "dining:1", "coffee:2"), flattenTree(tree).map { "${it.id}:${it.depth}" })
        assertEquals(listOf("home", "rent", "power", "food", "dining"), flattenTree(tree) { it != "dining" }.map { it.id })
    }

    @Test
    fun movesANodeWithWhatIsUnderIt() {
        val (rest, dining) = removeNode(tree, "dining")
        assertEquals(SortableNode("dining", listOf(SortableNode("coffee"))), dining)
        assertEquals(
            listOf(SortableNode("home", listOf(SortableNode("rent"), dining!!, SortableNode("power"))), SortableNode("food", emptyList())),
            insertNode(rest, TreePlace("home", 1), dining),
        )
        assertEquals(listOf("home", "food", "dining"), insertNode(rest, TreePlace(null, 2), dining).map { it.id })
    }

    @Test
    fun betweenRowsAnyDepthFromTheRowBelowsToUnderTheRowAbove() {
        val (rest) = removeNode(tree, "rent")
        val slots = treeSlots(rest, flattenTree(rest).map { it.id }) { true }
        fun at(gap: Int) = slots.filter { it.gap == gap }.map { Triple(it.depth, it.parentId, it.place.index) }
        assertEquals(listOf(Triple(0, null, 0)), at(0))
        assertEquals(listOf(Triple(1, "home", 0)), at(1))
        assertEquals(listOf(Triple(0, null, 1), Triple(1, "home", 1), Triple(2, "power", 0)), at(2))
        assertEquals(listOf(Triple(0, null, 2), Triple(1, "food", 1), Triple(2, "dining", 1), Triple(3, "coffee", 0)), at(5))
    }

    @Test
    fun onlyWhereAllowedTheNearestAllowedDepthWins() {
        val (rest) = removeNode(tree, "rent")
        val categories = setOf("home", "food")
        val slots = treeSlots(rest, flattenTree(rest).map { it.id }) { it != null && it in categories }
        assertEquals(TreePlace("home", 1), nearestSlot(slots, 2, 0)?.place)
        assertNull(nearestSlot(slots, 0, 0))
    }
}
