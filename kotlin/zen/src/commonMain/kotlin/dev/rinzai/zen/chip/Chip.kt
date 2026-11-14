package dev.rinzai.zen.chip

import dev.rinzai.zen.pressScale
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/**
 * A small rounded button that can be pressed in, for quick picks beside a field (e.g. common
 * tenures): `pressed` marks the one matching the field. For exactly one of a few options, use Segmented.
 */
@Composable
fun Chip(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    pressed: Boolean? = null,
    enabled: Boolean = true,
    source: MutableInteractionSource = remember { MutableInteractionSource() },
    content: @Composable RowScope.() -> Unit,
) {
    val t = Zen.tokens
    val state = rememberControlState(source)
    val on = pressed == true
    val border by animateColorAsState(
        when {
            on -> t.primary.color(0.4f)
            state.hovered && enabled -> t.tint.color(0.2f)
            else -> t.tint.color(0.1f)
        },
        transition(150),
    )
    val fill by animateColorAsState(if (on) t.primary.color(0.15f) else t.primary.color(0f), transition(150))
    val text by animateColorAsState(if (on || (state.hovered && enabled)) t.foreground.color() else t.mutedForeground.color(), transition(150))
    Row(
        modifier
            .pressScale(state, transition(150), enabled)
            .box(CircleShape, fill = SolidColor(fill), border = SolidColor(border), shadows = focusRing(state.focusVisible))
            .control(state, enabled, Role.Button, notAllowed = true, onClick = onClick)
            .semantics { if (pressed != null) stateDescription = if (pressed) "On" else "Off" }
            .padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(text, TextStyles.xs) { content() }
    }
}
