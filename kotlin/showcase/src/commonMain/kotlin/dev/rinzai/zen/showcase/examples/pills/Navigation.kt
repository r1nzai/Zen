package dev.rinzai.zen.showcase.examples.pills

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.rinzai.zen.Text
import dev.rinzai.zen.pills.Pill
import dev.rinzai.zen.pills.Pills

private val Pages = listOf("Month", "Planner", "Loans", "Goals", "Trends")

/** Site navigation: Pills naming what they are, the current page's pill lit. */
@Composable
fun Navigation() {
    var current by remember { mutableStateOf("Month") }
    Pills(Modifier.semantics { contentDescription = "Main" }) {
        for (page in Pages) Pill({ current = page }, active = page == current) { Text(page) }
    }
}
