package dev.rinzai.zen.showcase.examples.table

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.Icon
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableItem
import dev.rinzai.zen.sortable.SortableNode
import dev.rinzai.zen.sortable.SortableTree
import dev.rinzai.zen.sortable.flattenTree
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow

private val NAMES = mapOf(
    "home" to "Home", "rent" to "Rent", "power" to "Electricity", "internet" to "Internet", "food" to "Food",
    "groceries" to "Groceries", "dining" to "Eating out", "coffee" to "Coffee", "takeaway" to "Takeaway",
)
private val AMOUNTS = mapOf(
    "rent" to listOf(1800, 1800, 1800, 1800),
    "power" to listOf(92, 88, 75, 70),
    "internet" to listOf(60, 60, 60, 60),
    "groceries" to listOf(420, 395, 410, 430),
    "dining" to listOf(180, 150, 210, 160),
    "coffee" to listOf(42, 38, 45, 40),
    "takeaway" to listOf(64, 50, 80, 55),
)
private val MONTHS = listOf("Jul", "Aug", "Sep", "Oct")
private val CATEGORIES = setOf("home", "food")
private val CELL = PaddingValues(horizontal = 12.dp, vertical = 6.dp)

/**
 * Rows reordered by drag and drop (a SortableTree around the table, its rows SortableItems). Drag a
 * row by its grip within its category, into the other one, into an open sub-item (Eating out), or
 * under another row (drag sideways a level in or out); or Tab to a grip and use Space and the arrow
 * keys. Categories stay at the top level and can be reordered too. The first column stays in view
 * as it scrolls sideways.
 */
@Composable
fun Reorder() {
    var tree by remember {
        mutableStateOf(
            listOf(
                SortableNode("home", listOf(SortableNode("rent"), SortableNode("power"), SortableNode("internet"))),
                SortableNode("food", listOf(SortableNode("groceries"), SortableNode("dining", listOf(SortableNode("coffee"), SortableNode("takeaway"))))),
            ),
        )
    }
    var closed by remember { mutableStateOf(emptySet<String>()) }
    val t = Zen.tokens
    SortableTree(
        tree,
        { tree = it },
        Modifier.widthIn(max = 576.dp).fillMaxWidth(),
        accepts = { id, parent -> if (id in CATEGORIES) parent == null else parent != null },
    ) {
        TableContainer(label = "Planner") {
            Table(Modifier.widthIn(min = 576.dp)) {
                TableHeader {
                    TableRow {
                        TableHead(sticky = true) { Text("Item") }
                        for (m in MONTHS) TableHead(numeric = true) { Text(m) }
                    }
                }
                TableBody(flattenTree(tree) { it !in closed }, key = { it.id }) { row ->
                    val id = row.id
                    val name = NAMES.getValue(id)
                    val category = id in CATEGORIES
                    SortableItem(id) {
                        TableRow {
                            TableCell(sticky = true, padding = CELL) {
                                Row(
                                    Modifier.padding(start = 24.dp * maxOf(0, row.depth - 1)),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    SortableHandle(id, name)
                                    val kids = flattenTree(tree).count { it.parentId == id }
                                    if (!category && kids > 0) Toggle(name, open = id !in closed) {
                                        closed = if (id in closed) closed - id else closed + id
                                    }
                                    if (category) {
                                        ProvideText(color = t.mutedForeground.color(), style = TextStyles.xs.merge(TextStyles.medium).copy(letterSpacing = 0.025.em), transform = TextTransform.Uppercase) {
                                            Text(name)
                                        }
                                    } else Text(name)
                                }
                            }
                            MONTHS.indices.forEach { i ->
                                TableCell(numeric = true, padding = CELL) { Text(AMOUNTS[id]?.let { "$${it[i]}" } ?: "") }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** Opens or closes a row's sub-items. */
@Composable
private fun Toggle(name: String, open: Boolean, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val turn by animateFloatAsState(if (open) 90f else 0f, dev.rinzai.zen.transition(150))
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Box(
        Modifier
            // -ms-1
            .layout { measurable, constraints ->
                val p = measurable.measure(constraints)
                val nudge = 4.dp.roundToPx()
                layout(p.width - nudge, p.height) { p.placeRelative(-nudge, 0) }
            }
            .size(24.dp)
            .box(Zen.radii.md, shadows = focusRing(state.focusVisible))
            .control(state, onClick = onClick)
            .semantics {
                contentDescription = name
                stateDescription = if (open) "Expanded" else "Collapsed"
            },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            Icons.ChevronRightMicro,
            Modifier.rotate(if (rtl) 180f - turn else turn),
            size = 16.dp,
            color = if (state.hovered) t.foreground.color() else t.mutedForeground.color(),
        )
    }
}
