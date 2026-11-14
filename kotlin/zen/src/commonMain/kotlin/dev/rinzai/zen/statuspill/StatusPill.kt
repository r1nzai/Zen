package dev.rinzai.zen.statuspill

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalIconSize
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

enum class StatusTone { Default, Positive, Negative }

/**
 * A small rounded status that changes in place, e.g. "Saving…", "Saved", "Not saved · Retry": an
 * icon (a Spinner, a Check) and a few words, read out politely as it changes. `quiet` fades it back
 * once the news is old. StatusPillAction is an action inside it; for a fixed label, use Badge.
 */
@Composable
fun StatusPill(
    modifier: Modifier = Modifier,
    tone: StatusTone = StatusTone.Default,
    quiet: Boolean = false,
    content: @Composable RowScope.() -> Unit,
) {
    val t = Zen.tokens
    val (border, fill, text) = when {
        quiet -> Triple(t.tint.color(0f), t.tint.color(0f), t.mutedForeground.color())
        tone == StatusTone.Positive -> Triple(t.primary.color(0.35f), t.primary.color(0.12f), t.primary.color())
        tone == StatusTone.Negative -> Triple(t.destructive.color(0.4f), t.destructive.color(0.1f), t.destructive.color())
        else -> Triple(t.tint.color(0.1f), t.tint.color(0.05f), t.mutedForeground.color())
    }
    val spec = transition<androidx.compose.ui.graphics.Color>(300, Ease.Standard)
    val b by animateColorAsState(border, spec)
    val f by animateColorAsState(fill, spec)
    val c by animateColorAsState(text, spec)
    Row(
        modifier
            .semantics { liveRegion = LiveRegionMode.Polite }
            .box(CircleShape, fill = SolidColor(f), border = SolidColor(b))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalIconSize provides 14.dp) {
            ProvideText(c, TextStyles.xs.merge(TextStyles.medium)) { content() }
        }
    }
}

/** A text button inside a StatusPill, e.g. Retry, in the pill's colour. */
@Composable
fun StatusPillAction(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    Text(
        text,
        modifier
            .padding(start = 2.dp)
            .box(CircleShape, shadows = focusRing(state.focusVisible))
            .control(state, onClick = onClick),
        style = TextStyle(textDecoration = TextDecoration.Underline),
    )
}
