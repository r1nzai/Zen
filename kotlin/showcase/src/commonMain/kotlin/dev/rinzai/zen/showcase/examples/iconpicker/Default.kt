package dev.rinzai.zen.showcase.examples.iconpicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.iconpicker.IconChoice
import dev.rinzai.zen.iconpicker.IconOption
import dev.rinzai.zen.iconpicker.IconPicker
import dev.rinzai.zen.input.Input

private val ICONS = listOf(
    "groceries" to "Groceries" to "🛒", "dining" to "Dining" to "🍽️", "transport" to "Transport" to "🚆",
    "home" to "Home" to "🏠", "bills" to "Bills" to "💡", "gifts" to "Gifts" to "🎁",
    "health" to "Health" to "💊", "fun" to "Fun" to "🎬", "travel" to "Travel" to "✈️",
    "books" to "Books" to "📚", "pets" to "Pets" to "🐾", "work" to "Work" to "💼",
).map { (named, emoji) -> IconOption(named.first, named.second) { Text(emoji) } }

/** A new category: its icon and colour beside its name. */
@Composable
fun Default() {
    var look by remember { mutableStateOf(IconChoice("groceries", "teal")) }
    var name by remember { mutableStateOf("Groceries") }
    Row(Modifier.widthIn(max = 384.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Bottom) {
        IconPicker(look, { look = it }, ICONS, "Category icon")
        Field("Name", Modifier.weight(1f)) { Input(name, { name = it }) }
    }
}
