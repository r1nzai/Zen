package dev.rinzai.zen.showcase.examples.treetable

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.editablecell.EditableCell
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.moneyinput.MoneyInput
import dev.rinzai.zen.rememberVirtualList
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableFooter
import dev.rinzai.zen.table.TableFooterCell
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSpacerRow
import dev.rinzai.zen.table.rememberTableScrollState
import dev.rinzai.zen.tree.TreeCell
import dev.rinzai.zen.tree.TreeLabel
import dev.rinzai.zen.tree.TreeRow
import dev.rinzai.zen.tree.rememberTree

private val MONTHS = listOf("Oct", "Nov", "Dec", "Jan", "Feb", "Mar")
private val ROW_HEIGHT = 36.dp

/** A line of the plan: amounts per month, in paise; groups add up their items. */
private data class Line(val key: String, val label: String, val amounts: List<Long>? = null, val items: List<Line>? = null)

private fun item(label: String, vararg rupees: Long) = Line(label.lowercase().replace(Regex("\\W+"), "-"), label, rupees.map { it * 100 })

private val PLAN = listOf(
    Line("home", "Home", items = listOf(item("Rent", 18500, 18500, 18500, 18500, 18500, 18500), item("Electricity", 1400, 1250, 1600, 1900, 1700, 1300), item("Internet", 799, 799, 799, 799, 799, 799))),
    Line("food", "Food", items = listOf(item("Groceries", 9000, 9500, 12000, 9000, 9000, 9500), item("Dining out", 3000, 2500, 6000, 2000, 2500, 3000))),
    Line("transport", "Transport", items = listOf(item("Metro card", 1200, 1200, 1200, 1200, 1200, 1200), item("Cabs", 1500, 1800, 2500, 1500, 1200, 1600))),
)

private fun total(line: Line, month: Int): Long = line.items?.sumOf { total(it, month) } ?: line.amounts?.get(month) ?: 0

private fun inr(paise: Long) = formatMoney(paise, "INR", "en-IN", showDecimals = false)

/**
 * A budget grid like a planner: categories open into items, months run across, and the header,
 * first column and totals stay put while it scrolls either way. Click an amount to change it. Rows
 * are virtualized, so long plans stay fast.
 */
@Composable
fun Planner() {
    var plan by remember { mutableStateOf(PLAN) }
    val tree = rememberTree(plan, key = { it.key }, children = { it.items }, rowHeight = ROW_HEIGHT)
    val shown = tree.rows
    val scroll = rememberTableScrollState()
    val rows = rememberVirtualList(shown.size, ROW_HEIGHT, scroll, overscan = 12)
    fun setAmount(key: String, month: Int, paise: Long?) {
        plan = plan.map { group -> group.copy(items = group.items?.map { if (it.key == key) it.copy(amounts = it.amounts!!.mapIndexed { m, a -> if (m == month) paise ?: 0 else a }) else it }) }
    }
    TableContainer(Modifier.heightIn(max = 320.dp).fillMaxWidth(), label = "Budget plan", scroll = scroll) {
        Table {
            TableHeader {
                TableRow {
                    TableHead(width = 176.dp, sticky = true) { Text("Budget") }
                    for (m in MONTHS) TableHead(width = 112.dp, numeric = true) { Text(m) }
                }
            }
            TableSpacerRow(rows.paddingTop)
            TableBody(rows.items, key = { shown[it.index].key }) { at ->
                val row = shown[at.index]
                val line = row.item
                TreeRow(row, tree) {
                    TreeCell(sticky = true) {
                        ProvideText(style = if (row.hasChildren) TextStyles.medium else null) {
                            TreeLabel(row, tree) { Text(line.label, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                        }
                    }
                    MONTHS.forEachIndexed { m, month ->
                        TreeCell(numeric = true) {
                            if (row.hasChildren) Text(inr(total(line, m)), Modifier.padding(horizontal = 6.dp), color = Zen.tokens.mutedForeground.color())
                            else EditableCell(
                                inr(total(line, m)),
                                { close ->
                                    MoneyInput(
                                        total(line, m),
                                        { setAmount(line.key, m, it); close() },
                                        "INR",
                                        Modifier.width(112.dp),
                                        locale = "en-IN",
                                        allowEmpty = true,
                                        onCancel = close,
                                        compact = true,
                                        label = "${line.label}, $month",
                                    )
                                },
                                label = "${line.label}, $month: ${inr(total(line, m))}",
                            )
                        }
                    }
                }
            }
            TableSpacerRow(rows.paddingBottom)
            TableFooter {
                TableRow {
                    TableFooterCell(sticky = true) { Text("Total") }
                    MONTHS.indices.forEach { m -> TableFooterCell(numeric = true) { Text(inr(plan.sumOf { total(it, m) })) } }
                }
            }
        }
    }
}
