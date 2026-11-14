package dev.rinzai.zen.showcase.examples.combobox

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.combobox.Combobox
import dev.rinzai.zen.combobox.ComboboxEmpty
import dev.rinzai.zen.combobox.ComboboxItem
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger

private data class Account(val id: String, val name: String, val number: String)

private val ACCOUNTS = listOf(
    Account("chk", "Everyday checking", "•• 4821"),
    Account("sav", "Rainy-day savings", "•• 0937"),
    Account("crd", "Travel credit card", "•• 1150"),
    Account("brk", "Brokerage", "•• 7302"),
)

/** Any shape of item (itemKey, itemText), your own rows, your own empty message. ↑↓ and Enter work in the search. */
@Composable
fun Accounts() {
    var account by remember { mutableStateOf<String?>("chk") }
    Combobox(ACCOUNTS, account, { account = it }, itemText = { it.name }, itemKey = { it.id }) {
        ComboboxTrigger(Modifier.width(288.dp), placeholder = "Pick an account", label = "Account")
        ComboboxPopup {
            ComboboxSearch(placeholder = "Search accounts")
            ComboboxList<Account>(
                renderItem = { a ->
                    ComboboxItem(a) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(a.name)
                            Text(a.number, style = TextStyles.tabular, color = Zen.tokens.mutedForeground.color())
                        }
                    }
                },
            ) {
                ComboboxEmpty { Text("No account by that name") }
            }
        }
    }
}
