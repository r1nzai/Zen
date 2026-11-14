package dev.rinzai.zen.showcase.examples.resizable

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii
import dev.rinzai.zen.resizable.ResizableHandle
import dev.rinzai.zen.resizable.ResizableOrientation
import dev.rinzai.zen.resizable.ResizablePanel
import dev.rinzai.zen.resizable.ResizablePanelGroup

/** A sidebar beside the main view, and a detail pane under it: drag a line, or focus it and use the arrow keys. */
@Composable
fun Default() {
    val t = Zen.tokens
    ResizablePanelGroup(
        Modifier
            .height(288.dp)
            .widthIn(max = 672.dp)
            .fillMaxWidth()
            .box(Zen.radii.xl, border = SolidColor(t.tint.color(0.1f))),
    ) {
        ResizablePanel(defaultSize = 30f, minSize = 20f, maxSize = 50f) {
            Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ProvideText(transform = TextTransform.Uppercase) {
                    Text("Accounts", Modifier.padding(bottom = 8.dp), style = TextStyles.xs.merge(TextStyles.medium).merge(TextStyles.wide), color = t.mutedForeground.color())
                }
                Text("Everyday", style = TextStyles.sm)
                Text("Savings", style = TextStyles.sm)
                Text("Credit card", style = TextStyles.sm)
            }
        }
        ResizableHandle(label = "Resize accounts")
        ResizablePanel {
            ResizablePanelGroup(orientation = ResizableOrientation.Vertical) {
                ResizablePanel(defaultSize = 65f, minSize = 30f) {
                    Text("Transactions", Modifier.align(Alignment.Center), style = TextStyles.sm)
                }
                ResizableHandle(label = "Resize details")
                ResizablePanel(minSize = 20f) {
                    Text("Details", Modifier.align(Alignment.Center), style = TextStyles.sm, color = t.mutedForeground.color())
                }
            }
        }
    }
}
