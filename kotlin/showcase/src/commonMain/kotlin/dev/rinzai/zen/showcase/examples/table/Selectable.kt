package dev.rinzai.zen.showcase.examples.table

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
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.table.SelectionBar
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.table.TableSelectCell
import dev.rinzai.zen.table.TableSelectHead
import dev.rinzai.zen.table.rememberTableSelection

internal class Spend(val id: Int, val label: String, val amount: String)

private val SPENDS = listOf(
    Spend(1, "Weekly shop", "−$165"),
    Spend(2, "Farmers market", "−$42"),
    Spend(3, "Train pass", "−$92"),
    Spend(4, "Dinner with Sam", "−$78"),
    Spend(5, "Birthday lunch", "−$92"),
)

/** Pick rows (shift-click for a run of them), then act on them all from the bar. */
@Composable
fun Selectable() {
    var entries by remember { mutableStateOf(SPENDS) }
    val selection = rememberTableSelection(entries.map { it.id })
    TableContainer(Modifier.widthIn(max = 512.dp).fillMaxWidth(), label = "Entries") {
        Table {
            TableHeader {
                TableRow {
                    TableSelectHead(selection)
                    TableHead { Text("Entry") }
                    TableHead(numeric = true) { Text("Amount") }
                }
            }
            TableBody(entries, key = { it.id }) { e ->
                TableRow(selected = selection.isSelected(e.id)) {
                    TableSelectCell(selection, e.id, "Select ${e.label}")
                    TableCell { Text(e.label) }
                    TableCell(numeric = true) { Text(e.amount) }
                }
            }
        }
    }
    SelectionBar(selection.selected.size, onClear = selection::clear) {
        Button({ entries = entries.filter { !selection.isSelected(it.id) } }, size = ButtonSize.Sm, tone = ButtonTone.Negative) { Text("Delete") }
        if (entries.size < SPENDS.size) {
            Button({ entries = SPENDS }, size = ButtonSize.Sm, variant = ButtonVariant.Ghost) { Text("Restore all") }
        }
    }
}
