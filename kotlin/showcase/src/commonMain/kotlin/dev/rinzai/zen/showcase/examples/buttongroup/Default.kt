package dev.rinzai.zen.showcase.examples.buttongroup

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.buttongroup.ButtonGroup
import dev.rinzai.zen.icons.Icons

/** Previous, this month and next, joined: one control for moving through months. */
@Composable
fun Default() {
    val flip = if (LocalLayoutDirection.current == LayoutDirection.Rtl) -1f else 1f
    ButtonGroup(label = "Month") {
        item { Button({}, variant = ButtonVariant.Outline, size = ButtonSize.Icon, shape = it, label = "Previous month") { Icon(Icons.ChevronLeft, Modifier.scale(flip, 1f)) } }
        item { Button({}, variant = ButtonVariant.Outline, shape = it) { Text("This month") } }
        item { Button({}, variant = ButtonVariant.Outline, size = ButtonSize.Icon, shape = it, label = "Next month") { Icon(Icons.ChevronRight, Modifier.scale(flip, 1f)) } }
    }
}
