package dev.rinzai.zen.showcase.examples.tabs

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.tabs.Tab
import dev.rinzai.zen.tabs.TabList
import dev.rinzai.zen.tabs.TabListVariant
import dev.rinzai.zen.tabs.TabPanel
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.tabs.rememberTabsState

@Composable
fun Pills() {
    val muted = Zen.tokens.mutedForeground.color()
    Tabs(rememberTabsState("all"), Modifier.width(384.dp)) {
        TabList(variant = TabListVariant.Pills) {
            Tab("all") { Text("All") }
            Tab("expenses") { Text("Expenses") }
            Tab("income") { Text("Income") }
        }
        TabPanel("all") { Text("Every entry this month.", style = TextStyles.sm, color = muted) }
        TabPanel("expenses") { Text("Money going out.", style = TextStyles.sm, color = muted) }
        TabPanel("income") { Text("Money coming in.", style = TextStyles.sm, color = muted) }
    }
}
