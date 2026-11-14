package dev.rinzai.zen.themetoggle

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.radii
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Zen
import dev.rinzai.zen.ThemeTarget
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.mix
import dev.rinzai.zen.rememberControlState

/**
 * Switches between the dark and light themes; the new theme spreads from the button like a drop
 * of water (the theme wave). On its own it switches the page's theme; give it `value` and
 * `onValueChange` and the theme is yours: it shows `value` and leaves applying the choice to you.
 * With `target` too, it switches a Themed area's theme (a panel, a preview), the water inside it.
 */
@Composable
fun ThemeToggle(
    modifier: Modifier = Modifier,
    value: Appearance? = null,
    onValueChange: ((Appearance) -> Unit)? = null,
    target: ThemeTarget? = null,
) {
    val page = LocalPage.current
    val t = Zen.tokens
    val m = LocalMessages.current
    val theme = value ?: page.appearance
    val next = if (theme == Appearance.Dark) Appearance.Light else Appearance.Dark
    val state = rememberControlState(remember { MutableInteractionSource() })
    // No transition: its hover look is instant, as the web toggle's is.
    val hover = if (state.hovered) 1f else 0f
    var center by remember { mutableStateOf(Offset.Zero) }
    Box(
        modifier
            .size(40.dp)
            .onGloballyPositioned { center = it.boundsInWindow().center }
            .box(Zen.radii.lg, fill = SolidColor(t.tint.color(0.06f * hover)), shadows = focusRing(state.focusVisible))
            .control(state, role = Role.Button) {
                (target?.wave ?: page.wave).change(next, center) {
                    if (value == null) page.appearance = next
                    onValueChange?.invoke(next)
                }
            }
            .semantics { contentDescription = if (next == Appearance.Dark) m.switchToDark else m.switchToLight },
        contentAlignment = Alignment.Center,
    ) {
        Icon(if (theme == Appearance.Dark) Icons.MoonMicro else Icons.SunMicro, color = mix(t.mutedForeground.color(), t.foreground.color(), hover))
    }
}
