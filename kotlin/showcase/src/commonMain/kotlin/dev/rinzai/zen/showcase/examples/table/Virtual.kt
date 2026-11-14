package dev.rinzai.zen.showcase.examples.table

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import dev.rinzai.zen.table.rememberTableScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.Zen
import dev.rinzai.zen.addDays
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.rememberVirtualList
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSpacerRow

private val ROW_HEIGHT = 40.dp
private val PAYEES = listOf("Grocer", "Metro", "Landlord", "Cafe", "Pharmacy", "Bookshop", "Cinema", "Utilities")

private class Transaction(val id: Int, val date: String, val payee: String, val amount: Long)

// 10,000 transactions, generated.
private val ROWS = List(10000) { i ->
    Transaction(i + 1, formatDate(addDays("2026-01-01", i / 28), "en-US", DateStyle.Day), PAYEES[(i * 7) % PAYEES.size], ((i * 7919L) % 20000) + 150)
}

/** 10,000 rows, but only the ones in view (plus a few either side) are had: rememberVirtualList with spacer rows. */
@Composable
fun Virtual() {
    val scroll = rememberTableScrollState()
    val rows = rememberVirtualList(ROWS.size, ROW_HEIGHT, scroll, overscan = 8)
    val cell = Modifier.height(ROW_HEIGHT)
    TableContainer(Modifier.widthIn(max = 576.dp).fillMaxWidth().height(384.dp), label = "Transactions", scroll = scroll) {
        Table {
            TableHeader {
                TableRow {
                    TableHead(width = 80.dp, numeric = true) { Text("#") }
                    TableHead { Text("Date") }
                    TableHead { Text("Payee") }
                    TableHead(numeric = true) { Text("Amount") }
                }
            }
            TableSpacerRow(rows.paddingTop)
            TableBody(rows.items, key = { it.index }) { item ->
                val r = ROWS[item.index]
                TableRow {
                    TableCell(cell, numeric = true) { Text("${r.id}", color = Zen.tokens.mutedForeground.color()) }
                    TableCell(cell) { Text(r.date) }
                    TableCell(cell) { Text(r.payee) }
                    TableCell(cell, numeric = true) { Text(formatMoney(r.amount, "USD", "en-US")) }
                }
            }
            TableSpacerRow(rows.paddingBottom)
        }
    }
}
