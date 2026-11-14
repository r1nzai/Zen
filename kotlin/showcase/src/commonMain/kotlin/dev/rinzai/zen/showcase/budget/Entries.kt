package dev.rinzai.zen.showcase.budget

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.chart.AllocationBar
import dev.rinzai.zen.chart.AllocationItem
import dev.rinzai.zen.collapse.Collapse
import dev.rinzai.zen.describeRepeat
import dev.rinzai.zen.editablecell.EditableCell
import dev.rinzai.zen.emptystate.EmptyState
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.Money
import dev.rinzai.zen.moneyinput.MoneyInput
import dev.rinzai.zen.pagination.Pagination
import dev.rinzai.zen.section
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableEmpty
import dev.rinzai.zen.table.TableFooter
import dev.rinzai.zen.table.TableFooterCell
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.rememberTableSort
import dev.rinzai.zen.textGlow
import dev.rinzai.zen.tree.TreeCell
import dev.rinzai.zen.tree.TreeLabel
import dev.rinzai.zen.tree.TreeRow
import dev.rinzai.zen.tree.rememberTree
import kotlin.math.abs

private val COMPARE = mapOf<String, Comparator<Entry>>(
    "label" to compareBy { it.label.lowercase() },
    "amount" to compareBy { signed(it) },
)

private const val PAGE = 6

/** Sortable and paged, with amounts edited in place and tags that collapse to "+N". */
@Composable
internal fun ColumnScope.EntryTable(entries: List<Entry>, onAmount: (Int, Money) -> Unit, onDelete: (Entry) -> Unit, onAdd: () -> Unit) {
    val t = Zen.tokens
    val sm = Zen.page.atLeast(Breakpoint.Sm)
    val sort = rememberTableSort(entries, COMPARE)
    val rows = sort.rows
    val total = entries.sumOf { signed(it) }
    val pages = maxOf(1, (rows.size + PAGE - 1) / PAGE)
    var chosen by remember { mutableIntStateOf(1) }
    // Deleting the last entry on the last page leaves you on the page before.
    val page = minOf(chosen, pages)
    TableContainer(Modifier.padding(top = 16.dp), label = "Entries") {
        Table {
            TableHeader {
                TableRow {
                    TableHead(sortDirection = sort.direction("label"), onSort = { sort.toggle("label") }) { Text("Entry") }
                    if (sm) TableHead(fraction = 0.4f) { Text("Tags") }
                    TableHead(numeric = true, sortDirection = sort.direction("amount"), onSort = { sort.toggle("amount") }) { Text("Amount") }
                    TableHead {}
                }
            }
            if (rows.isEmpty()) {
                TableEmpty {
                    EmptyState("Nothing here yet", description = "Add an entry, or import a bank statement.", icon = Icons.ListBullet) {
                        Button(onAdd, size = ButtonSize.Sm) { Text("Add entry") }
                    }
                }
            }
            TableBody(rows.drop((page - 1) * PAGE).take(PAGE), key = { it.id }, rise = true) { e ->
                val menu = rememberMenuState()
                val income = e.kind == Kind.Income
                TableRow(contextMenu = menu) {
                    TableCell {
                        Column {
                            Text(e.label, style = TextStyles.medium)
                            val repeat = e.repeat?.let { " · ${describeRepeat(it, LOCALE).lowercase()}" } ?: ""
                            Text(categoryOf(e.category).label + repeat, style = TextStyles.xs, color = t.mutedForeground.color())
                        }
                    }
                    if (sm) TableCell(width = 192.dp) { TagList(e.tags) }
                    TableCell(width = if (sm) 144.dp else null, numeric = true, padding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)) {
                        val text = (if (income) "+" else "−") + money(e.amount)
                        EditableCell(
                            text,
                            editor = { close ->
                                MoneyInput(
                                    e.amount,
                                    { v -> if (v != null && v > 0) onAmount(e.id, v); close() },
                                    CURRENCY,
                                    locale = LOCALE,
                                    onCancel = close,
                                    compact = true,
                                    label = e.label,
                                )
                            },
                            label = "${e.label}: ${money(e.amount)}",
                            content = if (income) {
                                {
                                    Text(
                                        text,
                                        Modifier.fillMaxWidth(),
                                        style = TextStyles.sm.merge(TextStyles.tabular).merge(textGlow()).copy(textAlign = TextAlign.End),
                                        color = t.primary.color(),
                                    )
                                }
                            } else null,
                        )
                    }
                    TableCell(width = 40.dp, padding = PaddingValues(horizontal = 4.dp, vertical = 10.dp)) {
                        Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Actions for ${e.label}", popupOpen = menu.open) {
                            Icon(Icons.Ellipsis)
                        }
                        MenuContent(menu, label = "${e.label} actions") {
                            MenuItem({ onDelete(e) }, negative = true) { Text("Delete") }
                        }
                    }
                }
            }
            TableFooter {
                TableRow {
                    TableFooterCell { Text("Net") }
                    // Its own cell under Tags, gone with that column.
                    if (sm) TableFooterCell {}
                    TableFooterCell(numeric = true) {
                        Text((if (total >= 0) "+" else "−") + money(abs(total)), color = if (total >= 0) t.primary.color() else t.destructive.color())
                    }
                    TableFooterCell {}
                }
            }
        }
    }
    if (pages > 1) Pagination(page, pages, { chosen = it }, Modifier.padding(top = 16.dp))
}

/** As many tags as fit on one line; the rest behind "+N". */
@Composable
private fun TagList(tags: List<String>) {
    Collapse(tags, Modifier.fillMaxWidth(), gap = 4.dp) { tag, _ -> Badge(variant = BadgeVariant.Secondary) { Text(tag) } }
}

private class GroupRow(val name: String, var spent: Money, var budget: Money, val children: MutableList<GroupRow>? = null)

/** Groups of categories in a tree; each row's meter shows spend against its budget. */
@Composable
internal fun SpendingByGroup(entries: List<Entry>) {
    val t = Zen.tokens
    val sm = Zen.page.atLeast(Breakpoint.Sm)
    val groups = remember(entries) {
        val out = mutableListOf<GroupRow>()
        for (c in CATEGORIES) {
            if (c.group == "Income") continue
            val spent = entries.filter { it.kind == Kind.Expense && it.category == c.value }.sumOf { it.amount }
            val group = out.firstOrNull { it.name == c.group } ?: GroupRow(c.group, 0, 0, mutableListOf()).also { out += it }
            group.children!! += GroupRow(c.label, spent, c.budget)
            group.spent += spent
            group.budget += c.budget
        }
        out.toList()
    }
    val tree = rememberTree(groups, key = { it.name }, children = { it.children })
    Card(Modifier.section("spending", scrollMargin = 96.dp)) {
        CardHeader { CardTitle("Spending by group") }
        AllocationBar(
            groups.map { AllocationItem(it.name, it.name, it.spent.toDouble()) },
            label = "Spending by group",
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            formatValue = { money(it.toLong()) },
            locale = LOCALE,
        )
        TableContainer(Modifier.bleed(4.dp)) {
            Table {
                TableHeader {
                    TableRow {
                        TableHead { Text("Category") }
                        TableHead(numeric = true) { Text("Spent") }
                        if (sm) TableHead(numeric = true) { Text("Budget") }
                        TableHead(fraction = 0.4f) { Text("Used") }
                    }
                }
                TableBody(tree.rows, key = { it.key }) { row ->
                    TreeRow(row, tree) {
                        TreeCell { TreeLabel(row, tree) { Text(row.item.name, style = if (row.hasChildren) TextStyles.medium else null) } }
                        TreeCell(numeric = true) { Text(money(row.item.spent)) }
                        if (sm) TreeCell(numeric = true) { Text(money(row.item.budget), color = t.mutedForeground.color()) }
                        TreeCell(fraction = 0.4f) {
                            Meter(
                                row.item.spent.toDouble(),
                                Modifier.fillMaxWidth(),
                                max = row.item.budget.toDouble(),
                                valueText = "${money(row.item.spent)} of ${money(row.item.budget)}",
                            )
                        }
                    }
                }
            }
        }
    }
}

/** CSS's negative inline margin (-mx-*): as much wider as `by` on each side, still where it was. */
private fun Modifier.bleed(by: Dp) = layout { measurable, constraints ->
    val extra = by.roundToPx() * 2
    val wide = if (constraints.hasBoundedWidth) constraints.copy(minWidth = constraints.minWidth + extra, maxWidth = constraints.maxWidth + extra) else constraints
    val p = measurable.measure(wide)
    layout(p.width - extra, p.height) { p.place(-extra / 2, 0) }
}
