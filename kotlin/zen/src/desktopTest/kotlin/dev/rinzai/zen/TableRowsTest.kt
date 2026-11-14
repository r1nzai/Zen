package dev.rinzai.zen

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSelectCell
import dev.rinzai.zen.table.TableSelectHead
import dev.rinzai.zen.table.TableSelection
import dev.rinzai.zen.table.TableSpacerRow
import dev.rinzai.zen.table.TableSwipeAction
import dev.rinzai.zen.table.TableSwipeRow
import dev.rinzai.zen.table.rememberTableScrollState
import dev.rinzai.zen.table.rememberTableSelection
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(ExperimentalTestApi::class)
class TableRowsTest {
    @Test
    fun shiftSelectsARunAndTheHeadClearsSome() = runComposeUiTest {
        mainClock.autoAdvance = false
        val keys = listOf("a", "b", "c", "d")
        lateinit var selection: TableSelection<String>
        setContent {
            ZenTheme {
                selection = rememberTableSelection(keys)
                TableContainer {
                    Table {
                        TableHeader { TableRow { TableSelectHead(selection); TableHead { Text("Key") } } }
                        TableBody(keys, key = { it }) { k ->
                            TableRow(selected = selection.isSelected(k)) {
                                TableSelectCell(selection, k, "Select $k")
                                TableCell { Text(k) }
                            }
                        }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Select a").performClick()
        // The test's pointer can't hold shift: what a shift-click on c does.
        runOnIdle { selection.select("c", on = true, range = true) }
        mainClock.advanceTimeBy(300)
        assertEquals(setOf("a", "b", "c"), selection.selected)
        // Some are: the head clears them.
        onNodeWithContentDescription("Select all").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(emptySet(), selection.selected)
        onNodeWithContentDescription("Select all").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(keys.toSet(), selection.selected)
    }

    @Test
    fun swipingARowRevealsItsActions() = runComposeUiTest {
        mainClock.autoAdvance = false
        var rows by mutableStateOf(listOf("Rent", "Food"))
        setContent {
            ZenTheme {
                TableContainer(Modifier.width(400.dp)) {
                    Table {
                        TableBody(rows, key = { it }) { r ->
                            TableSwipeRow(actions = { TableSwipeAction({ rows = rows - r }, negative = true, label = "Delete $r") { Text("Delete") } }) {
                                TableCell { Text(r) }
                            }
                        }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithText("Rent").performTouchInput { swipeLeft(startX = centerX + 200f, endX = centerX) }
        mainClock.advanceTimeBy(600)
        onNodeWithContentDescription("Delete Rent").assertIsDisplayed().performClick()
        mainClock.advanceTimeBy(600)
        assertEquals(listOf("Food"), rows)
    }

    @Test
    fun tenThousandWindowedRowsReachTheirEnd() = runComposeUiTest {
        mainClock.autoAdvance = false
        val count = 10000
        setContent {
            ZenTheme {
                val scroll = rememberTableScrollState()
                val list = rememberVirtualList(count, 40.dp, scroll)
                TableContainer(Modifier.width(300.dp).height(240.dp), label = "Rows", scroll = scroll) {
                    Table {
                        TableHeader { TableRow { TableHead { Text("N") } } }
                        TableSpacerRow(list.paddingTop)
                        TableBody(list.items, key = { it.index }) { TableRow { TableCell(Modifier.height(40.dp)) { Text("Row ${it.index + 1}") } } }
                        TableSpacerRow(list.paddingBottom)
                    }
                }
            }
        }
        mainClock.advanceTimeBy(300)
        assertTrue(onAllNodesWithText("Row", substring = true).fetchSemanticsNodes().size < 30)
        val region = onNodeWithContentDescription("Rows")
        region.requestFocus()
        region.performKeyInput { pressKey(Key.MoveEnd) }
        mainClock.advanceTimeBy(2000)
        onNodeWithText("Row $count").assertIsDisplayed()
        assertTrue(onAllNodesWithText("Row", substring = true).fetchSemanticsNodes().size < 30)
    }
}
