package dev.rinzai.zen

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.ComposeUiTest
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableItem
import dev.rinzai.zen.sortable.SortableNode
import dev.rinzai.zen.sortable.SortableTree
import dev.rinzai.zen.sortable.flattenTree
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(ExperimentalTestApi::class)
class SortableTreeTest {
    private val names = mapOf("home" to "Home", "rent" to "Rent", "power" to "Power", "food" to "Food", "dining" to "Dining", "coffee" to "Coffee")
    private val groups = setOf("home", "food")
    private var tree by mutableStateOf(listOf<SortableNode>())

    private fun ComposeUiTest.planner() {
        tree = listOf(
            SortableNode("home", listOf(SortableNode("rent"), SortableNode("power"))),
            SortableNode("food", listOf(SortableNode("dining", listOf(SortableNode("coffee"))))),
        )
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                // Groups stay at the top; items go only into groups or other items.
                SortableTree(tree, { tree = it }, Modifier.width(300.dp), accepts = { id, parent -> if (id in groups) parent == null else parent != null }) {
                    for (row in flattenTree(tree)) key(row.id) {
                        SortableItem(row.id, label = names[row.id]) {
                            Row { SortableHandle(row.id, names.getValue(row.id)); Text(names.getValue(row.id)) }
                        }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(300)
    }

    private fun rows() = flattenTree(tree).map { "${names[it.id]}:${it.depth}" }

    private fun ComposeUiTest.press(name: String, keys: List<Key>) {
        val handle = onNodeWithContentDescription("Reorder $name")
        handle.requestFocus()
        for (k in keys) {
            handle.performKeyInput { pressKey(k) }
            mainClock.advanceTimeBy(400)
        }
    }

    // What the live region says.
    private fun ComposeUiTest.said(text: String) = assertTrue(
        onAllNodesWithContentDescription(text, substring = true, useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty(),
        "nothing says \"$text\"",
    )

    @Test
    fun downTheRowsIntoTheNextGroupSayingWhereInWhichGroup() = runComposeUiTest {
        planner()
        press("Power", listOf(Key.Spacebar))
        said("Power picked up, 2 of 2 in Home")
        // Not to the top level between the groups (not allowed): straight into Food.
        press("Power", listOf(Key.DirectionDown))
        assertEquals(listOf("Home:0", "Rent:1", "Food:0", "Power:1", "Dining:1", "Coffee:2"), rows())
        said("Power, 1 of 2 in Food.")
        onNodeWithContentDescription("Reorder Power").assertIsFocused()
    }

    @Test
    fun rightGoesALevelInUnderTheItemAboveLeftComesBackOut() = runComposeUiTest {
        planner()
        press("Power", listOf(Key.Spacebar, Key.DirectionRight))
        assertEquals(listOf("Home:0", "Rent:1", "Power:2", "Food:0", "Dining:1", "Coffee:2"), rows())
        said("Power, 1 of 1 in Rent.")
        press("Power", listOf(Key.DirectionLeft))
        assertEquals(listOf("Home:0", "Rent:1", "Power:1", "Food:0", "Dining:1", "Coffee:2"), rows())
        // A group can't go into anything.
        press("Power", listOf(Key.Spacebar))
        press("Food", listOf(Key.Spacebar, Key.DirectionRight))
        assertEquals(listOf("Home:0", "Rent:1", "Power:1", "Food:0", "Dining:1", "Coffee:2"), rows())
    }

    @Test
    fun anItemCarriesWhatIsUnderItIntoAnExpandedSubItem() = runComposeUiTest {
        planner()
        press("Rent", listOf(Key.Spacebar, Key.DirectionDown, Key.DirectionDown, Key.DirectionDown))
        // Past Power, past the gap into Food, and on among Dining's children.
        assertEquals(listOf("Home:0", "Power:1", "Food:0", "Dining:1", "Rent:2", "Coffee:2"), rows())
        said("Rent, 1 of 2 in Dining.")
        press("Rent", listOf(Key.Enter))
        press("Dining", listOf(Key.Spacebar, Key.DirectionUp))
        assertEquals(listOf("Home:0", "Power:1", "Dining:1", "Rent:2", "Coffee:2", "Food:0"), rows())
    }

    @Test
    fun escapePutsItBackWhereItWasPickedUp() = runComposeUiTest {
        planner()
        press("Rent", listOf(Key.Spacebar, Key.DirectionDown, Key.DirectionDown, Key.Escape))
        assertEquals(listOf("Home:0", "Rent:1", "Power:1", "Food:0", "Dining:1", "Coffee:2"), rows())
        said("Rent put back, 1 of 2 in Home.")
    }
}
