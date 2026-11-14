package dev.rinzai.zen.showcase.examples.treetable

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.tree.TreeCell
import dev.rinzai.zen.tree.TreeLabel
import dev.rinzai.zen.tree.TreeRow
import dev.rinzai.zen.tree.rememberTree

private class Node(val name: String, val size: String, val children: List<Node>? = null)

private val FILES = listOf(
    Node(
        "packages", "412 kB",
        listOf(
            Node("button", "6 kB", listOf(Node("index.tsx", "2 kB"), Node("index.test.tsx", "4 kB"))),
            Node("table", "14 kB", listOf(Node("index.tsx", "9 kB"))),
        ),
    ),
    Node("docs", "88 kB", listOf(Node("app", "80 kB"))),
    Node("package.json", "3 kB"),
)

/** Nested data in, visible rows out: rememberTree handles opening, closing and the animation. Start collapsed with defaultExpanded = false. */
@Composable
fun Basic() {
    val tree = rememberTree(FILES, key = { it.name + it.size }, children = { it.children })
    TableContainer(Modifier.widthIn(max = 448.dp).fillMaxWidth()) {
        Table {
            TableHeader {
                TableRow {
                    TableHead { Text("Name") }
                    TableHead(numeric = true) { Text("Size") }
                }
            }
            TableBody(tree.rows, key = { it.key }) { row ->
                TreeRow(row, tree) {
                    TreeCell {
                        ProvideText(style = if (row.hasChildren) TextStyles.medium else null) {
                            TreeLabel(row, tree) { Text(row.item.name) }
                        }
                    }
                    TreeCell(numeric = true) { Text(row.item.size, color = Zen.tokens.mutedForeground.color()) }
                }
            }
        }
    }
}
