package dev.rinzai.zen.inset

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii

enum class InsetTone { Default, Positive, Negative }

/**
 * A faint box set into a card or dialog: a small tile for one figure (e.g. "Next EMI"), or with
 * `bordered`, a panel for a result or a note. `tone` tints it for good or bad news.
 */
@Composable
fun Inset(
    modifier: Modifier = Modifier,
    bordered: Boolean = false,
    tone: InsetTone = InsetTone.Default,
    content: @Composable ColumnScope.() -> Unit,
) {
    val t = Zen.tokens
    val look = if (bordered) {
        val (border, fill) = when (tone) {
            InsetTone.Default -> t.tint.color(0.08f) to t.tint.color(0.03f)
            InsetTone.Positive -> t.primary.color(0.3f) to t.primary.color(0.07f)
            InsetTone.Negative -> t.destructive.color(0.35f) to t.destructive.color(0.08f)
        }
        Modifier.box(Zen.radii.xl, fill = SolidColor(fill), border = SolidColor(border)).padding(16.dp)
    } else {
        val fill = when (tone) {
            InsetTone.Default -> t.tint.color(0.03f)
            InsetTone.Positive -> t.primary.color(0.1f)
            InsetTone.Negative -> t.destructive.color(0.1f)
        }
        Modifier.box(Zen.radii.lg, fill = SolidColor(fill)).padding(horizontal = 12.dp, vertical = 10.dp)
    }
    Column(modifier.then(look), content = content)
}
