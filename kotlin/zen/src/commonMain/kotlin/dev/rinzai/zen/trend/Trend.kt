package dev.rinzai.zen.trend

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.SignDisplay
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.locale
import dev.rinzai.zen.radii

enum class TrendGood { Up, Down }

/**
 * A change, e.g. "+12%" with an arrow, coloured by whether it's good news: savings going up is,
 * spending going up isn't (`good = Down`). `value` is the change as a fraction (0.12 for 12%);
 * `content` follows it, muted, e.g. "vs last month". `format` reads it another way, e.g. as money.
 */
@Composable
fun Trend(
    value: Double,
    modifier: Modifier = Modifier,
    good: TrendGood = TrendGood.Up,
    locale: String? = null,
    format: ((Double) -> String)? = null,
    content: (@Composable () -> Unit)? = null,
) {
    val t = Zen.tokens
    val tag = locale(locale)
    val text = format?.invoke(value)
        ?: formatNumber(value, tag, NumberOptions(NumberStyle.Percent, maximumFractionDigits = 1, signDisplay = SignDisplay.ExceptZero))
    val up = value > 0
    val flat = value == 0.0
    val goodNews = (up && good == TrendGood.Up) || (!up && good == TrendGood.Down)
    val (border, fill, colour) = when {
        flat -> Triple(t.tint.color(0.1f), t.tint.color(0.06f), t.mutedForeground.color())
        goodNews -> Triple(t.glow.color(0.3f), t.glow.color(0.1f), t.primary.color())
        else -> Triple(t.destructive.color(0.4f), t.destructive.color(0.1f), t.destructive.color())
    }
    ProvideText(style = TextStyles.xs) {
        Row(modifier, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(
                Modifier
                    .box(Zen.radii.md, fill = SolidColor(fill), border = SolidColor(border))
                    .padding(horizontal = 6.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (!flat) Icon(if (up) Icons.ArrowTrendingUpMicro else Icons.ArrowTrendingDownMicro, size = 14.dp, color = colour)
                Text(text, style = TextStyles.medium.merge(TextStyles.tabular), color = colour, softWrap = false)
            }
            if (content != null) ProvideText(t.mutedForeground.color()) { content() }
        }
    }
}
