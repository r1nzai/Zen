package dev.rinzai.zen

import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.tree.Tree
import dev.rinzai.zen.tree.TreeCell
import dev.rinzai.zen.tree.TreeLabel
import dev.rinzai.zen.tree.TreeRow
import dev.rinzai.zen.tree.rememberTree
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** A group opens and closes with every row under it: none is left standing while its parent shrinks away. */
@OptIn(ExperimentalTestApi::class)
class TreeMotionTest {
    private class Node(val name: String, val children: List<Node>? = null)

    private val files = listOf(
        Node("packages", listOf(Node("button", listOf(Node("index.tsx"))), Node("table"))),
        Node("docs", listOf(Node("app"))),
    )

    @Test
    fun closingMovesTheWholeGroup() = runComposeUiTest {
        mainClock.autoAdvance = false
        lateinit var tree: Tree<Node>
        setContent { ZenTheme { tree = rememberTree(files, key = { it.name }, children = { it.children }) } }
        runOnIdle { tree.toggle("packages") }
        mainClock.advanceTimeByFrame()
        assertEquals(listOf("button", "index.tsx", "table"), tree.rows.filter { it.leaving }.map { it.key })
        mainClock.advanceTimeBy(1000)
        assertEquals(listOf("packages", "docs", "app"), tree.rows.map { it.key })
    }

    @Test
    fun openingGrowsTheWholeGroup() = runComposeUiTest {
        mainClock.autoAdvance = false
        lateinit var tree: Tree<Node>
        setContent { ZenTheme { tree = rememberTree(files, key = { it.name }, children = { it.children }, defaultExpanded = false) } }
        runOnIdle {
            tree.toggle("button")
            tree.toggle("packages")
        }
        mainClock.advanceTimeByFrame()
        assertEquals(listOf("button", "index.tsx", "table"), tree.rows.filter { it.entering }.map { it.key })
    }

    @Test
    fun aTableOfTheTreeClosesTheGroupWithNothingLeft() = runComposeUiTest {
        mainClock.autoAdvance = false
        lateinit var tree: Tree<Node>
        setContent {
            ZenTheme {
                tree = rememberTree(files, key = { it.name }, children = { it.children })
                Table {
                    TableBody(tree.rows, key = { it.key }) { row ->
                        TreeRow(row, tree) { TreeCell { TreeLabel(row, tree) { Text(row.item.name) } } }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        val docs = onNodeWithText("docs").getBoundsInRoot().top
        runOnIdle { tree.toggle("packages") }
        mainClock.advanceTimeBy(120)
        // The rows under it shrink as it closes, so what's below rises with them.
        assertTrue(onNodeWithText("docs").getBoundsInRoot().top < docs, "docs rises as the group shrinks")
        mainClock.advanceTimeBy(200)
        // Gone once shrunk: none of them left fading where they were.
        assertEquals(0, onAllNodesWithText("button").fetchSemanticsNodes().size)
    }
}
