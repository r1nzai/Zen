package dev.rinzai.zen

import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.table.SortDirection
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableEmpty
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSort
import dev.rinzai.zen.table.rememberTableSort
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(ExperimentalTestApi::class)
class TableTest {
    @Test
    fun headingSortsThenReversesThenClears() = runComposeUiTest {
        mainClock.autoAdvance = false
        val rows = listOf(3, 1, 2)
        lateinit var sort: TableSort<Int, String>
        setContent {
            ZenTheme {
                sort = rememberTableSort(rows, mapOf("n" to compareBy<Int> { it }))
                TableContainer {
                    Table {
                        TableHeader { TableRow { TableHead(sortDirection = sort.direction("n"), onSort = { sort.toggle("n") }) { Text("N") } } }
                        TableBody(sort.rows, key = { it }) { n -> TableRow { TableCell { Text("$n") } } }
                    }
                }
            }
        }
        val head = onNodeWithText("N")
        assertEquals(listOf(3, 1, 2), sort.rows)
        head.performClick()
        mainClock.advanceTimeBy(500)
        assertEquals(listOf(1, 2, 3), sort.rows)
        assertEquals(SortDirection.Asc, sort.direction("n"))
        head.performClick()
        mainClock.advanceTimeBy(500)
        assertEquals(listOf(3, 2, 1), sort.rows)
        head.performClick()
        mainClock.advanceTimeBy(500)
        assertEquals(listOf(3, 1, 2), sort.rows)
        assertEquals(null, sort.direction("n"))
    }

    @Test
    fun emptyTableSaysSo() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                TableContainer {
                    Table {
                        TableHeader { TableRow { TableHead { Text("A") }; TableHead { Text("B") } } }
                        TableEmpty()
                        TableBody(emptyList<Int>(), key = { it }) {}
                    }
                }
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithText("Nothing here yet.").assertExists()
    }

    @Test
    fun labelledContainerScrollsFromTheKeyboardUnderAStickyHeader() = runComposeUiTest {
        mainClock.autoAdvance = false
        val rows = (1..40).toList()
        setContent {
            ZenTheme {
                TableContainer(Modifier.width(300.dp).heightIn(max = 200.dp), label = "Rows") {
                    Table {
                        TableHeader { TableRow { TableHead { Text("Row") } } }
                        TableBody(rows, key = { it }) { n -> TableRow { TableCell { Text("Row $n") } } }
                    }
                }
            }
        }
        val region = onNodeWithContentDescription("Rows")
        region.requestFocus()
        mainClock.advanceTimeBy(300)
        val headTop = onNodeWithText("ROW", useUnmergedTree = true).fetchSemanticsNode().positionInRoot.y
        region.performKeyInput { pressKey(Key.PageDown) }
        mainClock.advanceTimeBy(1000)
        // The header stays where it was; the rows have moved up under it.
        assertEquals(headTop, onNodeWithText("ROW", useUnmergedTree = true).fetchSemanticsNode().positionInRoot.y)
        val first = onAllNodesWithText("Row 1", useUnmergedTree = true).fetchSemanticsNodes().first().positionInRoot.y
        assertTrue(first < headTop, "row 1 is at $first, the header at $headTop")
        region.performKeyInput { pressKey(Key.MoveHome) }
        mainClock.advanceTimeBy(1000)
        assertTrue(onAllNodesWithText("Row 1", useUnmergedTree = true).fetchSemanticsNodes().first().positionInRoot.y > headTop)
    }
}
