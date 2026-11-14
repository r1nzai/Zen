package dev.rinzai.zen.showcase.examples.sortable

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableItem
import dev.rinzai.zen.sortable.SortableNode
import dev.rinzai.zen.sortable.SortableTree
import dev.rinzai.zen.sortable.flattenTree

private val NAMES = mapOf("bills" to "Bills", "rent" to "Rent", "phone" to "Phone", "streaming" to "Streaming", "life" to "Lifestyle", "gym" to "Gym", "books" to "Books")
private val GROUPS = setOf("bills", "life")
private val AMOUNTS = mapOf("rent" to "$1,800", "phone" to "$45", "streaming" to "$32", "gym" to "$60", "books" to "$25")

/**
 * Budgets in groups, with SortableTree: drag one within its group, into the other, or sideways to
 * tuck it under another budget. Groups stay at the top and take budgets; budgets never sit at the
 * top on their own.
 */
@Composable
fun Groups() {
    var tree by remember {
        mutableStateOf(
            listOf(
                SortableNode("bills", listOf(SortableNode("rent"), SortableNode("phone"), SortableNode("streaming"))),
                SortableNode("life", listOf(SortableNode("gym"), SortableNode("books"))),
            ),
        )
    }
    val t = Zen.tokens
    val shape = Zen.radii.xl
    SortableTree(
        tree,
        { tree = it },
        Modifier.widthIn(max = 384.dp).fillMaxWidth(),
        accepts = { id, parent -> if (id in GROUPS) parent == null else parent != null },
        gap = 6.dp,
        label = "Budgets",
    ) {
        for (row in flattenTree(tree)) key(row.id) {
            val name = NAMES.getValue(row.id)
            SortableItem(row.id, Modifier.padding(start = 24.dp * maxOf(0, row.depth - 1))) {
                if (row.id in GROUPS) {
                    Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        SortableHandle(row.id, name)
                        ProvideText(color = t.mutedForeground.color(), style = TextStyles.xs.merge(TextStyles.medium).copy(letterSpacing = 0.025.em), transform = TextTransform.Uppercase) {
                            Text(name)
                        }
                    }
                } else {
                    Row(
                        Modifier.glowEdge(shape).glass(shape).padding(start = 6.dp, end = 16.dp, top = 6.dp, bottom = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        SortableHandle(row.id, name)
                        Text(name, Modifier.weight(1f), style = TextStyles.sm)
                        Text(AMOUNTS.getValue(row.id), style = TextStyles.sm.merge(TextStyles.tabular), color = t.mutedForeground.color())
                    }
                }
            }
        }
    }
}
