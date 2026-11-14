package dev.rinzai.zen.showcase.examples.menu

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.menu.MenuCheckboxItem
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuRadioGroup
import dev.rinzai.zen.menu.MenuRadioItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.MenuSub
import dev.rinzai.zen.menu.MenuSubContent
import dev.rinzai.zen.menu.MenuSubTrigger
import dev.rinzai.zen.menu.Menubar
import dev.rinzai.zen.menu.MenubarTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

/**
 * A row of menus, as at the top of an app. Tab to it once: ←→ move between the menus and ↓ opens
 * one; with one open, ←→ go to the next and pointing at another label switches to it.
 */
@Composable
fun Bar() {
    val toast = LocalToaster.current
    var period by remember { mutableStateOf("month") }
    var categories by remember { mutableStateOf(true) }
    Menubar(label = "Ledger") {
        val file = rememberMenuState()
        MenubarTrigger(file) { Text("File") }
        MenuContent(file) {
            MenuItem({ toast("New entry") }) { Text("New entry") }
            MenuItem({ toast("Imported") }) { Text("Import…") }
            MenuSub {
                MenuSubTrigger(label = "Export")
                MenuSubContent {
                    MenuItem({ toast("Exported as CSV") }) { Text("CSV") }
                    MenuItem({ toast("Exported as PDF") }) { Text("PDF") }
                }
            }
        }
        val edit = rememberMenuState()
        MenubarTrigger(edit) { Text("Edit") }
        MenuContent(edit) {
            MenuItem({ toast("Undone") }) { Text("Undo") }
            MenuItem({ toast("Redone") }) { Text("Redo") }
            MenuSeparator()
            MenuItem({ toast("Deleted", tone = ToastTone.Negative) }, negative = true) { Text("Delete entry") }
        }
        val view = rememberMenuState()
        MenubarTrigger(view) { Text("View") }
        MenuContent(view, Modifier.width(208.dp)) {
            MenuRadioGroup(period, { period = it }, label = "Period") {
                MenuRadioItem("week") { Text("Week") }
                MenuRadioItem("month") { Text("Month") }
                MenuRadioItem("year") { Text("Year") }
            }
            MenuSeparator()
            MenuCheckboxItem(categories, { categories = it }) { Text("Show categories") }
        }
    }
}
