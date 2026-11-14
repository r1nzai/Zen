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
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.MenuSub
import dev.rinzai.zen.menu.MenuSubContent
import dev.rinzai.zen.menu.MenuSubTrigger
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

/** A song's menu: on a phone (narrow the window), a bottom sheet, its playlists sliding in over it. */
@Composable
fun Sheet() {
    val toast = LocalToaster.current
    val menu = rememberMenuState()
    Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Song actions", popupOpen = menu.open) {
        Icon(Icons.Ellipsis)
    }
    MenuContent(menu, sheet = true) {
        MenuItem({ toast("Playing next") }, icon = Icons.QueueList) { Text("Play next") }
        MenuItem({ toast("Liked", tone = ToastTone.Positive) }, icon = Icons.Heart) { Text("Like") }
        MenuSub {
            MenuSubTrigger(icon = Icons.MusicalNote, label = "Add to playlist")
            MenuSubContent {
                for (name in listOf("Late night", "Focus", "Running", "Sunday morning")) {
                    MenuItem({ toast("Added to $name", tone = ToastTone.Positive) }) { Text(name) }
                }
            }
        }
        MenuSeparator()
        MenuItem({ toast("Removed from queue", tone = ToastTone.Negative) }, negative = true) { Text("Remove from queue") }
    }
}
