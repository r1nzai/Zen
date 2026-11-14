package dev.rinzai.zen.showcase.examples.select

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectGroup
import dev.rinzai.zen.select.SelectItem
import dev.rinzai.zen.select.SelectSeparator

/** SelectItems, organised with SelectGroup and SelectSeparator; the keyboard skips the disabled one. */
@Composable
fun Groups() {
    var category by remember { mutableStateOf<String?>("groceries") }
    Select(category, { category = it }, Modifier.width(256.dp), label = "Category") {
        SelectGroup("Essentials") {
            SelectItem("rent", "Rent")
            SelectItem("groceries", "Groceries")
            SelectItem("transport", "Transport")
        }
        SelectSeparator()
        SelectGroup("Lifestyle") {
            SelectItem("dining", "Dining out")
            SelectItem("travel", "Travel (over budget)", enabled = false)
        }
    }
}
