package dev.rinzai.zen.sidenav

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/** Vertical navigation, e.g. a docs or settings sidebar; `label` names it. */
@Composable
fun SideNav(modifier: Modifier = Modifier, label: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier.semantics { if (label != null) contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(24.dp),
        content = content,
    )
}

/** A titled group of links. */
@Composable
fun SideNavGroup(modifier: Modifier = Modifier, title: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        if (title != null) {
            ProvideText(transform = TextTransform.Uppercase) {
                Text(
                    title,
                    Modifier.padding(start = 12.dp, end = 12.dp, bottom = 4.dp),
                    style = TextStyles.xs2.copy(letterSpacing = 0.1.em),
                    color = Zen.tokens.mutedForeground.color(),
                )
            }
        }
        content()
    }
}

/** One link; `active` marks the current page. */
@Composable
fun SideNavLink(onClick: () -> Unit, modifier: Modifier = Modifier, active: Boolean = false, content: @Composable () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val spec = transition<Color>(200)
    val fill by animateColorAsState(
        when {
            active -> t.primary.color(0.15f)
            state.hovered -> t.tint.color(0.05f)
            else -> t.tint.color(0f)
        },
        spec,
    )
    val ink by animateColorAsState(if (active || state.hovered) t.foreground.color() else t.mutedForeground.color(), spec)
    val edge by animateColorAsState(t.primary.color(if (active) 0.25f else 0f), spec)
    Box(
        modifier
            .fillMaxWidth()
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible) + Shadow(spread = 1f, color = edge, inset = true))
            .control(state, onClick = onClick)
            .semantics { selected = active }
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        ProvideText(ink, TextStyles.sm) { content() }
    }
}
