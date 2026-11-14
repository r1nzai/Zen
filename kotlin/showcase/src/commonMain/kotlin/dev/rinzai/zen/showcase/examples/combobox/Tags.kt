package dev.rinzai.zen.showcase.examples.combobox

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.combobox.Combobox
import dev.rinzai.zen.combobox.ComboboxCreate
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger

/** Several at once (chips, removable), and typing a new name offers to add it: ComboboxCreate (Enter works too). */
@Composable
fun Tags() {
    var tags by remember { mutableStateOf(listOf("Essential", "Shared", "Work", "Treat", "Annual")) }
    var chosen by remember { mutableStateOf(listOf("Essential", "Shared")) }
    Combobox(tags, chosen, { chosen = it }) {
        ComboboxTrigger(Modifier.width(320.dp), placeholder = "No tags", label = "Tags")
        ComboboxPopup {
            ComboboxSearch()
            ComboboxList<String> {
                ComboboxCreate({ tag ->
                    tags = tags + tag
                    chosen = chosen + tag
                })
            }
        }
    }
}
