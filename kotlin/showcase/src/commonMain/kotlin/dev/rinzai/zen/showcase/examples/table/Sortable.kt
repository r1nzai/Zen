package dev.rinzai.zen.showcase.examples.table

import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.Text
import dev.rinzai.zen.Zen
import dev.rinzai.zen.addMonths
import dev.rinzai.zen.formatMonth
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.table.rememberTableSort
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableEmpty
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import kotlin.math.max
import kotlin.math.pow

private class Payment(val month: String, val principal: Double, val interest: Double, val balance: Double)

// An amortization schedule: 240 000 over 12 months at 9%.
private val SCHEDULE: List<Payment> = run {
    var balance = 240000.0
    val rate = 0.09 / 12
    val emi = balance * rate / (1 - (1 + rate).pow(-12))
    List(12) { i ->
        val interest = balance * rate
        val principal = emi - interest
        balance -= principal
        Payment(formatMonth(addMonths("2026-10", i), "en-US"), principal, interest, max(0.0, balance))
    }
}

private val COMPARE = mapOf<String, Comparator<Payment>>(
    "principal" to compareBy { it.principal },
    "interest" to compareBy { it.interest },
    "balance" to compareBy { it.balance },
)

private fun money(n: Double) = formatNumber(n, "en-US", NumberOptions(maximumFractionDigits = 0))

/** Click a heading to sort by it, again to reverse, a third time to clear. The header stays put as the rows scroll. */
@Composable
fun Sortable() {
    val sort = rememberTableSort(SCHEDULE, COMPARE)
    val muted = Zen.tokens.mutedForeground.color()
    TableContainer(Modifier.heightIn(max = 320.dp).widthIn(max = 576.dp), label = "Repayment schedule") {
        Table {
            TableHeader {
                TableRow {
                    TableHead { Text("Month") }
                    TableHead(numeric = true, sortDirection = sort.direction("principal"), onSort = { sort.toggle("principal") }) { Text("Principal") }
                    TableHead(numeric = true, sortDirection = sort.direction("interest"), onSort = { sort.toggle("interest") }) { Text("Interest") }
                    TableHead(numeric = true, sortDirection = sort.direction("balance"), onSort = { sort.toggle("balance") }) { Text("Balance") }
                }
            }
            if (sort.rows.isEmpty()) TableEmpty()
            TableBody(sort.rows, key = { it.month }) { p ->
                TableRow {
                    TableCell { Text(p.month) }
                    TableCell(numeric = true) { Text(money(p.principal)) }
                    TableCell(numeric = true) { Text(money(p.interest), color = muted) }
                    TableCell(numeric = true) { Text(money(p.balance)) }
                }
            }
        }
    }
}
