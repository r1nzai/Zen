package dev.rinzai.zen.toggle

import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
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
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.ShadowMd
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/**
 * On/off switch. Space and Enter both flip it, as for a switch button; `label` names it where
 * nothing beside it does.
 */
@Composable
fun Toggle(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    source: MutableInteractionSource = remember { MutableInteractionSource() },
) {
    val t = Zen.tokens
    val state = rememberControlState(source)
    val spec = transition<Color>(300)
    val border by animateColorAsState(if (checked) t.glow.color(0.6f) else t.tint.color(t.zenControlEdge), spec)
    val fill by animateColorAsState(if (checked) t.glow.color(0.4f) else t.tint.color(0.06f), spec)
    val halo by animateColorAsState(if (checked) t.glow.color(0.8f * t.glowK) else t.glow.color(0f), spec)
    val thumb by animateColorAsState(if (checked) Color.White else t.zenThumbOff, transition(300, Ease.OutSoft))
    val x by animateDpAsState(if (checked) 20.dp else 0.dp, transition(300, Ease.OutSoft))
    Box(
        modifier
            .size(44.dp, 24.dp)
            .alpha(if (enabled) 1f else 0.5f)
            .box(
                CircleShape,
                fill = SolidColor(fill),
                border = SolidColor(border),
                shadows = focusRing(state.focusVisible) + Shadow(blur = 18f, spread = -2f, color = halo),
            )
            .pointerHoverIcon(pressCursor(enabled))
            .activeElement()
            .toggleable(checked, source, indication = null, enabled = enabled, role = Role.Switch, onValueChange = onCheckedChange)
            .semantics { if (label != null) contentDescription = label }
            .padding(2.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(Modifier.offset(x = x).size(18.dp).box(CircleShape, fill = SolidColor(thumb), shadows = ShadowMd))
    }
}
