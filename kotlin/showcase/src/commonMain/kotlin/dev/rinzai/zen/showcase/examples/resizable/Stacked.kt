package dev.rinzai.zen.showcase.examples.resizable

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii
import dev.rinzai.zen.resizable.ResizableHandle
import dev.rinzai.zen.resizable.ResizableOrientation
import dev.rinzai.zen.resizable.ResizablePanel
import dev.rinzai.zen.resizable.ResizablePanelGroup

/** Three panels stacked, each with a smallest size: drag either line, or focus one and use ↑↓. */
@Composable
fun Stacked() {
    val t = Zen.tokens
    ResizablePanelGroup(
        Modifier
            .height(320.dp)
            .widthIn(max = 448.dp)
            .fillMaxWidth()
            .box(Zen.radii.xl, border = SolidColor(t.tint.color(0.1f))),
        orientation = ResizableOrientation.Vertical,
    ) {
        ResizablePanel(defaultSize = 25f, minSize = 15f) {
            Column(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically)) {
                Text("Balance", style = TextStyles.xs, color = t.mutedForeground.color())
                Text("$12,480", style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tabular))
            }
        }
        ResizableHandle(label = "Resize balance")
        ResizablePanel(defaultSize = 45f, minSize = 20f) {
            Text("This month", Modifier.align(Alignment.Center), style = TextStyles.sm, color = t.mutedForeground.color())
        }
        ResizableHandle(label = "Resize this month")
        ResizablePanel(minSize = 15f) {
            Text("Upcoming", Modifier.align(Alignment.Center), style = TextStyles.sm, color = t.mutedForeground.color())
        }
    }
}
