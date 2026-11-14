package dev.rinzai.zen.showcase.examples.disclosure

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.disclosure.Disclosure
import dev.rinzai.zen.disclosure.DisclosureContent
import dev.rinzai.zen.disclosure.DisclosureTrigger
import dev.rinzai.zen.meter.Meter
import kotlin.math.roundToInt

private val ACTIVE = listOf(Triple("New phone", 42000.0, 60000.0), Triple("Emergency fund", 180000.0, 300000.0))
private val PAST = listOf("Laptop", "Trip to Goa", "Wedding gift")

/** Finished goals folded away under the active ones; the section grows open and folds shut. */
@Composable
fun Default() {
    val t = Zen.tokens
    Card(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        CardHeader { CardTitle("Goals") }
        ProvideText(style = TextStyles.sm) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                for ((name, saved, target) in ACTIVE) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(name)
                            Text("${(saved / target * 100).roundToInt()}%", style = TextStyles.tabular, color = t.mutedForeground.color())
                        }
                        Meter(saved, Modifier.semantics { contentDescription = name }, max = target)
                    }
                }
            }
        }
        Disclosure {
            DisclosureTrigger(Modifier.padding(top = 8.dp)) { Text("Past (${PAST.size})") }
            DisclosureContent {
                val line = t.tint.color(0.07f)
                Column(
                    Modifier.drawBehind { drawRect(line, size = size.copy(width = 1.dp.toPx())) }.padding(start = 17.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    for (g in PAST) {
                        ProvideText(t.mutedForeground.color(), TextStyles.sm) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text(g)
                                Text("Done", style = TextStyles.xs)
                            }
                        }
                    }
                }
            }
        }
    }
}
