package dev.rinzai.zen.showcase.examples.carousel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.carousel.Carousel
import dev.rinzai.zen.carousel.CarouselContent
import dev.rinzai.zen.carousel.CarouselControls
import dev.rinzai.zen.carousel.CarouselDots
import dev.rinzai.zen.carousel.CarouselItem
import dev.rinzai.zen.carousel.CarouselNext
import dev.rinzai.zen.carousel.CarouselPrevious
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.progressring.ProgressRing
import kotlin.math.roundToInt

private class Goal(val name: String, val saved: Int, val target: Int)

private val GOALS = listOf(
    Goal("Emergency fund", 6400, 10000),
    Goal("New laptop", 1150, 1800),
    Goal("Trip to Kyoto", 2100, 4500),
    Goal("Wedding gift", 300, 300),
)

/** One slide at a time, with buttons and dots below. Swipe or scroll it too, or focus it and use the arrow keys. */
@Composable
fun Default() {
    val t = Zen.tokens
    fun usd(n: Int) = formatMoney(n * 100L, "USD", "en-US", showDecimals = false)
    Carousel(Modifier.widthIn(max = 384.dp).fillMaxWidth(), label = "Savings goals") {
        CarouselContent {
            for (goal in GOALS) {
                CarouselItem {
                    Card(Modifier.fillMaxWidth()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            ProgressRing(goal.saved.toFloat() / goal.target, goal.name) {
                                Text("${(goal.saved * 100.0 / goal.target).roundToInt()}%", style = TextStyles.sm.merge(TextStyles.semibold).merge(TextStyles.tabular))
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(goal.name, style = TextStyles.medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text("${usd(goal.saved)} of ${usd(goal.target)}", style = TextStyles.sm.merge(TextStyles.tabular), color = t.mutedForeground.color())
                            }
                        }
                    }
                }
            }
        }
        CarouselControls {
            CarouselPrevious()
            CarouselDots()
            CarouselNext()
        }
    }
}
