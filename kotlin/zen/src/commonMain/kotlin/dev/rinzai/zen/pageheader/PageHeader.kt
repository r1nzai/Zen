package dev.rinzai.zen.pageheader

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.textAurora

/** Top of a page: a small eyebrow label, the title in the aurora gradient, a lead paragraph, and `content` after it. */
@Composable
fun PageHeader(
    title: String,
    modifier: Modifier = Modifier,
    eyebrow: String? = null,
    lead: String? = null,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val t = Zen.tokens
    // A block: as wide as its container.
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (eyebrow != null) {
            ProvideText(transform = TextTransform.Uppercase) {
                Text(eyebrow, style = TextStyles.xs.copy(letterSpacing = 0.1.em), color = t.mutedForeground.color())
            }
        }
        val size = if (Zen.page.atLeast(Breakpoint.Lg)) TextStyles.xl5 else TextStyles.xl4
        Text(
            title,
            // A block, as wide as the header: the gradient spans that, not just the words.
            Modifier.fillMaxWidth().semantics { heading() },
            style = size.merge(TextStyles.semibold).merge(TextStyles.tight).copy(lineBreak = LineBreak.Heading),
            brush = textAurora(size.fontSize),
        )
        if (lead != null) {
            // leading-relaxed: 1.625.
            Text(lead, Modifier.widthIn(max = 672.dp), style = TextStyles.lg.copy(lineHeight = 29.25.sp), color = t.mutedForeground.color())
        }
        content?.invoke(this)
    }
}
