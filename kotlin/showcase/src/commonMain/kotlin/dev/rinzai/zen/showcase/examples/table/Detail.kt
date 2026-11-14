package dev.rinzai.zen.showcase.examples.table

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.ViewTransitionStyle
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardDescription
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.control
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.viewTransition

private class Item(val id: String, val label: String, val amount: String, val date: String, val category: String, val note: String)

private val ITEMS = listOf(
    Item("shop", "Weekly shop", "−$165.20", "Oct 4", "Groceries", "Market and bakery."),
    Item("train", "Train pass", "−$92.00", "Oct 2", "Transport", "Monthly pass."),
    Item("pay", "Salary", "+$4,200.00", "Oct 1", "Income", "October."),
)

/** Open an entry and its row grows into its details (a view transition, ViewTransitionStyle.Morph). */
@Composable
fun Detail() {
    var open by remember { mutableStateOf<String?>(null) }
    val transition = Zen.viewTransition
    val go = { id: String? -> transition.start { open = id } }
    val entry = ITEMS.firstOrNull { it.id == open }
    if (entry != null) {
        Card(Modifier.widthIn(max = 512.dp).fillMaxWidth().viewTransition("entry-${entry.id}", ViewTransitionStyle.Morph)) {
            CardHeader {
                CardTitle(entry.label)
                Button({ go(null) }, size = ButtonSize.Sm, variant = ButtonVariant.Ghost) { Text("Back") }
            }
            Text(entry.amount, style = TextStyles.xl3.merge(TextStyles.semibold).merge(TextStyles.tabular))
            CardDescription("${entry.date} · ${entry.category}", Modifier.padding(top = 4.dp))
            Text(entry.note, Modifier.padding(top = 16.dp), style = TextStyles.sm)
        }
        return
    }
    val t = Zen.tokens
    TableContainer(Modifier.widthIn(max = 512.dp).fillMaxWidth(), label = "Entries") {
        Table {
            TableHeader {
                TableRow {
                    TableHead { Text("Entry") }
                    TableHead { Text("Date") }
                    TableHead(numeric = true) { Text("Amount") }
                }
            }
            TableBody(ITEMS, key = { it.id }, rise = true) { e ->
                TableRow(onClick = { go(e.id) }, viewTransition = "entry-${e.id}", viewTransitionStyle = ViewTransitionStyle.Morph) {
                    TableCell {
                        val state = rememberControlState()
                        Text(
                            e.label,
                            Modifier.control(state) { go(e.id) },
                            style = if (state.focusVisible) TextStyles.sm.copy(textDecoration = TextDecoration.Underline) else null,
                        )
                    }
                    TableCell { Text(e.date, color = t.mutedForeground.color()) }
                    TableCell(numeric = true) { Text(e.amount) }
                }
            }
        }
    }
}
