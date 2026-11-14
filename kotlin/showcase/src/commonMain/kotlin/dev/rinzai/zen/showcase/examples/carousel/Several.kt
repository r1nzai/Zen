package dev.rinzai.zen.showcase.examples.carousel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.carousel.Carousel
import dev.rinzai.zen.carousel.CarouselContent
import dev.rinzai.zen.carousel.CarouselControls
import dev.rinzai.zen.carousel.CarouselItem
import dev.rinzai.zen.carousel.CarouselNext
import dev.rinzai.zen.carousel.CarouselPrevious
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.radii

private class Category(val name: String, val spent: String, val chart: Int)

private val CATEGORIES = listOf(
    Category("Groceries", "$412", 6),
    Category("Rent", "$1,600", 7),
    Category("Transport", "$96", 1),
    Category("Eating out", "$238", 2),
    Category("Subscriptions", "$54", 5),
    Category("Health", "$120", 3),
)

/**
 * Several slides in view: size the items (here a half, then a third on wider screens). It snaps
 * to each; the buttons sit together at the end, each gone when there's no further to go.
 */
@Composable
fun Several() {
    val t = Zen.tokens
    val charts = listOf(t.chart1, t.chart2, t.chart3, t.chart4, t.chart5, t.chart6, t.chart7)
    val wide = Zen.page.atLeast(640.dp)
    Carousel(Modifier.widthIn(max = 576.dp).fillMaxWidth(), label = "Spending by category") {
        CarouselContent(gap = 12.dp) {
            for (c in CATEGORIES) {
                CarouselItem(basis = if (wide) width * 0.33333f - 8.dp else width * 0.5f - 6.dp) {
                    // The chart palette, so each category looks as it does in charts.
                    val chart: Color = charts[c.chart - 1]
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .height(112.dp)
                            .box(
                                Zen.radii.xl,
                                fill = linearGradient(160f, 0f to chart.copy(alpha = 0.35f), 1f to chart.copy(alpha = 0.06f)),
                                border = SolidColor(t.tint.color(0.1f)),
                            )
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.Bottom),
                    ) {
                        Text(c.name, style = TextStyles.xs, color = t.mutedForeground.color())
                        Text(c.spent, style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tabular))
                    }
                }
            }
        }
        CarouselControls(horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End)) {
            CarouselPrevious()
            CarouselNext()
        }
    }
}
