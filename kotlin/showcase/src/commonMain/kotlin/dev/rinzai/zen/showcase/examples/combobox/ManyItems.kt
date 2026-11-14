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
import dev.rinzai.zen.combobox.ComboboxEmpty
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger

private data class Item(val key: String, val text: String)

private val MANY = List(2000) { Item("${it + 1}", "Account ${(it + 1).toString().padStart(4, '0')}") }

/** 2,000 items: the list composes only the rows in view, so it opens and scrolls instantly. Type to filter. */
@Composable
fun ManyItems() {
    var account by remember { mutableStateOf<String?>("1") }
    Combobox(MANY, account, { account = it }, itemText = { it.text }, itemKey = { it.key }) {
        ComboboxTrigger(Modifier.width(256.dp), label = "Account")
        ComboboxPopup {
            ComboboxSearch()
            ComboboxList<Item> { ComboboxEmpty() }
        }
    }
}
