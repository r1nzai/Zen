package dev.rinzai.zen.showcase.examples.commandpalette

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.commandpalette.CommandItem
import dev.rinzai.zen.commandpalette.CommandPalette
import dev.rinzai.zen.commandpalette.CommandPaletteShortcut
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.kbd.Kbd

/** Pages and actions in one search. Open it with the button, or ⌘K / Ctrl+K. */
@Composable
fun Default() {
    var open by remember { mutableStateOf(false) }
    var last by remember { mutableStateOf<String?>(null) }
    CommandPaletteShortcut({ open = true })
    fun go(label: String): () -> Unit = { last = label }
    val items = listOf(
        CommandItem("Overview", go("Overview"), group = "Pages", icon = { Icon(Icons.ChartBar, size = 16.dp) }),
        CommandItem("Entries", go("Entries"), group = "Pages", keywords = listOf("transactions"), icon = { Icon(Icons.ListBullet, size = 16.dp) }),
        CommandItem("Settings", go("Settings"), group = "Pages", keywords = listOf("preferences"), icon = { Icon(Icons.Settings, size = 16.dp) }),
        CommandItem("Add entry", go("Add entry"), group = "Actions", hint = { Text("N") }),
        CommandItem("Import a statement", go("Import"), group = "Actions", keywords = listOf("csv", "bank")),
        CommandItem("Export to CSV", go("Export"), group = "Actions"),
    )
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Button({ open = true }, variant = ButtonVariant.Outline) {
            Text("Search…")
            Row(Modifier.padding(start = 8.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                Kbd("⌘")
                Kbd("K")
            }
        }
        last?.let { Text("Ran: $it", style = TextStyles.sm, color = Zen.tokens.mutedForeground.color()) }
        CommandPalette(open, { open = it }, items, placeholder = "Search pages and actions…")
    }
}
