package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * Every word Zen's components show or announce, in English, as the web library's messages.ts.
 * Override any of them (a translation, or just different wording) in a subclass given to
 * LocaleProvider; the rest stay English.
 */
open class Messages {
    // Shared
    open val clear = "Clear"
    open val cancel = "Cancel"
    open val close = "Close"
    open val back = "Back"
    open val dismiss = "Dismiss"
    open val delete = "Delete"
    open fun remove(item: String) = "Remove $item"
    open val noResults = "No results"
    open val search = "Search…"
    open val expand = "Expand"
    open val collapse = "Collapse"
    open val minimum = "Minimum"
    open val increase = "Increase"
    open val hour = "Hour"
    open val minute = "Minute"
    open val dayPeriod = "AM/PM"
    open val decrease = "Decrease"
    open val maximum = "Maximum"

    // Select, Combobox, CommandPalette
    open val selectPlaceholder = "Select…"
    open val searchOptions = "Search options"
    open fun add(text: String) = "Add $text"
    open val commands = "Commands"

    // Calendar, DatePicker, MonthPicker
    open val pickDate = "Pick a date"
    open val pickDates = "Pick dates"
    open val chooseDate = "Choose date"
    open val chooseDates = "Choose dates"
    open val presets = "Presets"
    open val pickMonth = "Pick a month"
    open val chooseMonth = "Choose month"
    open val previousMonth = "Previous month"
    open val nextMonth = "Next month"
    open val previousYear = "Previous year"
    open val nextYear = "Next year"
    open fun chooseMonthAndYear(month: String) = "$month, choose month and year"
    open fun backToDays(year: Int) = "$year, back to days"

    // ColorPicker
    open val chooseColour = "Choose colour"
    open val saturationBrightness = "Saturation and brightness"
    open fun saturationBrightnessValue(saturation: Int, brightness: Int) = "Saturation $saturation%, brightness $brightness%"
    open val hue = "Hue"
    open fun hueValue(degrees: Int) = "Hue $degrees degrees"
    open val opacity = "Opacity"
    open fun opacityValue(percent: Int) = "Opacity $percent%"
    open val hex = "Hex"
    open val swatches = "Swatches"

    // IconPicker
    open val colour = "Colour"
    open val icon = "Icon"
    open val none = "none"
    open val colourNames = mapOf(
        "blue" to "Blue",
        "orange" to "Orange",
        "teal" to "Teal",
        "amber" to "Amber",
        "pink" to "Pink",
        "green" to "Green",
        "violet" to "Violet",
        "red" to "Red",
    )

    // MoneyInput
    open val currency = "Currency"
    open val yourCurrency = "Your currency"
    open fun changeCurrency(currency: String) = "Currency: $currency. Change to enter another currency"
    open val enterAmount = "Enter an amount."
    open fun notAnAmount(example: String, short: String) = "Not an amount. Try $example or $short."
    open val noNegative = "Amount can't be negative."
    open val rateFailed = "Couldn't get today's exchange rate."
    open val rateLoading = "Still getting today's rate…"
    open val otherCurrencies = "Enter in another currency, converted at today’s rate"
    open val gettingRate = "Getting today’s rate…"
    open fun ratesUnavailable(home: String) = "Couldn’t get exchange rates. Enter the amount in $home."
    open fun convertedFrom(amount: String, rate: String) = "Converted from $amount at $rate"
    open fun rateOf(currency: String, amount: String) = "1 $currency = $amount"

    // RepeatPicker and describeRepeat
    open val repeats = "Repeats"
    open val every = "Every"
    open val howMany = "How many"
    open val unit = "Unit"
    open val on = "On"
    open fun day(n: Int) = "Day $n"
    open val lastDay = "Last day"
    open val next = "Next:"
    /** `unit` is day, week, month or year. */
    open fun repeatUnit(unit: String, count: Int) = if (count == 1) unit else "${unit}s"
    open fun repeatEvery(every: Int, unit: String) = if (every == 1) "Every $unit" else "Every $every $unit"
    open fun repeatOn(rule: String, `when`: String) = "$rule on $`when`"
    open fun repeatDay(n: Int) = "day $n"
    open val repeatLastDay = "the last day"

    // Sortable
    open fun reorder(item: String) = "Reorder $item"
    open fun pickedUp(item: String, place: String) = "$item picked up, $place. Arrow keys move it, Space drops it, Escape puts it back."
    open fun dropped(item: String, place: String) = "$item dropped, $place."
    open fun movedTo(item: String, place: String) = "$item, $place."
    open fun putBack(item: String, place: String? = null) = if (place != null) "$item put back, $place." else "$item put back."
    open fun place(position: Int, count: Int) = "$position of $count"
    open fun placeIn(position: Int, count: Int, group: String) = "$position of $count in $group"

    // Canvas
    open fun resized(item: String, width: Int, height: Int) = "$item resized to $width by $height."
    open fun moved(item: String, x: Int, y: Int) = "$item moved to $x, $y."
    open fun selected(count: Int) = "$count ${if (count == 1) "item" else "items"} selected."
    open val canvasHelp = "Arrow keys move the selection, Shift with them by 10. Alt with the arrow keys resizes. Escape deselects."

    // Table
    open val nothingHere = "Nothing here yet."
    /** What a sorted column heading says of its order (the web has aria-sort, which the browser words). */
    open val sortedAscending = "Sorted ascending"
    open val sortedDescending = "Sorted descending"
    open val selectAll = "Select all"
    open fun selectedCount(count: Int) = "$count selected"
    open val clearSelection = "Clear selection"
    open val selection = "Selection"

    // Chart, Sparkline
    open val legend = "Legend"
    open fun readChart(label: String) = "$label: use the arrow keys to read values"
    open fun fromTo(first: String, last: String) = "From $first to $last"

    // Others
    open val activeFilters = "Active filters"
    open val clearAll = "Clear all"
    open val removeFilter = "Remove filter"
    open val skipToContent = "Skip to content"
    open val keypad = "Keypad"
    open val loadMore = "Load more"
    open val loadingMore = "Loading more…"
    open val progress = "Progress"
    open val onThisPage = "On this page"
    open val switchToDark = "Switch to dark theme"
    open val switchToLight = "Switch to light theme"
    open val copy = "Copy"
    open val copied = "Copied"
    open fun showMore(what: String) = "Show $what"
    open val pages = "Pages"
    open fun page(n: Int) = "Page $n"
    open val previousPage = "Previous page"
    open val nextPage = "Next page"
    open val breadcrumb = "Breadcrumb"
    open val carousel = "carousel"
    open val slide = "slide"
    open fun slideOf(n: Int, total: Int) = "$n of $total"
    open fun goToSlide(n: Int) = "Slide $n"
    open val previousSlide = "Previous slide"
    open val nextSlide = "Next slide"
    open val resize = "Resize"
    open val notifications = "Notifications (F8)"

    // SeekBar
    open val seek = "Seek"
    open fun timeOf(time: String, total: String) = "$time of $total"

    companion object {
        val English = Messages()
    }
}

val LocalMessages = staticCompositionLocalOf { Messages.English }

/**
 * The language for everything inside: `locale` formats dates, numbers and money (a component's own
 * `locale` still wins), and `messages` replaces the words components show or announce. Without one,
 * components use "en-US" and English. Nest one to change part of the page.
 */
@Composable
fun LocaleProvider(locale: String? = null, messages: Messages? = null, content: @Composable () -> Unit) =
    CompositionLocalProvider(
        LocalLocale provides (locale ?: LocalLocale.current),
        LocalMessages provides (messages ?: LocalMessages.current),
        content = content,
    )
