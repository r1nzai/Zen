package dev.rinzai.zen.showcase.examples.inset

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardDescription
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.inset.Inset
import dev.rinzai.zen.inset.InsetTone

/** Tiles for single figures inside a card, and a tinted panel for a result. */
@Composable
fun Default() {
    val muted = Zen.tokens.mutedForeground.color()
    Card(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            CardHeader(space = 0.dp) {
                Column {
                    CardTitle("Car loan")
                    CardDescription("$32,000 at 8.5% · 5 years")
                }
            }
            ProvideText(style = TextStyles.sm) {
                Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Inset(Modifier.weight(1f).fillMaxHeight(), content = {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Next payment", style = TextStyles.xs, color = muted)
                            Text("$656", style = TextStyles.medium.merge(TextStyles.tabular))
                        }
                    })
                    Inset(Modifier.weight(1f).fillMaxHeight(), tone = InsetTone.Positive, content = {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Debt-free", style = TextStyles.xs, color = muted)
                            Text("Mar 2031", style = TextStyles.medium)
                        }
                    })
                }
                Inset(bordered = true, tone = InsetTone.Positive) {
                    Text(buildAnnotatedString {
                        append("Paying $200 more a month saves ")
                        withStyle(SpanStyle(fontWeight = FontWeight.Bold)) { append("$2,140") }
                        append(" in interest.")
                    })
                }
            }
        }
    }
}
