package dev.rinzai.zen.showcase.examples.checkbox

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.checkbox.Checkbox

private val ACCOUNTS = listOf("Salary account", "Credit card", "Savings")

/** A "select all" that shows a dash while only some are checked. */
@Composable
fun SelectAll() {
    var picked by remember { mutableStateOf(listOf("Credit card")) }
    val all = picked.size == ACCOUNTS.size
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ProvideText(style = TextStyles.medium) {
            Checkbox(all, { picked = if (all) emptyList() else ACCOUNTS }, indeterminate = picked.isNotEmpty() && !all) { Text("All accounts") }
        }
        Column(Modifier.padding(start = 28.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            for (a in ACCOUNTS) {
                Checkbox(a in picked, { on -> picked = if (on) picked + a else picked - a }) { Text(a) }
            }
        }
    }
}
