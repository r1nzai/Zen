package dev.rinzai.zen.showcase.examples.table

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import kotlin.math.abs

private class Entry(val label: String, val category: String, val amount: Int, val recurring: Boolean)

private val ENTRIES = listOf(
    Entry("Rent", "Housing", -1850, true),
    Entry("Paycheck", "Salary", 8450, true),
    Entry("Weekly shop", "Groceries", -164, false),
)

@Composable
fun Default() {
    val t = Zen.tokens
    TableContainer(Modifier.widthIn(max = 576.dp)) {
        Table {
            TableHeader {
                TableRow {
                    TableHead { Text("Entry") }
                    TableHead { Text("Category") }
                    TableHead(numeric = true) { Text("Amount") }
                }
            }
            TableBody(ENTRIES, key = { it.label }, rise = true) { e ->
                TableRow {
                    TableCell {
                        // The badge is inline, on the label's baseline, a space after it.
                        Row {
                            Text(if (e.recurring) "${e.label} " else e.label, Modifier.alignByBaseline(), style = TextStyles.medium)
                            if (e.recurring) Badge(Modifier.alignByBaseline(), variant = BadgeVariant.Outline) { Text("Monthly") }
                        }
                    }
                    TableCell { Text(e.category, color = t.mutedForeground.color()) }
                    TableCell(numeric = true) {
                        Text(
                            "${if (e.amount > 0) "+" else "−"}$${formatNumber(abs(e.amount).toDouble(), "en-US")}",
                            color = if (e.amount > 0) t.primary.color() else androidx.compose.ui.graphics.Color.Unspecified,
                        )
                    }
                }
            }
        }
    }
}
