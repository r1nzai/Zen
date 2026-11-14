package dev.rinzai.zen.showcase.examples.canvas

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.canvas.Canvas
import dev.rinzai.zen.canvas.CanvasItem
import dev.rinzai.zen.canvas.CanvasItemRect
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatTone
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.radii
import dev.rinzai.zen.sparkline.Sparkline
import dev.rinzai.zen.sparkline.SparklineTone
import dev.rinzai.zen.statuspill.StatusPill
import dev.rinzai.zen.statuspill.StatusTone

private val Labels = mapOf("spent" to "Spent", "left" to "Left to spend", "budgets" to "Budgets", "balance" to "Balance")

@Composable
private fun Widget(id: String) {
    val fill = Modifier.fillMaxSize()
    when (id) {
        "spent" -> Stat("Spent", "$2,742", fill, tone = StatTone.Negative) {
            Sparkline(listOf(40.0, 52.0, 48.0, 61.0, 58.0, 66.0, 72.0, 69.0, 80.0), Modifier.padding(top = 8.dp).fillMaxWidth().weight(1f), tone = SparklineTone.Negative)
        }
        "left" -> Stat("Left to spend", "$1,258", fill, tone = StatTone.Positive)
        "budgets" -> {
            val shape = Zen.radii.xl
            val md = Zen.page.atLeast(Breakpoint.Md)
            Column(
                fill.glowEdge(shape).glass(shape).padding(if (md) 16.dp else 14.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                val sm = Zen.page.atLeast(Breakpoint.Sm)
                Text(
                    "BUDGETS",
                    style = (if (sm) TextStyles.xs else TextStyles.xs2).merge(androidx.compose.ui.text.TextStyle(letterSpacing = androidx.compose.ui.unit.TextUnit(0.1f, androidx.compose.ui.unit.TextUnitType.Em))),
                    color = Zen.tokens.mutedForeground.color(),
                )
                Meter(207.0, label = "Groceries", max = 600.0, detail = "$207 / $600")
                Meter(170.0, label = "Dining out", max = 150.0, detail = "$170 / $150")
                Meter(64.0, label = "Transport", max = 120.0, detail = "$64 / $120")
                Meter(310.0, label = "Bills", max = 340.0, detail = "$310 / $340")
            }
        }
        "balance" -> Stat("Balance", "$18,400", fill) {
            Sparkline(listOf(12.0, 13.0, 13.5, 14.0, 15.2, 15.0, 16.4, 17.1, 18.4), Modifier.padding(top = 8.dp).fillMaxWidth().weight(1f))
        }
    }
}

/**
 * A dashboard you lay out yourself: widgets on a 20-unit `grid`, lining up with each other as you drag
 * (`snap`), with `minSize` so none gets too small. Widgets are any content; here Stat, Meter and
 * Sparkline. `onItemsChangeEnd` is the moment to save the layout.
 */
@Composable
fun Dashboard() {
    var items by remember {
        mutableStateOf(
            listOf(
                CanvasItemRect("spent", 0.0, 0.0, 220.0, 140.0),
                CanvasItemRect("left", 240.0, 0.0, 220.0, 140.0),
                CanvasItemRect("budgets", 480.0, 0.0, 240.0, 300.0),
                CanvasItemRect("balance", 0.0, 160.0, 460.0, 140.0),
            ),
        )
    }
    var selected by remember { mutableStateOf(emptyList<String>()) }
    var saves by remember { mutableIntStateOf(0) }
    Column(Modifier.widthIn(max = 768.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Canvas(
            720, 300, items, { items = it },
            label = "Dashboard",
            fit = true,
            snap = true,
            grid = 20,
            minSize = 100,
            onItemsChangeEnd = { _, _ -> saves++ },
            selected = selected,
            onSelectedChange = { selected = it },
            surface = false,
        ) {
            for (item in items) key(item.id) { CanvasItem(item.id, Labels.getValue(item.id), shape = Zen.radii.xl) { Widget(item.id) } }
        }
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
            StatusPill(tone = if (saves > 0) StatusTone.Positive else StatusTone.Default, quiet = saves == 0) {
                Text(if (saves > 0) "Layout saved ($saves)" else "Drag a widget, or a handle to resize it")
            }
        }
    }
}
