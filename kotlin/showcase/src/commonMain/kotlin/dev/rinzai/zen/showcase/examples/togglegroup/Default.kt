package dev.rinzai.zen.showcase.examples.togglegroup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.togglegroup.ToggleGroup
import dev.rinzai.zen.togglegroup.ToggleGroupItem
import dev.rinzai.zen.togglegroup.rememberToggleGroupState

/** Filters: any number on at once. */
@Composable
fun Default() {
    val kinds = rememberToggleGroupState("expense", "income", multiple = true)
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ToggleGroup(kinds, label = "Show") {
            ToggleGroupItem("expense") { Text("Expenses") }
            ToggleGroupItem("income") { Text("Income") }
            ToggleGroupItem("transfer") { Text("Transfers") }
        }
        val n = kinds.pressed.size
        Text(if (n > 0) "Showing $n of 3 kinds" else "Showing everything", style = TextStyles.sm, color = Zen.tokens.mutedForeground.color())
    }
}
