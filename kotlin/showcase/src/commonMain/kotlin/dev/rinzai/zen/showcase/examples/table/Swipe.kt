package dev.rinzai.zen.showcase.examples.table

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSwipeAction
import dev.rinzai.zen.table.TableSwipeRow

private val SWIPES = listOf(
    Spend(1, "Weekly shop", "−$165"),
    Spend(2, "Farmers market", "−$42"),
    Spend(3, "Train pass", "−$92"),
    Spend(4, "Dinner with Sam", "−$78"),
)

/** On a phone, swipe a row left for its actions; with a keyboard, tab to them. */
@Composable
fun Swipe() {
    var entries by remember { mutableStateOf(SWIPES) }
    Column(Modifier.widthIn(max = 512.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TableContainer(label = "Entries") {
            Table {
                TableHeader {
                    TableRow {
                        TableHead { Text("Entry") }
                        TableHead(numeric = true) { Text("Amount") }
                    }
                }
                TableBody(entries, key = { it.id }) { e ->
                    TableSwipeRow(
                        actions = {
                            TableSwipeAction({ entries = entries.filter { it.id != e.id } }, negative = true, label = "Delete ${e.label}") { Text("Delete") }
                        },
                    ) {
                        TableCell { Text(e.label) }
                        TableCell(numeric = true) { Text(e.amount) }
                    }
                }
            }
        }
        if (entries.size < SWIPES.size) {
            Button({ entries = SWIPES }, variant = ButtonVariant.Ghost) { Text("Bring them back") }
        }
    }
}
