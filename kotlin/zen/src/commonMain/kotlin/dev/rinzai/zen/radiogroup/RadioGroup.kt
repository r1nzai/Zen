package dev.rinzai.zen.radiogroup

import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ChoiceLabel
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.Radios
import dev.rinzai.zen.radio
import dev.rinzai.zen.rememberRadios
import dev.rinzai.zen.transition

/** The Radios of a RadioGroup, as a native group sees them: in reading order, one tab stop. */
@Stable
class RadioGroupScope<V> internal constructor(internal val radios: Radios<V>) {
    /** One option: a round radio that fills with a glowing dot when chosen, its label, and an optional description. */
    @Composable
    fun Radio(
        value: V,
        modifier: Modifier = Modifier,
        enabled: Boolean = true,
        description: (@Composable () -> Unit)? = null,
        label: String? = null,
        content: @Composable () -> Unit,
    ) {
        val t = Zen.tokens
        val usable = enabled && radios.enabled
        val source = remember { MutableInteractionSource() }
        val state = rememberControlState(source)
        val checked = radios.value == value
        val spec = transition<Color>(200)
        // As in the stylesheet, hover comes after :checked.
        val border by animateColorAsState(
            when {
                state.hovered && usable -> t.tint.color(t.zenControlEdgeHover)
                checked -> t.primary.color()
                else -> t.tint.color(t.zenControlEdge)
            },
            spec,
        )
        val halo by animateColorAsState(t.glow.color(if (checked) 0.8f * t.glowK else 0f), spec)
        val dot by animateFloatAsState(if (checked) 1f else 0f, transition(200, Pop))
        ChoiceLabel(
            modifier
                .hoverable(source, usable)
                .pointerHoverIcon(pressCursor(usable))
                .radio(radios, value, enabled)
                .activeElement()
                .selectable(checked, source, indication = null, enabled = usable, role = Role.RadioButton) { radios.select(value) }
                .semantics {
                    if (label != null) contentDescription = label
                    if (!usable) disabled()
                },
            enabled = usable,
            description = description,
            box = {
                Box(
                    Modifier
                        .size(18.dp)
                        .box(
                            CircleShape,
                            fill = SolidColor(t.tint.color(0.04f)),
                            border = SolidColor(border),
                            shadows = focusRing(state.focusVisible) + Shadow(blur = 14f, spread = -3f, color = halo),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Box(
                        Modifier
                            .size(8.dp)
                            .graphicsLayer {
                                scaleX = dot
                                scaleY = dot
                            }
                            .box(CircleShape, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(blur = 8f, color = t.glow.color(0.9f * t.glowK)))),
                    )
                }
            },
            content = content,
        )
    }
}

/** The radio dot's spring: it overshoots a little as it fills in. */
private val Pop = CubicBezierEasing(0.3f, 1.6f, 0.5f, 1f)

/**
 * Choose one of a list: arrow keys move and pick within the group, which Tab enters at the chosen
 * option, as a native radio group. Fill it with Radios. `label` is shown above the options,
 * naming the group. For a few short options side by side use Segmented; for options that show
 * themselves, RadioCards.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun <V> RadioGroup(
    value: V?,
    onValueChange: (V) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    enabled: Boolean = true,
    orientation: Orientation = Orientation.Vertical,
    content: @Composable RadioGroupScope<V>.() -> Unit,
) {
    val radios = rememberRadios(value, onValueChange, enabled)
    val scope = remember(radios) { RadioGroupScope(radios) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (label != null) Text(label, style = TextStyles.sm.merge(TextStyles.medium))
        val group = modifier.selectableGroup().semantics { if (label != null) contentDescription = label }
        if (orientation == Orientation.Vertical) {
            Column(group, verticalArrangement = Arrangement.spacedBy(10.dp)) { scope.content() }
        } else {
            FlowRow(group, horizontalArrangement = Arrangement.spacedBy(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { scope.content() }
        }
    }
}
