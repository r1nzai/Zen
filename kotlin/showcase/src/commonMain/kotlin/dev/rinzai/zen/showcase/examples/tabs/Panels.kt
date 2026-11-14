package dev.rinzai.zen.showcase.examples.tabs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.tabs.Tab
import dev.rinzai.zen.tabs.TabList
import dev.rinzai.zen.tabs.TabPanel
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.tabs.rememberTabsState

private class Budget(val name: String, val spent: Int, val limit: Int)

private val Budgets = listOf(Budget("Groceries", 412, 500), Budget("Eating out", 188, 150), Budget("Transport", 64, 120))

/** The last panel slides out as the picked one slides in, and the space between eases to fit. */
@Composable
fun Panels() {
    val muted = Zen.tokens.mutedForeground.color()
    Tabs(rememberTabsState("summary"), Modifier.widthIn(max = 448.dp).fillMaxWidth()) {
        TabList {
            Tab("summary") { Text("Summary") }
            Tab("budgets") { Text("Budgets") }
            Tab("notes") { Text("Notes") }
        }
        TabPanel("summary") {
            Text("$1,845.11", style = TextStyles.xl2.merge(TextStyles.semibold).merge(TextStyles.tabular))
            Text("Spent this month, $210 less than last.", style = TextStyles.sm, color = muted)
        }
        TabPanel("budgets", verticalArrangement = Arrangement.spacedBy(16.dp)) {
            for (b in Budgets) Meter(b.spent.toDouble(), max = b.limit.toDouble(), label = b.name, detail = "$${b.spent} / $${b.limit}")
        }
        TabPanel("notes") { Text("Rent goes out on the 5th.", style = TextStyles.sm, color = muted) }
    }
}
