package dev.rinzai.zen.card

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.textGlow

/**
 * Glass panel whose border catches the pointer light. Start it with a CardHeader for a title with
 * an action beside it. `padding` replaces its own (p-4, p-5 from md up).
 */
@Composable
fun Card(modifier: Modifier = Modifier, padding: PaddingValues? = null, content: @Composable ColumnScope.() -> Unit) {
    val shape = Zen.radii.xl
    Column(
        modifier
            .glowEdge(shape)
            .glass(shape)
            .padding(padding ?: cardPadding()),
    ) {
        ProvideText(Zen.tokens.cardForeground.color()) { content() }
    }
}

/** A Card's own padding, to keep part of it where you replace the rest: p-4, p-5 from md up. */
@Composable
fun cardPadding(): PaddingValues = PaddingValues(if (Zen.page.atLeast(Breakpoint.Md)) 20.dp else 16.dp)

/** The top row of a Card: its title, and an action (a button, a menu) at the end; `space` is the room under it. */
@Composable
fun CardHeader(modifier: Modifier = Modifier, space: Dp = 16.dp, content: @Composable RowScope.() -> Unit) {
    Row(
        modifier.fillMaxWidth().padding(bottom = space),
        horizontalArrangement = spaceBetween(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}

/** The card's title, a heading. */
@Composable
fun CardTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        modifier.semantics { heading() },
        style = TextStyles.base.merge(TextStyles.semibold).merge(TextStyles.tight).copy(lineBreak = LineBreak.Heading),
    )
}

/** A line under the CardTitle: what the card is about, or a figure's context. */
@Composable
fun CardDescription(text: String, modifier: Modifier = Modifier) {
    Text(text, modifier, style = TextStyles.xs, color = Zen.tokens.mutedForeground.color())
}

enum class StatTone { Default, Positive, Negative }

/** A single figure with a label, e.g. "Revenue  $12,400"; `hint` under it (a line, a Trend), then `content`. */
@Composable
fun Stat(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    hint: (@Composable () -> Unit)? = null,
    tone: StatTone = StatTone.Default,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) = Stat(label, { Text(value, maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis) }, modifier, hint, tone, content)

/**
 * A Stat whose figure is your own: the figure with a Sparkline beside it, say. It's set in the
 * figure's type and tone, on one line, cut off where it runs out of room.
 */
@Composable
fun Stat(
    label: String,
    value: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    hint: (@Composable () -> Unit)? = null,
    tone: StatTone = StatTone.Default,
    content: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val t = Zen.tokens
    val page = Zen.page
    val shape = Zen.radii.xl
    val sm = page.atLeast(Breakpoint.Sm)
    val md = page.atLeast(Breakpoint.Md)
    Column(
        modifier.glowEdge(shape).glass(shape).padding(if (md) 16.dp else 14.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        ProvideText(transform = TextTransform.Uppercase) {
            Text(
                label,
                style = (if (sm) TextStyles.xs else TextStyles.xs2).copy(letterSpacing = 0.1.em),
                color = t.mutedForeground.color(),
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Ellipsis,
            )
        }
        val size = when {
            md -> TextStyles.xl2
            sm -> TextStyles.xl
            else -> TextStyles.lg
        }
        ProvideText(
            when (tone) {
                StatTone.Positive -> t.primary.color()
                StatTone.Negative -> t.destructive.color()
                StatTone.Default -> t.foreground.color()
            },
            size.merge(TextStyles.semibold).merge(TextStyles.tight).merge(TextStyles.tabular)
                .merge(if (tone == StatTone.Positive) textGlow() else null),
        ) {
            Box(Modifier.clipToBounds()) { value() }
        }
        if (hint != null) ProvideText(t.mutedForeground.color(), TextStyles.xs) { hint() }
        content?.invoke(this)
    }
}

/**
 * A row of stats: two columns on phones (an odd last one spans both), three from `sm` up, or
 * `columns` from `sm` up. They're `gap` apart: 12dp, 16dp from `md` up, unless it's given.
 */
@Composable
fun StatRow(modifier: Modifier = Modifier, stats: List<@Composable (Modifier) -> Unit>, columns: Int? = null, gap: Dp? = null) {
    val page = Zen.page
    val columns = if (page.atLeast(Breakpoint.Sm)) columns ?: 3 else 2
    val gap = gap ?: if (page.atLeast(Breakpoint.Md)) 16.dp else 12.dp
    Column(modifier, verticalArrangement = Arrangement.spacedBy(gap)) {
        stats.chunked(columns).forEach { row ->
            Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(gap)) {
                // A grid's cells share the row: one left alone on a phone's two columns spans both.
                val span = if (row.size == 1 && columns == 2) 2 else 1
                row.forEach { stat -> stat(Modifier.weight(span.toFloat()).fillMaxHeight()) }
                repeat(columns - row.size * span) { Row(Modifier.weight(1f)) {} }
            }
        }
    }
}
