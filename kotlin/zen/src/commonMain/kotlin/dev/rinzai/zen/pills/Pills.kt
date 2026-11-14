package dev.rinzai.zen.pills

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
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Indicator
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.drawBox
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.indicatorItem
import dev.rinzai.zen.indicatorTrack
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberIndicator
import dev.rinzai.zen.transition

internal val LocalPills = staticCompositionLocalOf<Indicator?> { null }

/**
 * A glass track of pills, with a glowing pill (`indicator`) that slides to the active one. It
 * adds no role of its own: say what it is around it (site navigation, a label). For tabs that
 * switch panels in place, use Tabs with `TabListVariant.Pills`.
 */
@Composable
fun Pills(modifier: Modifier = Modifier, indicator: Boolean = true, content: @Composable RowScope.() -> Unit) {
    val t = Zen.tokens
    val pill = rememberIndicator()
    val paint = remember { Paint() }
    val glow = listOf(
        Shadow(spread = 1f, color = t.glow.color(0.35f), inset = true),
        Shadow(blur = 24f, spread = -4f, color = t.glow.color(0.6f * t.glowK)),
    )
    val fill = SolidColor(t.primary.color(0.15f))
    Row(
        modifier
            .glowEdge(CircleShape)
            .box(CircleShape, fill = SolidColor(t.tint.color(0.03f)), border = SolidColor(t.tint.color(0.05f)))
            .padding(4.dp)
            .then(
                if (!indicator) Modifier
                else Modifier.indicatorTrack(pill) { at -> drawPill(at, fill, glow, paint) },
            ),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalPills provides pill) { content() }
    }
}

internal fun DrawScope.drawPill(at: Rect, fill: SolidColor, glow: List<Shadow>, paint: Paint) =
    translate(at.left, at.top) { drawBox(at.size, CircleShape, fill, shadows = glow, shade = paint) }

/** One pill: a link to a page. `active` marks the current one, which the glowing pill sits under. */
@Composable
fun Pill(onClick: () -> Unit, modifier: Modifier = Modifier, active: Boolean = false, content: @Composable () -> Unit) {
    val pills = LocalPills.current ?: error("Pill must be inside Pills")
    PillItem(pills, active, modifier, Role.Button, enabled = true, onClick = onClick, content = content)
}

/** A pill's look and states, as a link (Pill) or a tab (Tab in a pills TabList) wears it. */
@Composable
internal fun PillItem(
    pills: Indicator,
    active: Boolean,
    modifier: Modifier,
    role: Role,
    enabled: Boolean,
    onClick: () -> Unit,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val ink by animateColorAsState(
        if (active || (state.hovered && enabled)) t.foreground.color() else t.mutedForeground.color(),
        transition<Color>(300),
    )
    Row(
        modifier
            .indicatorItem(pills, active)
            .box(CircleShape, shadows = focusRing(state.focusVisible))
            .control(state, enabled, role, onClick = onClick)
            .semantics { selected = active }
            .padding(horizontal = 14.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(ink, TextStyles.sm) { content() }
    }
}
