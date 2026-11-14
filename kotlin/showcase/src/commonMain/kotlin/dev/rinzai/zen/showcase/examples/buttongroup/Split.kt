package dev.rinzai.zen.showcase.examples.buttongroup

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.buttongroup.ButtonGroup
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

/** A split button: the usual action, and a menu of the others. */
@Composable
fun Split() {
    val toast = LocalToaster.current
    ButtonGroup {
        item { Button({ toast("Exported as CSV", tone = ToastTone.Positive) }, variant = ButtonVariant.Outline, shape = it) { Text("Export CSV") } }
        item { shape ->
            val menu = rememberMenuState()
            Box {
                Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Outline, size = ButtonSize.Icon, shape = shape, label = "More export formats", popupOpen = menu.open) {
                    Icon(Icons.ChevronDown)
                }
                MenuContent(menu) {
                    MenuItem({ toast("Exported as Excel", tone = ToastTone.Positive) }) { Text("Excel") }
                    MenuItem({ toast("Exported as PDF", tone = ToastTone.Positive) }) { Text("PDF") }
                }
            }
        }
    }
}
