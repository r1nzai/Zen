package dev.rinzai.zen.togglegroup

import dev.rinzai.zen.pressScale
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalRoving
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberRoving
import dev.rinzai.zen.rovingItem
import dev.rinzai.zen.toolbar.LocalToolbarOrientation
import dev.rinzai.zen.transition

/** Which of a ToggleGroup's items are pressed: at most one, or any number with `multiple`. */
@Stable
class ToggleGroupState internal constructor(pressed: Set<String>, val multiple: Boolean) {
    var pressed by mutableStateOf(pressed)

    fun isPressed(value: String) = value in pressed

    fun setPressed(value: String, on: Boolean) {
        pressed = when {
            multiple -> if (on) pressed + value else pressed - value
            on -> setOf(value)
            else -> emptySet()
        }
    }
}

@Composable
fun rememberToggleGroupState(vararg pressed: String, multiple: Boolean = false) =
    remember { ToggleGroupState(pressed.toSet(), multiple) }

private val LocalToggleGroup = staticCompositionLocalOf<ToggleGroupState?> { null }

/**
 * Buttons that stay pressed, in a row: any number of them (`multiple`, e.g. filters), or at most
 * one, which can be released again. For exactly one always chosen, use Segmented. ←→ move between
 * them, Home and End jump to the ends; Space or Enter presses. In a Toolbar, it's one with it.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ToggleGroup(
    state: ToggleGroupState,
    modifier: Modifier = Modifier,
    label: String? = null,
    content: @Composable () -> Unit,
) {
    val toolbar = LocalToolbarOrientation.current
    // In a Toolbar, its items are the Toolbar's to move through.
    val roving = if (toolbar == null) rememberRoving(Orientation.Horizontal) else LocalRoving.current
    val shape = Zen.radii.xl
    val t = Zen.tokens
    val group = modifier
        .semantics { if (label != null) contentDescription = label }
        // Its own glass track, unless a Toolbar already is one.
        .then(
            if (toolbar != null) Modifier
            else Modifier.glowEdge(shape, Sides.All).box(shape, fill = SolidColor(t.tint.color(0.03f)), border = SolidColor(t.tint.color(0.1f))).padding(4.dp),
        )
    CompositionLocalProvider(LocalToggleGroup provides state, LocalRoving provides roving) {
        when (toolbar) {
            Orientation.Vertical -> Column(group, verticalArrangement = Arrangement.spacedBy(4.dp)) { content() }
            Orientation.Horizontal -> Row(group, horizontalArrangement = Arrangement.spacedBy(4.dp)) { content() }
            null -> FlowRow(group, horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) { content() }
        }
    }
}

/**
 * One button of a ToggleGroup: text, an icon (name it with `label`), or both. `padding` is at
 * its sides (px-3; px-2 suits an icon alone).
 */
@Composable
fun ToggleGroupItem(
    value: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    padding: Dp = 12.dp,
    content: @Composable RowScope.() -> Unit,
) {
    val group = LocalToggleGroup.current ?: error("ToggleGroupItem must be inside ToggleGroup")
    val t = Zen.tokens
    val pressed = group.isPressed(value)
    val state = rememberControlState(remember { MutableInteractionSource() })
    val spec = transition<Color>(300)
    val ink by animateColorAsState(if (pressed || (state.hovered && enabled)) t.foreground.color() else t.mutedForeground.color(), spec)
    val fill by animateColorAsState(t.primary.color(if (pressed) 0.15f else 0f), spec)
    val edge by animateColorAsState(t.primary.color(if (pressed) 0.4f else 0f), spec)
    Row(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .height(32.dp)
            .pressScale(state, transition(300), enabled)
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible) + Shadow(spread = 1f, color = edge, inset = true))
            .rovingItem(enabled, preferred = pressed)
            .control(state, enabled, Role.Button, notAllowed = true) { group.setPressed(value, !pressed) }
            .semantics {
                if (label != null) contentDescription = label
                stateDescription = if (pressed) "Pressed" else "Not pressed"
            }
            .padding(horizontal = padding),
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(ink, TextStyles.sm) { content() }
    }
}
