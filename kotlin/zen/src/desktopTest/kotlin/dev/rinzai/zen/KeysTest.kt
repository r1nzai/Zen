package dev.rinzai.zen

import androidx.compose.ui.state.ToggleableState
import dev.rinzai.zen.calendarheatmap.CalendarHeatmap
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.runComposeUiTest
import dev.rinzai.zen.checkbox.Checkbox
import dev.rinzai.zen.confirmdialog.ConfirmDialog
import dev.rinzai.zen.numberfield.NumberField
import dev.rinzai.zen.numberfield.NumberFieldChange
import dev.rinzai.zen.radiogroup.RadioGroup
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectItem
import dev.rinzai.zen.toggle.Toggle
import dev.rinzai.zen.moneyinput.MoneyInput
import dev.rinzai.zen.moneyinput.CurrencyConversion
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.performClick
import dev.rinzai.zen.timefield.TimeField
import dev.rinzai.zen.monthpicker.MonthPicker
import androidx.compose.ui.test.assertIsNotEnabled
import dev.rinzai.zen.calendar.Calendar
import dev.rinzai.zen.calendar.RangeCalendar
import dev.rinzai.zen.datepicker.DatePicker
import dev.rinzai.zen.rangeslider.RangeSlider
import dev.rinzai.zen.combobox.Combobox
import dev.rinzai.zen.combobox.ComboboxCreate
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.AnnotatedString
import dev.rinzai.zen.taginput.TagInput
import dev.rinzai.zen.commandpalette.CommandItem
import dev.rinzai.zen.commandpalette.CommandPalette
import dev.rinzai.zen.commandpalette.CommandPaletteShortcut
import dev.rinzai.zen.commandpalette.search
import androidx.compose.ui.test.withKeyDown
import androidx.compose.ui.test.hasContentDescription
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.editablecell.EditableCell
import dev.rinzai.zen.filterbar.FilterBar
import dev.rinzai.zen.filterbar.FilterChip
import dev.rinzai.zen.codeblock.CodeBlock
import androidx.compose.ui.platform.LocalClipboard
import kotlinx.coroutines.runBlocking
import java.awt.datatransfer.DataFlavor
import dev.rinzai.zen.codeinput.CodeInput
import dev.rinzai.zen.menu.MenuCheckboxItem
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuRadioGroup
import dev.rinzai.zen.menu.MenuRadioItem
import dev.rinzai.zen.menu.Menubar
import dev.rinzai.zen.menu.MenubarTrigger
import dev.rinzai.zen.menu.menuContextTrigger
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.button.Button
import androidx.compose.foundation.focusable
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.withKeyDown
import kotlin.test.Test
import kotlin.test.assertEquals

/** Keys answered as the browser answers them for the native control. */
@OptIn(ExperimentalTestApi::class)
class KeysTest {
    @Test
    fun checkboxAnswersSpaceNotEnter() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var on = false
        setContent { ZenTheme { var c by remember { mutableStateOf(false) }; Checkbox(c, { c = it; on = it }) { Text("Box") } } }
        onNodeWithText("Box").requestFocus()
        mainClock.advanceTimeBy(500)
        onNodeWithText("Box").performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(false, on)
        onNodeWithText("Box").performKeyInput { pressKey(Key.Spacebar) }
        mainClock.advanceTimeBy(500)
        assertEquals(true, on)
    }

    @Test
    fun toggleAnswersSpaceAndEnter() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var on = false
        setContent { ZenTheme { var c by remember { mutableStateOf(false) }; Column { Toggle(c, { c = it; on = it }); Text("T") } } }
        onNode(androidx.compose.ui.test.isToggleable()).requestFocus()
        mainClock.advanceTimeBy(500)
        onNode(androidx.compose.ui.test.isToggleable()).performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(true, on)
        onNode(androidx.compose.ui.test.isToggleable()).performKeyInput { pressKey(Key.Spacebar) }
        mainClock.advanceTimeBy(500)
        assertEquals(false, on)
    }

    @Test
    fun radioArrowsMoveAndChooseRoundTheGroup() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var chosen: String? = "a"
        setContent {
            ZenTheme {
                var v by remember { mutableStateOf<String?>("a") }
                RadioGroup(v, { v = it; chosen = it }, orientation = Orientation.Horizontal) {
                    Radio("a") { Text("A") }
                    Radio("b", enabled = false) { Text("B") }
                    Radio("c") { Text("C") }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        val a = onNodeWithText("A")
        a.requestFocus()
        mainClock.advanceTimeBy(500)
        a.performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(500)
        assertEquals("c", chosen)
        onNodeWithText("C").assertIsFocused()
        onNodeWithText("C").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(500)
        assertEquals("a", chosen)
        onNodeWithText("A").assertIsFocused()
        onNodeWithText("A").performKeyInput { pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(500)
        assertEquals("c", chosen)
    }

    @Test
    fun accordionArrowsMoveBetweenHeadings() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        lateinit var state: dev.rinzai.zen.accordion.AccordionState
        setContent {
            ZenTheme {
                state = dev.rinzai.zen.accordion.rememberAccordionState()
                dev.rinzai.zen.accordion.Accordion(state = state) {
                    for (n in listOf("One", "Two", "Three")) {
                        dev.rinzai.zen.accordion.AccordionItem(n) {
                            dev.rinzai.zen.accordion.AccordionTrigger(enabled = n != "Two") { Text(n) }
                            dev.rinzai.zen.accordion.AccordionContent { Text("$n body") }
                        }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        onNodeWithText("One").requestFocus()
        mainClock.advanceTimeBy(500)
        onNodeWithText("One").performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Three").assertIsFocused()
        onNodeWithText("Three").performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("One").assertIsFocused()
        onNodeWithText("One").performKeyInput { pressKey(Key.MoveEnd) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Three").assertIsFocused()
        onNodeWithText("Three").performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(setOf("Three"), state.open)
        onNodeWithText("Three body").assertExists()
        onNodeWithText("Three").performKeyInput { pressKey(Key.Spacebar) }
        mainClock.advanceTimeBy(1000)
        assertEquals(emptySet(), state.open)
        onNodeWithText("Three body").assertDoesNotExist()
    }

    @Test
    fun toolbarRovesThroughItsControlsAndTheToggleGroups() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                dev.rinzai.zen.toolbar.Toolbar(label = "Bar") {
                    dev.rinzai.zen.togglegroup.ToggleGroup(dev.rinzai.zen.togglegroup.rememberToggleGroupState("b")) {
                        dev.rinzai.zen.togglegroup.ToggleGroupItem("a") { Text("A") }
                        dev.rinzai.zen.togglegroup.ToggleGroupItem("b") { Text("B") }
                    }
                    dev.rinzai.zen.toolbar.ToolbarSeparator()
                    dev.rinzai.zen.button.Button({}) { Text("Go") }
                    dev.rinzai.zen.button.Button({}, enabled = false) { Text("Off") }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        // Tab enters at the pressed item.
        onRoot().performKeyInput { pressKey(Key.Tab) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("B").assertIsFocused()
        onNodeWithText("B").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Go").assertIsFocused()
        onNodeWithText("Go").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("A").assertIsFocused()
        onNodeWithText("A").performKeyInput { pressKey(Key.MoveEnd) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Go").assertIsFocused()
    }

    @Test
    fun segmentedArrowsChooseSkippingDisabled() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var chosen = "soft"
        setContent {
            ZenTheme {
                var v by remember { mutableStateOf("soft") }
                dev.rinzai.zen.segmented.Segmented(v, { v = it; chosen = it }, label = "Glow") {
                    SegmentedItem("off") { Text("Off") }
                    SegmentedItem("soft") { Text("Soft") }
                    SegmentedItem("dim", enabled = false) { Text("Dim") }
                    SegmentedItem("bright") { Text("Bright") }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        // Tab enters at the chosen option.
        onRoot().performKeyInput { pressKey(Key.Tab) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Soft").assertIsFocused()
        onNodeWithText("Soft").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(500)
        assertEquals("bright", chosen)
        onNodeWithText("Bright").assertIsFocused()
        onNodeWithText("Bright").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(500)
        assertEquals("off", chosen)
    }

    @Test
    fun tabArrowsShowTheTabTheyMoveTo() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        lateinit var state: dev.rinzai.zen.tabs.TabsState
        setContent {
            ZenTheme {
                state = dev.rinzai.zen.tabs.rememberTabsState("b")
                dev.rinzai.zen.tabs.Tabs(state) {
                    dev.rinzai.zen.tabs.TabList {
                        dev.rinzai.zen.tabs.Tab("a") { Text("A") }
                        dev.rinzai.zen.tabs.Tab("b") { Text("B") }
                        dev.rinzai.zen.tabs.Tab("x", enabled = false) { Text("X") }
                        dev.rinzai.zen.tabs.Tab("c") { Text("C") }
                    }
                    for (v in listOf("a", "b", "c")) dev.rinzai.zen.tabs.TabPanel(v) { Text("$v panel") }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        // Tab enters at the shown tab.
        onRoot().performKeyInput { pressKey(Key.Tab) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("B").assertIsFocused()
        onNodeWithText("B").performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(100)
        assertEquals("c", state.value)
        onNodeWithText("C").assertIsFocused()
        // Mid-slide, the last panel is on its way out, out of reach.
        onNodeWithText("b panel").assertDoesNotExist()
        onNodeWithText("c panel").assertExists()
        mainClock.advanceTimeBy(500)
        onNodeWithText("C").performKeyInput { pressKey(Key.MoveHome) }
        mainClock.advanceTimeBy(500)
        assertEquals("a", state.value)
        onNodeWithText("A").assertIsFocused()
        onNodeWithText("A").performKeyInput { pressKey(Key.DirectionLeft) }
        mainClock.advanceTimeBy(500)
        assertEquals("c", state.value)
        // Tab leaves the list for the panel.
        onNodeWithText("C").performKeyInput { pressKey(Key.Tab) }
        mainClock.advanceTimeBy(500)
        onNodeWithText("c panel", useUnmergedTree = true).assertExists()
    }

    @Test
    fun confirmDialogOpensOnCancelSoEnterIsSafe() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var confirmed = false
        var open by mutableStateOf(false)
        setContent { ZenTheme { ConfirmDialog(open, { open = it }, "Delete?", "Delete", { confirmed = true }) } }
        open = true
        mainClock.advanceTimeBy(500)
        onNodeWithText("Cancel").assertIsFocused()
        onNodeWithText("Cancel").performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(false, confirmed)
        assertEquals(false, open)
    }

    @Test
    fun selectOpensOnArrowsSkipsDisabledJumpsByTypingAndChoosesOnEnter() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var value by mutableStateOf<String?>("rent")
        setContent {
            ZenTheme {
                Select(value, { value = it }, label = "Category") {
                    SelectItem("rent", "Rent")
                    SelectItem("travel", "Travel", enabled = false)
                    SelectItem("health", "Health")
                    SelectItem("dining", "Dining out")
                }
            }
        }
        mainClock.advanceTimeBy(500)
        val trigger = onNodeWithContentDescription("Category")
        trigger.requestFocus()
        mainClock.advanceTimeBy(500)
        trigger.performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(500)
        // From Rent, past the disabled Travel, to Health.
        onRoot().performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals("health", value)
        trigger.performKeyInput { pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(500)
        onRoot().performKeyInput { pressKey(Key.D); pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals("dining", value)
    }

    @Test
    fun numberFieldStepsLimitsAndClampsWhatsTyped() = runComposeUiTest {
        // The theme's light never rests, so the clock is moved by hand.
        mainClock.autoAdvance = false
        var value by mutableStateOf<Double?>(2.0)
        val commits = mutableListOf<Pair<Double?, NumberFieldChange>>()
        setContent {
            ZenTheme {
                NumberField(value, { n, _ -> value = n }, min = 1.0, max = 12.0, label = "People", onValueCommit = { n, c -> commits += n to c })
            }
        }
        mainClock.advanceTimeBy(500)
        val field = onNode(hasSetTextAction())
        field.requestFocus()
        mainClock.advanceTimeBy(500)
        field.performKeyInput { pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(500)
        assertEquals(3.0, value)
        assertEquals(3.0 to NumberFieldChange.Step(1.0), commits.last())
        field.performKeyInput { pressKey(Key.MoveEnd) }
        mainClock.advanceTimeBy(500)
        assertEquals(12.0 to NumberFieldChange.Limit, commits.last())
        field.performTextReplacement("5")
        mainClock.advanceTimeBy(500)
        assertEquals(5.0, value)
        field.performTextReplacement("40")
        field.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        // Typed past the top, it's kept to it once finished.
        assertEquals(12.0, value)
        assertEquals(12.0 to NumberFieldChange.Input, commits.last())
    }

    @Test
    fun moneyInputCommitsShorthandOnEnterAndRevertsOnEscape() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<Money?>(500)
        setContent {
            ZenTheme { MoneyInput(value, { value = it }, "INR", locale = "en-IN", label = "Amount") }
        }
        mainClock.advanceTimeBy(500)
        val field = onNode(hasSetTextAction())
        field.requestFocus()
        field.performTextReplacement("1.5k")
        field.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(150000L, value)
        field.assertTextEquals("1,500")
        field.performTextReplacement("abc")
        field.performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(500)
        // Escape puts back what was saved, and nothing is saved.
        assertEquals(150000L, value)
        field.assertTextEquals("1,500")
        field.performTextReplacement("abc")
        field.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals(150000L, value)
        field.assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Error))
    }

    @Test
    fun moneyInputConvertsWhatsTypedInAnotherCurrency() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<Money?>(null)
        var original: ForeignAmount? = null
        val convert = CurrencyConversion(
            currencies = listOf("USD"),
            loadRates = { RateTable("EUR", "2026-09-29", mapOf("INR" to 98.4, "USD" to 1.17)) },
            onForeign = { original = it },
        )
        setContent {
            ZenTheme { MoneyInput(value, { value = it }, "INR", locale = "en-IN", allowEmpty = true, convert = convert, label = "Amount") }
        }
        mainClock.advanceTimeBy(500)
        onNodeWithContentDescription("Currency: INR", substring = true).performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithText("USD").performClick()
        mainClock.advanceTimeBy(500)
        val field = onNode(hasSetTextAction())
        field.requestFocus()
        field.performTextReplacement("100")
        field.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        // 100 × 98.4 / 1.17
        assertEquals(841026L, value)
        assertEquals("USD", original?.currency)
        assertEquals(10000L, original?.amount)
    }

    @Test
    fun timeFieldTypesStepsAndClearsAPartAtATime() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<String?>("09:30")
        setContent {
            ZenTheme { TimeField(value, { value = it }, step = 15, locale = "en-US", label = "At") }
        }
        mainClock.advanceTimeBy(500)
        val hour = onNodeWithContentDescription("Hour")
        hour.requestFocus()
        // "1" could be 10 to 12, so it waits; "2" makes 12 and moves on to the minute.
        hour.performKeyInput { pressKey(Key.One); pressKey(Key.Two) }
        mainClock.advanceTimeBy(500)
        assertEquals("00:30", value)
        onNodeWithContentDescription("Minute").assertIsFocused()
        // From :30 down a step of 15, then up past the hour, round to :00.
        onNodeWithContentDescription("Minute").performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.DirectionUp); pressKey(Key.DirectionUp); pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(500)
        assertEquals("00:00", value)
        onNodeWithContentDescription("Minute").performKeyInput { pressKey(Key.DirectionRight); pressKey(Key.P) }
        mainClock.advanceTimeBy(500)
        assertEquals("12:00", value)
        onNodeWithContentDescription("AM/PM").performKeyInput { pressKey(Key.Backspace) }
        mainClock.advanceTimeBy(500)
        assertEquals(null, value)
    }

    @Test
    fun monthPickerShowsTheChosenYearAndKeepsToItsRange() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<String?>("2027-09")
        setContent {
            ZenTheme { MonthPicker(value, { value = it }, locale = "en-US", min = "2026-11", clearable = true, label = "Ends") }
        }
        mainClock.advanceTimeBy(500)
        onNodeWithContentDescription("Ends").performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithText("2027").assertExists()
        onNodeWithContentDescription("Previous year").performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithContentDescription("October 2026").assertIsNotEnabled()
        onNodeWithContentDescription("December 2026").performClick()
        mainClock.advanceTimeBy(500)
        assertEquals("2026-12", value)
        onNodeWithContentDescription("Ends").performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithText("Clear").performClick()
        mainClock.advanceTimeBy(500)
        assertEquals(null, value)
    }

    @Test
    fun calendarMovesByDayWeekAndMonthAndPicksARange() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<DateString?>("2026-09-30")
        var range by mutableStateOf<DateRange?>(null)
        setContent {
            ZenTheme {
                Column {
                    Calendar(value, { value = it }, locale = "en-US", max = "2026-11-15")
                    RangeCalendar(range, { range = it }, locale = "en-GB", defaultMonth = "2026-10")
                }
            }
        }
        mainClock.advanceTimeBy(500)
        val day = onNodeWithContentDescription("Wednesday, September 30, 2026")
        day.requestFocus()
        // A day on, a week back, then to the week's start (Sunday in the US).
        day.performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Thursday, October 1, 2026").assertIsFocused().performKeyInput { pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Thursday, September 24, 2026").assertIsFocused().performKeyInput { pressKey(Key.MoveHome) }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Sunday, September 20, 2026").assertIsFocused().performKeyInput { pressKey(Key.PageDown); pressKey(Key.PageDown) }
        mainClock.advanceTimeBy(300)
        // Kept to max.
        onNodeWithContentDescription("Sunday, November 15, 2026").assertIsFocused().performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(300)
        assertEquals("2026-11-15", value)

        onNodeWithContentDescription("Monday, 12 October 2026").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(DateRange("2026-10-12", null), range)
        onNodeWithContentDescription("Monday, 5 October 2026").performClick()
        mainClock.advanceTimeBy(300)
        // Either way round.
        assertEquals(DateRange("2026-10-05", "2026-10-12"), range)
    }

    @Test
    fun datePickerOpensOnTheChosenDayForTheKeyboard() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf<DateString?>("2026-09-30")
        setContent {
            ZenTheme { DatePicker(value, { value = it }, locale = "en-US", clearable = true, label = "Due") }
        }
        mainClock.advanceTimeBy(500)
        onNodeWithText("Sep 30, 2026").assertExists()
        onNodeWithContentDescription("Due").performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithContentDescription("Wednesday, September 30, 2026").assertIsFocused()
            .performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals("2026-10-07", value)
        // Picking closes it.
        onNodeWithContentDescription("Choose date").assertDoesNotExist()
        onNodeWithContentDescription("Due").performClick()
        mainClock.advanceTimeBy(500)
        onNodeWithText("Clear").performClick()
        mainClock.advanceTimeBy(500)
        assertEquals(null, value)
    }

    @Test
    fun rangeSliderThumbsStepAndMeetButNeverCross() = runComposeUiTest {
        mainClock.autoAdvance = false
        var value by mutableStateOf(50f..500f)
        val commits = mutableListOf<ClosedFloatingPointRange<Float>>()
        setContent {
            ZenTheme { RangeSlider(value, { value = it }, "Amount", min = 0f, max = 1000f, step = 10f, onValueCommit = { commits += it }) }
        }
        mainClock.advanceTimeBy(500)
        val high = onNodeWithContentDescription("Maximum")
        high.requestFocus()
        high.performKeyInput { pressKey(Key.DirectionRight); pressKey(Key.PageUp) }
        mainClock.advanceTimeBy(300)
        assertEquals(50f..610f, value)
        assertEquals(50f..610f, commits.last())
        // Home takes it as low as the other thumb, no further.
        high.performKeyInput { pressKey(Key.MoveHome) }
        mainClock.advanceTimeBy(300)
        assertEquals(50f..50f, value)
        onNodeWithContentDescription("Minimum").apply { requestFocus() }.performKeyInput { pressKey(Key.MoveEnd) }
        mainClock.advanceTimeBy(300)
        assertEquals(50f..50f, value)
    }

    @Test
    fun comboboxSearchesMovesChoosesAndAddsWhatWasTyped() = runComposeUiTest {
        mainClock.autoAdvance = false
        var tags by mutableStateOf(listOf("Essential", "Shared", "Work", "Treat", "Annual"))
        var chosen by mutableStateOf(listOf("Essential"))
        setContent {
            ZenTheme {
                Combobox(tags, chosen, { chosen = it }) {
                    ComboboxTrigger(label = "Tags")
                    ComboboxPopup {
                        ComboboxSearch()
                        ComboboxList<String> { ComboboxCreate({ tags = tags + it; chosen = chosen + it }) }
                    }
                }
            }
        }
        mainClock.advanceTimeBy(500)
        val trigger = onNodeWithContentDescription("Tags")
        trigger.requestFocus()
        trigger.performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(500)
        val search = onNodeWithContentDescription("Search options")
        search.assertIsFocused().performTextInput("t")
        mainClock.advanceTimeBy(300)
        // "t" leaves Essential and Treat.
        onNodeWithText("Work").assertDoesNotExist()
        search.performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.DirectionDown); pressKey(Key.Enter) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("Essential", "Treat"), chosen)
        // Choosing several keeps it open; a new name is added with Enter.
        search.performTextReplacement("Gifts")
        mainClock.advanceTimeBy(300)
        onNodeWithText("Add Gifts").assertExists()
        search.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("Essential", "Treat", "Gifts"), chosen)
        search.performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(500)
        // Escape returns to the field; only the chips that fit are announced, the rest behind "+N".
        trigger.assertIsFocused().assert(SemanticsMatcher.expectValue(SemanticsProperties.Text, listOf(AnnotatedString("Essential"))))
        onNodeWithContentDescription("Remove Essential").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("Treat", "Gifts"), chosen)
    }

    @Test
    fun tagInputAddsOnEnterCommaPasteAndBlurAndTakesTheLastBack() = runComposeUiTest {
        mainClock.autoAdvance = false
        var tags by mutableStateOf(listOf("groceries"))
        setContent {
            ZenTheme {
                TagInput(tags, { tags = it }, label = "Labels", validate = { !it.startsWith("x") })
            }
        }
        mainClock.advanceTimeBy(300)
        val input = onNodeWithContentDescription("Labels")
        input.requestFocus()
        input.performTextInput(" weekly ")
        input.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("groceries", "weekly"), tags)
        // A comma adds what's typed; a pasted list adds each, kept once and only if valid.
        input.performTextInput("food")
        input.performTextInput(",")
        input.performTextInput("weekly, home,xmas\nwork")
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("groceries", "weekly", "food", "home", "work"), tags)
        input.assertTextEquals("")
        // Backspace in the empty field takes the last back to edit.
        input.performKeyInput { pressKey(Key.Backspace) }
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("groceries", "weekly", "food", "home"), tags)
        input.assertTextEquals("work")
        // Leaving the field (here for a ×) adds what's left in it.
        onNodeWithContentDescription("Remove weekly").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(listOf("groceries", "food", "home", "work"), tags)
    }

    @Test
    fun commandPaletteSearchesRanksAndRunsFromTheKeyboard() = runComposeUiTest {
        mainClock.autoAdvance = false
        var open by mutableStateOf(false)
        var ran by mutableStateOf<String?>(null)
        val items = listOf(
            CommandItem("Overview", { ran = "Overview" }, group = "Pages"),
            CommandItem("Import a statement", { ran = "Import" }, group = "Actions", keywords = listOf("csv")),
            CommandItem("Export to CSV", { ran = "Export" }, group = "Actions"),
            CommandItem("CSV settings", { ran = "Settings" }, group = "Pages"),
        )
        // Every word must match; labels starting with the query come first.
        assertEquals(listOf("CSV settings", "Import a statement", "Export to CSV"), search(items, "csv").map { it.label })
        assertEquals(listOf("Import a statement"), search(items, "actions csv sta").map { it.label })
        setContent {
            ZenTheme {
                CommandPaletteShortcut({ open = true })
                Toggle(false, {}, label = "Elsewhere")
                CommandPalette(open, { open = it }, items, label = "Commands")
            }
        }
        mainClock.advanceTimeBy(300)
        val elsewhere = onNodeWithContentDescription("Elsewhere")
        elsewhere.requestFocus()
        elsewhere.performKeyInput { withKeyDown(Key.CtrlLeft) { pressKey(Key.K) } }
        mainClock.advanceTimeBy(500)
        assertEquals(true, open)
        val input = onNode(hasContentDescription("Commands") and hasSetTextAction()).assertIsFocused()
        input.performTextInput("csv")
        mainClock.advanceTimeBy(300)
        onNodeWithText("Overview").assertDoesNotExist()
        // Down twice from the first match, round past the end and back.
        input.performKeyInput { pressKey(Key.DirectionDown); pressKey(Key.DirectionDown); pressKey(Key.DirectionDown); pressKey(Key.DirectionUp) }
        mainClock.advanceTimeBy(300)
        input.performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(500)
        assertEquals("Export", ran)
        assertEquals(false, open)
        // Escape closes it, and focus goes back where it was; it opens afresh.
        open = true
        mainClock.advanceTimeBy(500)
        onNodeWithText("Export to CSV").assertExists()
        input.assertIsFocused().performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(500)
        assertEquals(false, open)
        elsewhere.assertIsFocused()
    }

    @Test
    fun dialogGivesFocusBackToTheControlItWasOpenedFrom() = runComposeUiTest {
        mainClock.autoAdvance = false
        var open by mutableStateOf(false)
        setContent {
            ZenTheme {
                Column {
                    Toggle(false, {}, label = "Before")
                    Toggle(false, {}, label = "Opener")
                }
                Dialog(open, { open = it }, "Settings") { Toggle(false, {}, label = "Inside") }
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Opener").requestFocus()
        open = true
        mainClock.advanceTimeBy(500)
        onNodeWithContentDescription("Inside").assertIsFocused().performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(500)
        assertEquals(false, open)
        onNodeWithContentDescription("Opener").assertIsFocused()
    }

    @Test
    fun editableCellEditsInPlaceWithItsEditorFocused() = runComposeUiTest {
        mainClock.autoAdvance = false
        var amount by mutableStateOf<Long?>(1850000)
        setContent {
            ZenTheme {
                EditableCell(
                    formatMoney(amount ?: 0, "INR", "en-IN", showDecimals = false),
                    { close -> MoneyInput(amount, { amount = it; close() }, "INR", locale = "en-IN", onCancel = close, compact = true, label = "Rent") },
                    label = "Rent",
                )
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Rent. Edit").performClick()
        mainClock.advanceTimeBy(300)
        val field = onNode(hasContentDescription("Rent") and hasSetTextAction()).assertIsFocused()
        // Escape cancels: back to the value, unchanged.
        field.performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("Rent. Edit").assertExists()
        assertEquals(1850000L, amount)
        onNodeWithContentDescription("Rent. Edit").performClick()
        mainClock.advanceTimeBy(300)
        onNode(hasContentDescription("Rent") and hasSetTextAction()).performTextReplacement("19000")
        onNode(hasContentDescription("Rent") and hasSetTextAction()).performKeyInput { pressKey(Key.Enter) }
        mainClock.advanceTimeBy(300)
        assertEquals(1900000L, amount)
        onNodeWithText("19,000", substring = true).assertExists()
    }

    @Test
    fun filterBarRemovesChipsAndOffersClearAllForTwoOrMore() = runComposeUiTest {
        mainClock.autoAdvance = false
        var on by mutableStateOf(listOf("amount", "tag"))
        setContent {
            ZenTheme {
                FilterBar(on, onClear = { on = emptyList() }) { key -> FilterChip({ on = on - key }, removeLabel = "Remove $key") { Text(key) } }
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithText("Clear all").assertExists()
        onNodeWithContentDescription("Remove amount").performClick()
        mainClock.advanceTimeBy(600)
        assertEquals(listOf("tag"), on)
        // Gone once it has faded out, and with one left there's nothing to clear all of.
        onNodeWithText("amount").assertDoesNotExist()
        onNodeWithText("Clear all").assertDoesNotExist()
        on = listOf("amount", "tag")
        mainClock.advanceTimeBy(300)
        onNodeWithText("Clear all").performClick()
        mainClock.advanceTimeBy(300)
        assertEquals(emptyList(), on)
        onNodeWithContentDescription("Active filters").assertDoesNotExist()
    }

    @Test
    @OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class)
    fun codeBlockCopiesItsCodeAndSaysSoForAWhile() = runComposeUiTest {
        mainClock.autoAdvance = false
        var clipboard: androidx.compose.ui.platform.Clipboard? = null
        setContent {
            ZenTheme {
                clipboard = LocalClipboard.current
                CodeBlock("\n  pnpm add @rinzai/zen\n")
            }
        }
        mainClock.advanceTimeBy(300)
        onNodeWithText("Copy").performClick()
        mainClock.advanceTimeBy(300)
        onNodeWithText("Copied").assertExists()
        val copied = runBlocking { clipboard!!.getClipEntry() }?.nativeClipEntry as? java.awt.datatransfer.Transferable
        assertEquals("pnpm add @rinzai/zen", copied?.getTransferData(DataFlavor.stringFlavor))
        mainClock.advanceTimeBy(1600)
        onNodeWithText("Copy").assertExists()
    }

    @Test
    fun codeInputKeepsAllowedCharactersAndCompletesOnce() = runComposeUiTest {
        mainClock.autoAdvance = false
        var code by mutableStateOf("")
        val completed = mutableListOf<String>()
        setContent { ZenTheme { CodeInput(code, { code = it }, length = 4, onComplete = { completed += it }, label = "Code") } }
        mainClock.advanceTimeBy(300)
        val field = onNodeWithContentDescription("Code")
        field.requestFocus()
        field.performTextInput("1a2")
        mainClock.advanceTimeBy(100)
        assertEquals("12", code)
        // A pasted code fills the rest; past the length is dropped.
        field.performTextInput("3-456")
        mainClock.advanceTimeBy(100)
        assertEquals("1234", code)
        assertEquals(listOf("1234"), completed)
        field.performKeyInput { pressKey(Key.Backspace) }
        mainClock.advanceTimeBy(100)
        assertEquals("123", code)
        field.performTextInput("9")
        mainClock.advanceTimeBy(100)
        assertEquals(listOf("1234", "1239"), completed)
    }

    @Test
    fun calendarHeatmapNamesEachDayWithItsFigureAndPicksOne() = runComposeUiTest {
        mainClock.autoAdvance = false
        var picked by mutableStateOf<String?>(null)
        setContent { ZenTheme { CalendarHeatmap("2026-09", mapOf("2026-09-03" to 1200), locale = "en-US", onSelectedChange = { picked = it }, selected = picked) } }
        mainClock.advanceTimeBy(300)
        onNodeWithContentDescription("September 2026").assertExists()
        val third = onNodeWithContentDescription("${formatDate("2026-09-03", "en-US", DateStyle.Day)}: 1,200")
        third.performClick()
        mainClock.advanceTimeBy(100)
        assertEquals("2026-09-03", picked)
        third.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
        // Days with nothing say so, and are buttons too.
        onNodeWithContentDescription("${formatDate("2026-09-04", "en-US", DateStyle.Day)}: 0").performClick()
        mainClock.advanceTimeBy(100)
        assertEquals("2026-09-04", picked)
    }

    @Test
    fun menuCheckboxAndRadioItemsChooseAndStayOpen() = runComposeUiTest {
        mainClock.autoAdvance = false
        var notes by mutableStateOf(false)
        var sort by mutableStateOf("date")
        setContent {
            ZenTheme {
                val menu = rememberMenuState()
                Button(menu::toggle, Modifier.menuTrigger(menu)) { Text("View") }
                MenuContent(menu) {
                    MenuCheckboxItem(notes, { notes = it }) { Text("Notes") }
                    MenuRadioGroup(sort, { sort = it }, label = "Sort by") {
                        MenuRadioItem("date") { Text("Newest first") }
                        MenuRadioItem("amount") { Text("Largest first") }
                    }
                }
            }
        }
        onNodeWithText("View").performClick()
        mainClock.advanceTimeBy(400)
        onNodeWithText("Notes").assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Off)).performClick()
        mainClock.advanceTimeBy(400)
        assertEquals(true, notes)
        onNodeWithText("Notes").assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
        onNodeWithText("Largest first").performClick()
        mainClock.advanceTimeBy(400)
        assertEquals("amount", sort)
        onNodeWithText("Largest first").assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
        onNodeWithText("Newest first").assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Off))
    }

    @Test
    fun menubarArrowsGoFromMenuToMenu() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                Menubar(label = "Ledger") {
                    val file = rememberMenuState()
                    MenubarTrigger(file) { Text("File") }
                    MenuContent(file) { MenuItem({}) { Text("New entry") } }
                    val edit = rememberMenuState()
                    MenubarTrigger(edit) { Text("Edit") }
                    MenuContent(edit) { MenuItem({}) { Text("Undo") } }
                }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("File").requestFocus()
        // Closed, the arrows move along the bar.
        onRoot().performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Edit").assertIsFocused()
        onRoot().performKeyInput { pressKey(Key.DirectionLeft) }
        mainClock.advanceTimeBy(100)
        onNodeWithText("File").assertIsFocused()
        // Down opens one at its first item; from there the arrows across open the next.
        onRoot().performKeyInput { pressKey(Key.DirectionDown) }
        mainClock.advanceTimeBy(400)
        onNodeWithText("New entry").assertIsFocused()
        onRoot().performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(400)
        onNodeWithText("Undo").assertIsFocused()
        onNodeWithText("New entry").assertDoesNotExist()
        onRoot().performKeyInput { pressKey(Key.DirectionRight) }
        mainClock.advanceTimeBy(400)
        onNodeWithText("New entry").assertIsFocused()
    }

    @Test
    fun contextMenuOpensFromTheKeyboard() = runComposeUiTest {
        mainClock.autoAdvance = false
        setContent {
            ZenTheme {
                val menu = rememberMenuState()
                Text("Weekly shop", Modifier.menuContextTrigger(menu).focusable())
                MenuContent(menu) { MenuItem({}) { Text("Duplicate") } }
            }
        }
        mainClock.advanceTimeBy(100)
        onNodeWithText("Weekly shop").requestFocus()
        onRoot().performKeyInput { withKeyDown(Key.ShiftLeft) { pressKey(Key.F10) } }
        mainClock.advanceTimeBy(400)
        onNodeWithText("Duplicate").assertExists()
        onRoot().performKeyInput { pressKey(Key.Escape) }
        mainClock.advanceTimeBy(400)
        onNodeWithText("Duplicate").assertDoesNotExist()
        onNodeWithText("Weekly shop").assertIsFocused()
    }
}
