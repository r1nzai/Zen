package dev.rinzai.zen.segmented

import dev.rinzai.zen.pressScale
import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Indicator
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Radios
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.drawBox
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.indicatorItem
import dev.rinzai.zen.indicatorTrack
import dev.rinzai.zen.radii
import dev.rinzai.zen.radio
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberIndicator
import dev.rinzai.zen.rememberRadios
import dev.rinzai.zen.transition

/** The SegmentedItems of a Segmented. */
@Stable
class SegmentedScope<V> internal constructor(internal val radios: Radios<V>, internal val indicator: Indicator) {
    /** One option: whatever it shows (text, an icon, both). A disabled one is skipped by the arrow keys and can't be chosen. */
    @Composable
    fun SegmentedItem(value: V, modifier: Modifier = Modifier, enabled: Boolean = true, content: @Composable RowScope.() -> Unit) {
        val t = Zen.tokens
        val source = remember { MutableInteractionSource() }
        val state = rememberControlState(source)
        val checked = radios.value == value
        val ink by animateColorAsState(
            if (checked || (state.hovered && enabled)) t.foreground.color() else t.mutedForeground.color(),
            transition<Color>(300),
        )
        Row(
            modifier
                .alpha(if (enabled) 1f else 0.5f)
                .indicatorItem(indicator, checked)
                .pressScale(state, transition(300), enabled)
                .box(Zen.radii.lg, shadows = focusRing(state.focusVisible))
                .hoverable(source, enabled)
                .pointerHoverIcon(pressCursor(enabled))
                .radio(radios, value, enabled)
                .activeElement()
                .selectable(checked, source, indication = null, enabled = enabled, role = Role.RadioButton) { radios.select(value) }
                .padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProvideText(ink, TextStyles.sm) { content() }
        }
    }
}

/**
 * A small set of mutually exclusive options, shown as a pill row: a radio group underneath, so the
 * arrow keys move and choose, and Tab enters at the chosen option. The selection slides between
 * options, like Pills. `label` is shown above, naming the group. Fill it with SegmentedItems.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun <V> Segmented(
    value: V?,
    onValueChange: (V) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    content: @Composable SegmentedScope<V>.() -> Unit,
) {
    val t = Zen.tokens
    val radios = rememberRadios(value, onValueChange, enabled = true)
    val indicator = rememberIndicator()
    val scope = remember(radios, indicator) { SegmentedScope(radios, indicator) }
    val shape = Zen.radii.xl
    val chosen = Zen.radii.lg
    val fill = SolidColor(t.primary.color(0.15f))
    val edge = listOf(Shadow(spread = 1f, color = t.primary.color(0.4f), inset = true))
    val paint = remember { Paint() }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (label != null) Text(label, style = TextStyles.sm.merge(TextStyles.medium))
        FlowRow(
            Modifier
                .glowEdge(shape, Sides.All)
                .box(shape, fill = SolidColor(t.tint.color(0.03f)), border = SolidColor(t.tint.color(0.1f)))
                .padding(4.dp)
                .indicatorTrack(indicator) { at -> translate(at.left, at.top) { drawBox(at.size, chosen, fill, shadows = edge, shade = paint) } }
                .selectableGroup()
                .semantics { if (label != null) contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            scope.content()
        }
    }
}
