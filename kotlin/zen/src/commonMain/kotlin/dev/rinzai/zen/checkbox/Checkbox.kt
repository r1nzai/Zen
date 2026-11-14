package dev.rinzai.zen.checkbox

import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.triStateToggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.fieldInvalid
import dev.rinzai.zen.ChoiceLabel
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.spaceOnly
import dev.rinzai.zen.transition

/**
 * A checkbox: Space flips it, as a native one. The tick draws itself in when checked;
 * `indeterminate` shows a dash (e.g. "some selected"). With `content`, it's the label (and
 * `description` a line under it), and pressing anywhere on it flips the box; without, name it
 * with `label`.
 */
@Composable
fun Checkbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    indeterminate: Boolean = false,
    invalid: Boolean = false,
    label: String? = null,
    description: (@Composable () -> Unit)? = null,
    source: MutableInteractionSource = remember { MutableInteractionSource() },
    content: (@Composable () -> Unit)? = null,
) {
    val t = Zen.tokens
    val state = rememberControlState(source)
    val on = checked || indeterminate
    val spec = transition<Color>(200)
    // As in the stylesheet, hover comes after :checked and aria-invalid after both.
    val invalid = fieldInvalid(invalid)
    val edge = when {
        invalid -> t.destructive.color()
        state.hovered && enabled -> t.tint.color(t.zenControlEdgeHover)
        on -> t.primary.color()
        else -> t.tint.color(t.zenControlEdge)
    }
    val border by animateColorAsState(edge, spec)
    val fill by animateColorAsState(if (on) t.primary.color() else t.tint.color(0.04f), spec)
    val halo by animateColorAsState(t.glow.color(if (on) 0.8f * t.glowK else 0f), spec)
    val drawn by animateFloatAsState(if (checked) 1f else 0f, transition(300, Ease.Out))
    val toggle = Modifier
        .hoverable(source, enabled)
        .pointerHoverIcon(pressCursor(enabled))
        .spaceOnly()
        .activeElement()
        .triStateToggleable(
            if (indeterminate) ToggleableState.Indeterminate else ToggleableState(checked),
            source,
            indication = null,
            enabled = enabled,
            role = Role.Checkbox,
        ) { onCheckedChange(!checked) }
        .fieldControl(label)
    val box = @Composable { boxModifier: Modifier ->
        Box(
            boxModifier
                .size(18.dp)
                .alpha(if (enabled) 1f else 0.5f)
                .box(
                    RoundedCornerShape(5.dp),
                    fill = SolidColor(fill),
                    border = SolidColor(border),
                    shadows = focusRing(state.focusVisible) + Shadow(blur = 14f, spread = -2f, color = halo),
                ),
            contentAlignment = Alignment.Center,
        ) {
            val ink = t.primaryForeground.color()
            if (indeterminate) Icon(Icons.MinusMicro, size = 14.dp, color = ink)
            // Uncovered from left to right, as if drawn, as the box is checked.
            else Icon(
                Icons.CheckMicro,
                Modifier.alpha(drawn).drawWithContent { clipRect(right = size.width * drawn) { this@drawWithContent.drawContent() } },
                size = 14.dp,
                color = ink,
            )
        }
    }
    if (content == null) box(modifier.then(toggle))
    else ChoiceLabel(modifier.then(toggle), enabled, description, { box(Modifier) }, content)
}
