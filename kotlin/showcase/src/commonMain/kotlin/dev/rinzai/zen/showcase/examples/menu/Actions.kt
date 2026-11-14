package dev.rinzai.zen.showcase.examples.menu

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

/** The usual "⋯" menu of actions for one thing: an icon button as the trigger, and a destructive item last. */
@Composable
fun Actions() {
    val toast = LocalToaster.current
    val menu = rememberMenuState()
    Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Goal actions", popupOpen = menu.open) {
        Icon(Icons.Ellipsis)
    }
    MenuContent(menu) {
        MenuItem({ toast("Edit") }) { Text("Edit") }
        MenuItem({ toast("Duplicated", tone = ToastTone.Positive) }) { Text("Duplicate") }
        MenuItem({ toast("Deleted", tone = ToastTone.Negative) }, negative = true) { Text("Delete") }
    }
}
