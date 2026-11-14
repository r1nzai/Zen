package dev.rinzai.zen.showcase.examples.menu

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuCheckboxItem
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuRadioGroup
import dev.rinzai.zen.menu.MenuRadioItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.MenuSub
import dev.rinzai.zen.menu.MenuSubContent
import dev.rinzai.zen.menu.MenuSubTrigger
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster

/**
 * Settings that stay put while you change them: checkbox items turn columns on and off, radio
 * items pick the order, and a submenu holds the less used exports. Hover, or use the arrow keys,
 * to open it.
 */
@Composable
fun Options() {
    val toast = LocalToaster.current
    val menu = rememberMenuState()
    var sort by remember { mutableStateOf("date") }
    var category by remember { mutableStateOf(true) }
    var account by remember { mutableStateOf(true) }
    var notes by remember { mutableStateOf(false) }
    Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Outline, popupOpen = menu.open) {
        Icon(Icons.Settings, size = 16.dp)
        Text("View")
    }
    MenuContent(menu, Modifier.width(224.dp)) {
        MenuCheckboxItem(category, { category = it }) { Text("Category") }
        MenuCheckboxItem(account, { account = it }) { Text("Account") }
        MenuCheckboxItem(notes, { notes = it }) { Text("Notes") }
        MenuSeparator()
        MenuRadioGroup(sort, { sort = it }, label = "Sort by") {
            MenuRadioItem("date") { Text("Newest first") }
            MenuRadioItem("amount") { Text("Largest first") }
        }
        MenuSeparator()
        MenuSub {
            MenuSubTrigger(label = "Export")
            MenuSubContent {
                MenuItem({ toast("Exported as CSV") }) { Text("CSV") }
                MenuItem({ toast("Exported as PDF") }) { Text("PDF") }
                MenuItem({ toast("Exported as JSON") }) { Text("JSON") }
            }
        }
    }
}
