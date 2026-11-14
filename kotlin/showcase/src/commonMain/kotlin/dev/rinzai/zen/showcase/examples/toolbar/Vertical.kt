package dev.rinzai.zen.showcase.examples.toolbar

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.togglegroup.ToggleGroup
import dev.rinzai.zen.togglegroup.ToggleGroupItem
import dev.rinzai.zen.togglegroup.rememberToggleGroupState
import dev.rinzai.zen.toolbar.Toolbar
import dev.rinzai.zen.toolbar.ToolbarSeparator

/** Upright beside what it controls, e.g. a chart: ↑↓ move through it, and its toggle group stacks too. */
@Composable
fun Vertical() {
    Toolbar(label = "Chart", orientation = Orientation.Vertical) {
        Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Zoom in") { Icon(Icons.PlusMicro) }
        Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Zoom out") { Icon(Icons.MinusMicro) }
        ToolbarSeparator()
        ToggleGroup(rememberToggleGroupState("bars"), label = "Chart type") {
            ToggleGroupItem("bars", label = "Bars", padding = 8.dp) { Icon(Icons.ChartBar) }
            ToggleGroupItem("tiles", label = "Tiles", padding = 8.dp) { Icon(Icons.Squares) }
        }
    }
}
