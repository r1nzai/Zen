package dev.rinzai.zen

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList
import kotlin.test.Test
import kotlin.test.assertEquals

@OptIn(ExperimentalTestApi::class)
class SortableTest {
    @Test
    fun keyboardPicksUpMovesAndDrops() = runComposeUiTest {
        mainClock.autoAdvance = false
        var out = listOf("a", "b", "c")
        setContent {
            ZenTheme {
                var v by remember { mutableStateOf(out) }
                SortableList(v, { v = it; out = it }, gap = 8.dp) { id -> SortableHandle(id, id.uppercase()) }
            }
        }
        val a = onNodeWithContentDescription("Reorder A")
        a.requestFocus()
        mainClock.advanceTimeBy(300)
        a.performKeyInput { pressKey(Key.Spacebar) }
        a.performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(300)
        a.performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(300)
        a.performKeyInput { pressKey(Key.Spacebar) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("b", "c", "a"), out)
        // Escape puts it back where it was picked up.
        a.performKeyInput { pressKey(Key.Spacebar) }
        a.performKeyInput { pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(300)
        a.performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("b", "c", "a"), out)
    }

    @Test
    fun virtualListScrollsAlongAndKeepsTheDraggedRow() = runComposeUiTest {
        mainClock.autoAdvance = false
        val ids = (0 until 200).map { "s$it" }
        var out = ids
        setContent {
            ZenTheme {
                var v by remember { mutableStateOf(ids) }
                SortableList(v, { v = it; out = it }, Modifier.width(200.dp).height(240.dp), itemHeight = 48.dp) { id ->
                    SortableHandle(id, id)
                }
            }
        }
        val h = onNodeWithContentDescription("Reorder s0")
        h.performMouseInput { moveTo(center); press() }
        // Held near the bottom edge, the list scrolls and the row stays with the pointer.
        // The handle is at the top of its row: 235dp below is 5dp above the list's bottom.
        h.performMouseInput { moveTo(Offset(center.x, 235.dp.toPx())) }
        repeat(120) { mainClock.advanceTimeByFrame() }
        h.performMouseInput { release() }
        mainClock.advanceTimeBy(500)
        val to = out.indexOf("s0")
        assert(to > 6) { "dragged only to $to" }
        assertEquals(ids.size, out.size)
    }
}
