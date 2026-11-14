package dev.rinzai.zen.showcase.examples.pagetransition

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatRow
import dev.rinzai.zen.pagetransition.PageTransition
import dev.rinzai.zen.pills.Pill
import dev.rinzai.zen.pills.Pills
import dev.rinzai.zen.viewTransition

private class Page(val title: String, val stats: List<Pair<String, String>>)

private val PAGES = listOf(
    Page("Overview", listOf("Net" to "$2,410", "Spent" to "$1,845")),
    Page("Budgets", listOf("On track" to "4 of 5", "Left" to "$655")),
    Page("Goals", listOf("Saved" to "$12,940", "Next" to "Holiday")),
)

/** Your navigation changes page in a view transition; PageTransition does the rest. */
@Composable
fun Default() {
    var page by remember { mutableStateOf(PAGES.first()) }
    val transition = Zen.viewTransition
    Column(Modifier.widthIn(max = 448.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Pills(Modifier.semantics { contentDescription = "Pages" }) {
            for (p in PAGES) Pill({ transition.start { page = p } }, active = p == page) { Text(p.title) }
        }
        PageTransition {
            Text(page.title, Modifier.padding(bottom = 12.dp), style = TextStyles.lg.merge(TextStyles.semibold))
            StatRow(stats = page.stats.map { (label, value) -> { m: Modifier -> Stat(label, value, m) } }, columns = 2)
        }
    }
}
