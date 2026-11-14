package dev.rinzai.zen.showcase.examples.toolbar

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.togglegroup.ToggleGroup
import dev.rinzai.zen.togglegroup.ToggleGroupItem
import dev.rinzai.zen.togglegroup.rememberToggleGroupState
import dev.rinzai.zen.toolbar.Toolbar
import dev.rinzai.zen.toolbar.ToolbarSeparator

/** A table's controls: one stop for Tab, and ←→ through them all, the toggle group's items too. */
@Composable
fun Default() {
    Toolbar(label = "Entries") {
        ToggleGroup(rememberToggleGroupState("table"), label = "View") {
            ToggleGroupItem("table", label = "Table", padding = 8.dp) { Icon(Icons.Table) }
            ToggleGroupItem("list", label = "List", padding = 8.dp) { Icon(Icons.ListBullet) }
            ToggleGroupItem("chart", label = "Chart", padding = 8.dp) { Icon(Icons.ChartBar) }
        }
        ToolbarSeparator()
        Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.Sm) { Text("Filter") }
        Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.Sm) { Text("Sort") }
        ToolbarSeparator()
        Button({}, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Table settings") { Icon(Icons.Settings) }
    }
}
