package dev.rinzai.zen.showcase.examples.sortable

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.radii
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList

private class Budget(val name: String, val spent: Int, val limit: Int)

private val BUDGETS = linkedMapOf(
    "rent" to Budget("Rent", 1800, 1800),
    "groceries" to Budget("Groceries", 412, 500),
    "transport" to Budget("Transport", 64, 120),
    "dining" to Budget("Eating out", 188, 150),
    "fun" to Budget("Fun", 40, 100),
)

/** Drag a budget by its grip to put them in your order (or Tab to a grip, Space, arrows, Space). */
@Composable
fun Default() {
    var order by remember { mutableStateOf(BUDGETS.keys.toList()) }
    val shape = Zen.radii.xl
    SortableList(order, { order = it }, Modifier.widthIn(max = 448.dp).fillMaxWidth(), gap = 8.dp, label = "Budgets") { id ->
        val b = BUDGETS.getValue(id)
        Row(
            Modifier.glowEdge(shape).glass(shape).padding(start = 6.dp, end = 16.dp, top = 8.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SortableHandle(id, b.name)
            Meter(b.spent.toDouble(), Modifier.weight(1f), label = b.name, max = b.limit.toDouble(), detail = "$${b.spent} / $${b.limit}")
        }
    }
}
