package dev.rinzai.zen.showcase.examples.togglegroup

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.togglegroup.ToggleGroup
import dev.rinzai.zen.togglegroup.ToggleGroupItem
import dev.rinzai.zen.togglegroup.rememberToggleGroupState

/** At most one: pressing the pressed one releases it. Icon-only items carry a label. */
@Composable
fun Single() {
    ToggleGroup(rememberToggleGroupState("list"), label = "Group by") {
        ToggleGroupItem("list", label = "As a list", padding = 8.dp) { Icon(Icons.ListBullet) }
        ToggleGroupItem("cards", label = "As cards", padding = 8.dp) { Icon(Icons.Squares) }
        ToggleGroupItem("chart", label = "As a chart", padding = 8.dp) { Icon(Icons.ChartBar) }
    }
}
