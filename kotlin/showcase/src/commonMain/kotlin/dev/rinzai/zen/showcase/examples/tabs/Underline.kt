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
import dev.rinzai.zen.tabs.TabPanel
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.tabs.rememberTabsState

@Composable
fun Underline() {
    val muted = Zen.tokens.mutedForeground.color()
    Tabs(rememberTabsState("month"), Modifier.width(384.dp)) {
        TabList {
            Tab("month") { Text("Month") }
            Tab("year") { Text("Year") }
            Tab("all") { Text("All time") }
        }
        TabPanel("month") { Text("Spending for September.", style = TextStyles.sm, color = muted) }
        TabPanel("year") { Text("Spending for 2026 so far.", style = TextStyles.sm, color = muted) }
        TabPanel("all") { Text("Everything since you started.", style = TextStyles.sm, color = muted) }
    }
}
