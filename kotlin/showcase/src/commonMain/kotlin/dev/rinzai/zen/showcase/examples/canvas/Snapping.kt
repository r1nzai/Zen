package dev.rinzai.zen.showcase.examples.canvas

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.canvas.Canvas
import dev.rinzai.zen.canvas.CanvasItem
import dev.rinzai.zen.canvas.CanvasItemRect
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii
import dev.rinzai.zen.segmented.Segmented

/** Off: items go where you drop them. Guides (`snap`): edges and centres line up with the surface and each other. Grid (`grid`, here with `snap`): they keep to a 20-unit grid, its dots showing while you drag. */
@Composable
fun Snapping() {
    var mode by remember { mutableStateOf("guides") }
    var items by remember {
        mutableStateOf(
            listOf(
                CanvasItemRect("a", 20.0, 20.0, 120.0, 70.0),
                CanvasItemRect("b", 210.0, 70.0, 100.0, 100.0),
                CanvasItemRect("c", 330.0, 30.0, 100.0, 40.0),
            ),
        )
    }
    var selected by remember { mutableStateOf(emptyList<String>()) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Segmented(mode, { mode = it }, label = "Snapping") {
            SegmentedItem("off") { Text("Off") }
            SegmentedItem("guides") { Text("Guides") }
            SegmentedItem("grid") { Text("Grid") }
        }
        Canvas(
            460, 220, items, { items = it },
            label = "Layout",
            snap = mode != "off",
            grid = if (mode == "grid") 20 else null,
            selected = selected,
            onSelectedChange = { selected = it },
        ) {
            val shape = Zen.radii.lg
            items.forEachIndexed { n, item ->
                key(item.id) {
                CanvasItem(item.id, "Card ${n + 1}", Modifier.glass(shape), shape = shape) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("${item.x.toInt()}, ${item.y.toInt()}", style = TextStyles.sm.merge(TextStyles.tabular), color = Zen.tokens.mutedForeground.color())
                    }
                }
                }
            }
        }
    }
}
