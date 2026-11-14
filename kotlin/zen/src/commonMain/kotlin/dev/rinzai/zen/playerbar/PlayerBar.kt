package dev.rinzai.zen.playerbar

import dev.rinzai.zen.frame
import dev.rinzai.zen.Zen
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.Sides
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge

/**
 * What's playing, along the bottom of the screen: a glass bar for the cover, the title, the
 * controls and a SeekBar, in a row `gap` apart. It sits on a TabBar, and clears the home indicator
 * where there's none. Its height is kept in its frame's playerBarHeight (Zen.frame), for the page to pad its
 * end by. Name it with `label` ("Now playing"). `overlay` is drawn over the bar, placed in it as
 * CSS places an absolutely positioned child.
 */
@Composable
fun PlayerBar(
    modifier: Modifier = Modifier,
    label: String? = null,
    gap: Dp = 16.dp,
    /** Square by default, edge to edge; round its corners where it sits in a rounded frame. */
    shape: Shape = RectangleShape,
    /** px-4 pt-3, and room below for the home indicator where there's no TabBar under it. */
    contentPadding: PaddingValues? = null,
    overlay: @Composable BoxScope.() -> Unit = {},
    content: @Composable RowScope.() -> Unit,
) {
    val frame = Zen.frame
    val density = LocalDensity.current
    val safeBottom = with(density) { WindowInsets.safeDrawing.getBottom(this).toDp() }
    DisposableEffect(frame) { onDispose { frame.playerBarHeight = 0.dp } }
    Portal(frame.fixed) {
        Box(
            Modifier
                .align(Alignment.BottomStart)
                .padding(bottom = frame.tabBarHeight)
                .fillMaxWidth()
                .onSizeChanged { frame.playerBarHeight = with(density) { it.height.toDp() } }
                .glowEdge(shape, Sides.Top)
                .glass(shape, blur = true, sides = Sides.Top)
                .semantics { if (label != null) contentDescription = label }
                .then(modifier),
        ) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(contentPadding ?: PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 12.dp + max(0.dp, safeBottom - frame.tabBarHeight))),
                horizontalArrangement = Arrangement.spacedBy(gap),
                verticalAlignment = Alignment.CenterVertically,
                content = content,
            )
            overlay()
        }
    }
}
