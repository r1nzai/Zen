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
import dev.rinzai.zen.select.SelectItem

private val Categories = listOf("Groceries", "Rent", "Transport", "Dining out", "Subscriptions", "Health", "Travel")

/** Keyboard: arrows, Home/End, type a letter to jump, Enter to choose, Escape to close. */
@Composable
fun Default() {
    var category by remember { mutableStateOf<String?>("rent") }
    Select(category, { category = it }, Modifier.width(224.dp), label = "Category") {
        for (label in Categories) SelectItem(label.lowercase().replace(Regex("\\s+"), "-"), label)
    }
}
