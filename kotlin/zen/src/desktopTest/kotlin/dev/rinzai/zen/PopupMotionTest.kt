package dev.rinzai.zen

import androidx.compose.ui.Modifier
import dev.rinzai.zen.popover.PopoverContent
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.runComposeUiTest
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.navigationmenu.NavigationMenu
import dev.rinzai.zen.navigationmenu.NavigationMenuContent
import dev.rinzai.zen.navigationmenu.NavigationMenuItem
import dev.rinzai.zen.navigationmenu.NavigationMenuTrigger
import androidx.compose.foundation.layout.width
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** The curve popupMotion.ts draws on the web: the settling spring, growing onto its size without a bounce. */
@OptIn(ExperimentalTestApi::class)
class PopupMotionTest {
    @Test
    fun growsOntoItsSizeWithoutABounce() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                val menu = rememberMenuState()
                Button(menu::toggle, Modifier.menuTrigger(menu)) { Text("Open") }
                MenuContent(menu, Modifier.testTag("menu")) {
                    for (i in 1..4) MenuItem({}) { Text("Item $i") }
                }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Open").performClick()
        // Its first frame on screen.
        while (onAllNodesWithTag("menu").fetchSemanticsNodes().isEmpty()) mainClock.advanceTimeByFrame()
        val frames = (0..60).map {
            val box = onNodeWithTag("menu").getBoundsInRoot()
            mainClock.advanceTimeByFrame()
            (box.right - box.left).value to (box.bottom - box.top).value
        }
        val (w, h) = frames[frames.size - 1]
        val sx = frames.map { it.first / w }
        val sy = frames.map { it.second / h }
        println("frame ms sx sy: " + sx.indices.filter { it % 2 == 0 }.joinToString { "${it * 16}:${"%.3f".format(sx[it])}x${"%.3f".format(sy[it])}" })
        // From 0.86 × 0.72 onto its size, and no wobble: never more than a hair past it, never back under.
        assertTrue(sx[0] < 0.92f && sy[0] < 0.8f, "starts small: ${sx[0]} × ${sy[0]}")
        assertTrue(sy.max() < 1.005f && sx.max() < 1.005f, "overshoots: ${sx.max()} × ${sy.max()}")
        val landed = sy.indexOfFirst { it > 0.99f }
        assertTrue(sy.drop(landed).all { it > 0.99f }, "swings back under its size")
        assertEquals(1f, sy.last(), 0.002f)
    }

    @Test
    fun shutsWithinItsExit() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                val menu = rememberMenuState()
                Button(menu::toggle, Modifier.menuTrigger(menu)) { Text("Open") }
                MenuContent(menu, Modifier.testTag("menu")) { MenuItem({}) { Text("Item") } }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Open").performClick()
        mainClock.advanceTimeBy(1000)
        onNodeWithText("Open").performClick()
        mainClock.advanceTimeBy(150)
        onNodeWithTag("menu").assertExists()
        mainClock.advanceTimeBy(100)
        onNodeWithTag("menu").assertDoesNotExist()
    }

    @Test
    fun easesToANewSizeRatherThanJumping() = runComposeUiTest {
        mainClock.autoAdvance = false
        var tall by mutableStateOf(true)
        setContent {
            ZenTheme {
                val popover = rememberPopupState()
                Button(popover::toggle, Modifier.popupAnchor(popover)) { Text("Open") }
                PopoverContent(popover, Modifier.testTag("popover")) { Box(Modifier.size(200.dp, if (tall) 200.dp else 80.dp)) }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Open").performClick()
        mainClock.advanceTimeBy(1000)
        fun height() = onNodeWithTag("popover").getBoundsInRoot().let { (it.bottom - it.top).value }
        // Its contents and its border.
        val start = height()
        val end = start - 120f
        tall = false
        mainClock.advanceTimeByFrame()
        mainClock.advanceTimeBy(64)
        val midway = height()
        assertTrue(midway in end + 1f..start - 1f, "jumped to $midway")
        mainClock.advanceTimeBy(400)
        assertEquals(end, height(), 0.5f)
    }

    @Test
    fun aNavigationMenusPanelMovesOnFromLabelToLabel() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                NavigationMenu {
                    NavigationMenuItem {
                        NavigationMenuTrigger { Text("Plan") }
                        NavigationMenuContent(Modifier.width(320.dp), label = "plan") { Box(Modifier.size(300.dp, 120.dp)) }
                    }
                    NavigationMenuItem {
                        NavigationMenuTrigger { Text("Reports") }
                        NavigationMenuContent(Modifier.width(200.dp), label = "reports") { Box(Modifier.size(180.dp, 60.dp)) }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Plan").performClick()
        mainClock.advanceTimeBy(1000)
        // The glass panel, named by its label.
        fun panel(name: String) = onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, name))
        val plan = panel("plan").getBoundsInRoot()
        onNodeWithText("Reports").performClick()
        mainClock.advanceTimeByFrame()
        // One panel: the last goes at once, and the new one starts where it was, at its size.
        panel("plan").assertDoesNotExist()
        mainClock.advanceTimeBy(64)
        val midway = panel("reports").getBoundsInRoot()
        mainClock.advanceTimeBy(400)
        val end = panel("reports").getBoundsInRoot()
        assertTrue(end.left > plan.left, "Reports is right of Plan")
        assertTrue(midway.left.value in plan.left.value + 1f..end.left.value - 1f, "moves on from Plan's place: ${plan.left} → ${midway.left} → ${end.left}")
        val width = { r: androidx.compose.ui.unit.DpRect -> (r.right - r.left).value }
        assertTrue(width(midway) in width(end) + 1f..width(plan) - 1f, "eases from Plan's width: ${width(plan)} → ${width(midway)} → ${width(end)}")
    }

    @Test
    fun aNavigationMenuOpensAndMovesOnByHover() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                NavigationMenu {
                    NavigationMenuItem {
                        NavigationMenuTrigger { Text("Plan") }
                        NavigationMenuContent(label = "plan") { Box(Modifier.size(300.dp, 120.dp)) }
                    }
                    NavigationMenuItem {
                        NavigationMenuTrigger { Text("Reports") }
                        NavigationMenuContent(label = "reports") { Box(Modifier.size(180.dp, 60.dp)) }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(100)
        fun panel(name: String) = onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, name))
        // Opened by the pointer alone, without focus, it stays open.
        onNodeWithText("Plan").performMouseInput { moveTo(center) }
        mainClock.advanceTimeBy(1000)
        panel("plan").assertExists()
        onNodeWithText("Reports").performMouseInput { moveTo(center) }
        mainClock.advanceTimeBy(1000)
        panel("plan").assertDoesNotExist()
        panel("reports").assertExists()
    }
}
