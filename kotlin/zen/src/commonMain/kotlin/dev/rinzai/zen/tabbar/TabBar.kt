package dev.rinzai.zen.tabbar

import dev.rinzai.zen.pressScale
import dev.rinzai.zen.frame
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.insetRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition
import dev.rinzai.zen.filterDropShadow

/**
 * Phone navigation: a glass bar fixed to the bottom, clear of the home indicator, hidden from
 * `hideFrom` up (md; null: always shown). Fill it with TabBarItems, which share it evenly. Its
 * height is kept in its frame's tabBarHeight (Zen.frame) (0 while hidden): a PlayerBar sits on it.
 */
@Composable
fun TabBar(
    modifier: Modifier = Modifier,
    label: String? = null,
    hideFrom: Dp? = Breakpoint.Md,
    /** Square by default, edge to edge; round its corners where it sits in a rounded frame. */
    shape: Shape = RectangleShape,
    content: @Composable RowScope.() -> Unit,
) {
    val page = LocalPage.current
    val frame = Zen.frame
    val density = LocalDensity.current
    val shown = hideFrom == null || !page.atLeast(hideFrom)
    DisposableEffect(frame, shown) {
        if (!shown) frame.tabBarHeight = 0.dp
        onDispose { frame.tabBarHeight = 0.dp }
    }
    if (!shown) return
    Portal(frame.fixed) {
        Box(
            modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .onSizeChanged { frame.tabBarHeight = with(density) { it.height.toDp() } }
                .glowEdge(shape, Sides.Top)
                .glass(shape, blur = true, sides = Sides.Top)
                .semantics { if (label != null) contentDescription = label }
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom)),
        ) {
            Row(Modifier.fillMaxWidth(), content = content)
        }
    }
}

/** One destination: an icon over a label. `active` marks the current page. */
@Composable
fun RowScope.TabBarItem(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    active: Boolean = false,
) {
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val color by animateColorAsState(if (active) t.primary.color() else t.mutedForeground.color(), transition(200, Ease.Standard))
    Column(
        modifier
            .weight(1f)
            .pressScale(state, transition(200, Ease.Standard))
            .box(RectangleShape, shadows = if (state.focusVisible) listOf(insetRing(t.ring.color(0.5f), 2f)) else emptyList())
            .control(state, role = Role.Tab, onClick = onClick)
            .semantics { selected = active }
            .padding(vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(
            icon,
            Modifier.filterDropShadow(if (active) Shadow(blur = 8f, color = t.glow.color(0.8f * t.glowK)) else null),
            size = 20.dp,
            color = color,
        )
        Text(label, style = TextStyles.xs2, color = color)
    }
}
