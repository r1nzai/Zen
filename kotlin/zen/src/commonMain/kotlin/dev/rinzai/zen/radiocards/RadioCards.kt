package dev.rinzai.zen.radiocards

import dev.rinzai.zen.pressScale
import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Radios
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.radio
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberRadios
import dev.rinzai.zen.transition

/** The RadioCards of a RadioCards group. */
@Stable
class RadioCardsScope<V> internal constructor(internal val radios: Radios<V>) {
    /**
     * One card: the whole of it chooses, whatever you put inside. Outlined, lit when chosen; style it
     * further with `modifier` (e.g. a background showing the choice).
     */
    @Composable
    fun RadioCard(value: V, modifier: Modifier = Modifier, enabled: Boolean = true, content: @Composable RowScope.() -> Unit) {
        val t = Zen.tokens
        val source = remember { MutableInteractionSource() }
        val state = rememberControlState(source)
        val checked = radios.value == value
        val spec = transition<Color>(200)
        // As in the stylesheet, hover comes after :checked.
        val border by animateColorAsState(
            when {
                state.hovered && enabled -> t.tint.color(0.2f)
                checked -> t.primary.color(0.6f)
                else -> t.tint.color(0.1f)
            },
            spec,
        )
        val lit by animateFloatAsState(if (checked) 1f else 0f, transition(200))
        Row(
            modifier
                .alpha(if (enabled) 1f else 0.6f)
                .pressScale(state, transition(200), enabled)
                .box(
                    Zen.radii.xl,
                    border = SolidColor(border),
                    shadows = focusRing(state.focusVisible) + Shadow(spread = 3f * lit, color = t.primary.color(0.15f * lit)),
                )
                .hoverable(source, enabled)
                .pointerHoverIcon(pressCursor(enabled))
                .radio(radios, value, enabled)
                .activeElement()
                .selectable(checked, source, indication = null, enabled = enabled, role = Role.RadioButton) { radios.select(value) }
                .padding(10.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProvideText(style = TextStyles.sm) { content() }
        }
    }
}

/**
 * A choice of one among a few cards, each showing what it picks (a palette, a plan): a radio group
 * underneath, so the arrow keys move and choose, and Tab enters at the chosen card. Lay the cards
 * out in `content` (a grid, a row); `modifier` goes on the group around them. For short text
 * options, use Segmented.
 */
@Composable
fun <V> RadioCards(
    value: V?,
    onValueChange: (V) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    content: @Composable RadioCardsScope<V>.() -> Unit,
) {
    val radios = rememberRadios(value, onValueChange, enabled = true)
    val scope = remember(radios) { RadioCardsScope(radios) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (label != null) Text(label, style = TextStyles.sm.merge(TextStyles.medium))
        Box(modifier.selectableGroup().semantics { if (label != null) contentDescription = label }) { scope.content() }
    }
}
