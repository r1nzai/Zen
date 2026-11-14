package dev.rinzai.zen.showcase.budget

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Money
import dev.rinzai.zen.NameStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.HostWindow
import dev.rinzai.zen.ZenTheme
import dev.rinzai.zen.animatednumber.AnimatedMoney
import dev.rinzai.zen.avatar.Avatar
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.showcase.Topo
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.breadcrumbs.Breadcrumbs
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.card.StatTone
import dev.rinzai.zen.commandpalette.CommandItem
import dev.rinzai.zen.commandpalette.CommandPalette
import dev.rinzai.zen.commandpalette.CommandPaletteShortcut
import dev.rinzai.zen.confirmdialog.ConfirmDialog
import dev.rinzai.zen.formatMonth
import dev.rinzai.zen.header.Header
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.kbd.Kbd
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuSub
import dev.rinzai.zen.menu.MenuSubContent
import dev.rinzai.zen.menu.MenuSubTrigger
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.monthpicker.MonthPicker
import dev.rinzai.zen.pageheader.PageHeader
import dev.rinzai.zen.pills.Pill
import dev.rinzai.zen.pills.Pills
import dev.rinzai.zen.rememberScrollToSection
import dev.rinzai.zen.rise
import dev.rinzai.zen.section
import dev.rinzai.zen.showcase.resources.Res
import dev.rinzai.zen.skeleton.Skeleton
import dev.rinzai.zen.sparkline.Sparkline
import dev.rinzai.zen.sparkline.SparklineTone
import dev.rinzai.zen.tabbar.TabBar
import dev.rinzai.zen.tabbar.TabBarItem
import dev.rinzai.zen.tabs.Tab
import dev.rinzai.zen.tabs.TabList
import dev.rinzai.zen.tabs.TabListVariant
import dev.rinzai.zen.tabs.TabPanel
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.themetoggle.ThemeToggle
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastAction
import dev.rinzai.zen.toast.ToastProvider
import dev.rinzai.zen.toast.ToastTone
import dev.rinzai.zen.tooltip.TooltipContent
import dev.rinzai.zen.tooltip.rememberTooltipState
import dev.rinzai.zen.tooltip.tooltipTrigger
import dev.rinzai.zen.trend.Trend
import dev.rinzai.zen.trend.TrendGood
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** The budget showcase as an app: Zen's theme and backdrop around BudgetApp. */
@Composable
fun BudgetShowcase(appearance: Appearance = Appearance.Dark, nav: Boolean = true, host: HostWindow? = null) {
    ZenTheme(appearance, host = host) {
        Backdrop(Topo)
        BudgetApp(nav)
    }
}

/** `nav = false` drops the app's own top bar and tab bar, for pages that already have one. */
@Composable
fun BudgetApp(nav: Boolean = true) = ToastProvider { Budget(nav) }

private val SECTIONS = listOf(
    "entries" to "Entries",
    "spending" to "Spending by group",
    "watch-list" to "Watch list",
    "activity" to "Recent activity",
    "goals" to "Goals",
    "appearance" to "Appearance",
)

private class StatSpec(
    val label: String,
    val value: Money,
    val change: Double?,
    val good: TrendGood,
    val tone: StatTone,
    val values: List<Double>,
    val line: SparklineTone,
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Budget(nav: Boolean) {
    val toast = LocalToaster.current
    val page = Zen.page
    val scope = rememberCoroutineScope()
    val goTo = rememberScrollToSection()
    var entries by remember { mutableStateOf(INITIAL) }
    var month by remember { mutableStateOf<String?>("2026-09") }
    var adding by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf<Entry?>(null) }
    var resetting by remember { mutableStateOf(false) }
    var importing by remember { mutableStateOf(false) }
    var searching by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var activity by remember { mutableStateOf(EARLIER) }
    var stamp by remember { mutableStateOf(0L) }
    val log = { title: String, detail: String? -> activity = listOf(Activity(++stamp, title, detail, stamp())) + activity }
    CommandPaletteShortcut({ searching = true })

    val income = entries.filter { it.kind == Kind.Income }.sumOf { it.amount }
    val spent = entries.filter { it.kind == Kind.Expense }.sumOf { it.amount }
    val add = { added: List<Entry> ->
        val next = (entries.maxOfOrNull { it.id } ?: 0) + 1
        entries = entries + added.mapIndexed { i, e -> e.copy(id = next + i) }
    }
    val refresh: () -> Unit = {
        loading = true
        scope.launch {
            delay(1400)
            loading = false
            toast("Up to date", "Totals refreshed.", ToastTone.Positive)
        }
    }
    val remove = { entry: Entry ->
        entries = entries.filter { it.id != entry.id }
        log("Entry deleted", "${entry.label}, ${money(entry.amount)}")
        toast("Entry deleted", "${entry.label}, ${money(entry.amount)}", action = ToastAction("Undo") { entries = (entries + entry).sortedBy { it.id } })
    }
    val commands = SECTIONS.map { (id, label) -> CommandItem(label, { goTo(id) }, group = "Go to") } + listOf(
        CommandItem("Add entry", { adding = true }, group = "Actions", icon = { Icon(Icons.ListBullet) }),
        CommandItem("Import a statement", { importing = true }, group = "Actions", keywords = listOf("csv", "bank", "upload")),
        CommandItem("Refresh totals", refresh, group = "Actions", icon = { Icon(Icons.ChartBar) }),
        CommandItem("Export CSV", { toast("Export started") }, group = "Actions", keywords = listOf("download")),
        CommandItem("Reset month", { resetting = true }, group = "Actions", keywords = listOf("clear")),
    )
    val trend = { before: List<Double>, now: Money -> before + now / 100.0 }
    val stats = listOf(
        StatSpec("Income", income, income / 100.0 / INCOME_BEFORE.last() - 1, TrendGood.Up, StatTone.Default, trend(INCOME_BEFORE, income), SparklineTone.Default),
        StatSpec("Spent", spent, spent / 100.0 / SPENT_BEFORE.last() - 1, TrendGood.Down, StatTone.Negative, trend(SPENT_BEFORE, spent), SparklineTone.Negative),
        StatSpec(
            "Net this month",
            income - spent,
            null,
            TrendGood.Up,
            if (income >= spent) StatTone.Positive else StatTone.Negative,
            trend(INCOME_BEFORE.mapIndexed { i, v -> v - SPENT_BEFORE[i] }, income - spent),
            SparklineTone.Default,
        ),
    )
    val md = page.atLeast(Breakpoint.Md)
    val lg = page.atLeast(Breakpoint.Lg)

    if (nav) AppHeader()
    Column(
        Modifier
            .fillMaxWidth()
            .wrapContentWidth()
            .widthIn(max = 1152.dp)
            .fillMaxWidth()
            .rise(0)
            .padding(start = if (md) 40.dp else 24.dp, end = if (md) 40.dp else 24.dp, top = if (md) 40.dp else 24.dp, bottom = if (md) 40.dp else 112.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Breadcrumbs {
                crumb("Budgets") {}
                current(month?.let { formatMonth(it, LOCALE, NameStyle.Long) } ?: "All months")
            }
            PageHeader("Month overview", lead = "Where the money went, and what's left. Click an amount to change it.") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp), itemVerticalAlignment = Alignment.CenterVertically) {
                    MonthPicker(month, { month = it }, if (page.atLeast(Breakpoint.Sm)) Modifier.width(160.dp) else Modifier.fillMaxWidth(), locale = LOCALE, label = "Month")
                    // The actions wrap as one group, so the primary action never ends up alone on a line.
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Button(refresh, variant = ButtonVariant.Outline, loading = loading) { Text(if (loading) "Refreshing" else "Refresh") }
                        Button({ adding = true }) { Text("Add entry") }
                        val tip = rememberTooltipState()
                        Button({ searching = true }, Modifier.tooltipTrigger(tip), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Search") { Icon(Icons.Search, size = 24.dp) }
                        TooltipContent(tip) {
                            Row(Modifier.padding(horizontal = 10.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("Search", style = TextStyles.xs)
                                Kbd("⌘")
                                Kbd("K")
                            }
                        }
                        val menu = rememberMenuState()
                        Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Budget actions", popupOpen = menu.open) {
                            Icon(Icons.Ellipsis)
                        }
                        MenuContent(menu) {
                            MenuItem({ importing = true }) { Text("Import statement") }
                            MenuSub {
                                MenuSubTrigger(label = "Export")
                                MenuSubContent {
                                    for (format in listOf("CSV", "PDF")) MenuItem({ toast("$format export started") }) { Text(format) }
                                }
                            }
                            MenuItem({ resetting = true }, negative = true) { Text("Reset month") }
                        }
                    }
                }
            }
        }

        StatRow(
            stats = stats.map { s ->
                @Composable { m: Modifier ->
                    Stat(
                        s.label,
                        {
                            Skeleton(loading, Modifier.padding(vertical = 4.dp).height(24.dp).width(112.dp)) {
                                AnimatedMoney(s.value, CURRENCY, locale = LOCALE)
                            }
                        },
                        m,
                        hint = s.change?.let { c -> { Trend(c, good = s.good, locale = LOCALE) { Text("on last month") } } },
                        tone = s.tone,
                    ) {
                        Skeleton(loading, Modifier.padding(top = 8.dp).height(32.dp).fillMaxWidth()) {
                            Sparkline(s.values, Modifier.padding(top = 8.dp).height(32.dp).fillMaxWidth(), tone = s.line)
                        }
                    }
                }
            },
            gap = if (lg) 24.dp else null,
        )

        val main = @Composable { m: Modifier ->
            Column(m, verticalArrangement = Arrangement.spacedBy(24.dp)) {
                Card(Modifier.section("entries", scrollMargin = 96.dp)) {
                    CardHeader {
                        CardTitle("Entries")
                        Badge(variant = BadgeVariant.Secondary) { Text("${entries.size} this month") }
                    }
                    var filter by remember { mutableStateOf("all") }
                    Tabs(filter, { filter = it }, Modifier.fillMaxWidth()) {
                        TabList(variant = TabListVariant.Pills) {
                            Tab("all") { Text("All") }
                            Tab("expense") { Text("Expenses") }
                            Tab("income") { Text("Income") }
                        }
                        for ((value, kind) in listOf("all" to null, "expense" to Kind.Expense, "income" to Kind.Income)) {
                            TabPanel(value) {
                                EntryTable(
                                    entries.filter { kind == null || it.kind == kind },
                                    onAmount = { id, amount ->
                                        val entry = entries.first { it.id == id }
                                        entries = entries.map { if (it.id == id) it.copy(amount = amount) else it }
                                        log("Amount changed", "${entry.label}: ${money(entry.amount)} → ${money(amount)}")
                                    },
                                    onDelete = { deleting = it },
                                    onAdd = { adding = true },
                                )
                            }
                        }
                    }
                }
                SpendingByGroup(entries)
            }
        }
        val side = @Composable { m: Modifier ->
            Column(m, verticalArrangement = Arrangement.spacedBy(24.dp)) {
                BudgetMeters(entries)
                RecentActivity(activity)
                Goals()
                Appearance()
            }
        }
        if (lg) {
            // A grid of three equal columns, 24dp apart: the main column spans two.
            BoxWithConstraints(Modifier.fillMaxWidth()) {
                val column = (maxWidth - 48.dp) / 3
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    main(Modifier.width(column * 2 + 24.dp))
                    side(Modifier.width(column))
                }
            }
        } else {
            main(Modifier)
            side(Modifier)
        }
    }

    if (nav) AppTabBar()

    AddEntryDialog(adding, { adding = it }) { entry ->
        add(listOf(entry))
        log("Entry added", "${entry.label}, ${money(entry.amount)}")
        toast("Entry added", "${entry.label}, ${money(entry.amount)}", ToastTone.Positive)
    }
    ImportDialog(importing, { importing = it }) { rows, from ->
        add(rows)
        log("Statement imported", "${rows.size} entries from $from")
        toast("Statement imported", "${rows.size} entries added.", ToastTone.Positive)
    }
    CommandPalette(searching, { searching = it }, commands, placeholder = "Jump to a section, or run an action…")
    ConfirmDialog(
        deleting != null,
        { if (!it) deleting = null },
        title = "Delete this entry?",
        confirmLabel = "Delete",
        onConfirm = { deleting?.let(remove) },
        description = deleting?.let { "${it.label} (${money(it.amount)}) will be removed." },
        tone = ButtonTone.Negative,
    )
    ConfirmDialog(
        resetting,
        { resetting = it },
        title = "Reset this month?",
        confirmLabel = "Reset",
        onConfirm = {
            entries = INITIAL
            log("Month reset", null)
            toast("Month reset")
        },
        description = "Every entry goes back to the sample data.",
        tone = ButtonTone.Negative,
    )
}

private val PAGES = listOf("Month" to Icons.Calendar, "Planner" to Icons.Table, "Goals" to Icons.Flag, "Settings" to Icons.Settings)

/** The app's top bar. A router would set the current page; here clicks just move it. */
@Composable
private fun AppHeader() {
    var current by remember { mutableStateOf("Month") }
    Header {
        Text("Zen", style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight))
        if (Zen.page.atLeast(Breakpoint.Md)) {
            Pills {
                for ((p, _) in PAGES) Pill({ current = p }, active = p == current) { Text(p) }
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ThemeToggle()
            Avatar("Rin", size = 32.dp, textStyle = TextStyles.xs)
        }
    }
}

/** Phone navigation, in place of the top bar's pills. */
@Composable
private fun AppTabBar() {
    var current by remember { mutableStateOf("Month") }
    TabBar(label = "Main") {
        for ((p, icon) in PAGES) TabBarItem(p, icon, onClick = { current = p }, active = p == current)
    }
}
