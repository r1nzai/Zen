package dev.rinzai.zen.showcase.examples.filterbar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.filterbar.FilterBar
import dev.rinzai.zen.filterbar.FilterChip

private val ALL = mapOf("amount" to "Amount: $50–$500", "category" to "Category: Dining out", "tag" to "Tag: Shared")

/** The filters on a list of entries; remove one, or all at once. */
@Composable
fun Default() {
    var on by remember { mutableStateOf(ALL.keys.toList()) }
    Column(Modifier.heightIn(min = 64.dp).widthIn(max = 448.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FilterBar(on, onClear = { on = emptyList() }) { key ->
            FilterChip({ on = on - key }, removeLabel = "Remove $key filter") { Text(ALL.getValue(key)) }
        }
        if (on.isEmpty()) Button({ on = ALL.keys.toList() }, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text("Filter again") }
    }
}
