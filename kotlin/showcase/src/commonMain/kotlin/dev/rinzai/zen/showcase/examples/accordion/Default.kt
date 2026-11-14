package dev.rinzai.zen.showcase.examples.accordion

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.accordion.Accordion
import dev.rinzai.zen.accordion.AccordionContent
import dev.rinzai.zen.accordion.AccordionItem
import dev.rinzai.zen.accordion.AccordionTrigger
import dev.rinzai.zen.accordion.rememberAccordionState
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle

private val QUESTIONS = listOf(
    "How are other currencies converted?" to "At the day’s rate when you save the entry. The original amount and rate are kept with it, so the conversion never changes later.",
    "Can I split one payment across categories?" to "Yes: add it once, then split it. Each part counts towards its own category’s budget.",
    "What happens to a budget I go over?" to "Nothing is blocked. The bar turns red, and the overspend is shown in the month’s summary.",
)

/** Questions and answers: opening one closes the last. */
@Composable
fun Default() {
    Card(Modifier.widthIn(max = 448.dp).fillMaxWidth()) {
        CardHeader { CardTitle("Questions") }
        Accordion(state = rememberAccordionState("0")) {
            QUESTIONS.forEachIndexed { i, (q, a) ->
                AccordionItem(i.toString()) {
                    AccordionTrigger { Text(q) }
                    AccordionContent { Text(a) }
                }
            }
        }
    }
}
