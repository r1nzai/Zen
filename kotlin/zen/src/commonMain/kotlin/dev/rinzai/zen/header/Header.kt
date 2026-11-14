package dev.rinzai.zen.header

import dev.rinzai.zen.frame
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.zIndex
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Zen
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.backdropBlur
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.glowEdge
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * A sticky bar across the top of the page: the page colour, translucent and heavily blurred, over
 * a hairline. Clears the notch on phones, where it's solid instead (a live blur over scrolling
 * content stutters there). Its children sit in a row, spaced between.
 *
 * Its first stop for the keyboard is a "Skip to content" link, hidden until focused, that moves
 * focus to the page's main content (Modifier.main) past the bar's links (WCAG 2.4.1). Change its
 * text with `skipLabel`, or pass null to leave it out. With `sticky = false` it stays in its place
 * in the page (CSS's `static`), e.g. inside a frame.
 */
@Composable
fun Header(
    modifier: Modifier = Modifier,
    skipLabel: String? = LocalMessages.current.skipToContent,
    sticky: Boolean = true,
    content: @Composable RowScope.() -> Unit,
) {
    val page = LocalPage.current
    if (!sticky) return Bar(modifier.fillMaxWidth(), skipLabel, content)
    val density = LocalDensity.current
    var height by remember { mutableStateOf(0.dp) }
    var flowTop by remember { mutableFloatStateOf(0f) }
    // Its place in the page keeps the room; the bar itself is drawn over the page, stuck at the top.
    Spacer(Modifier.fillMaxWidth().height(height).onGloballyPositioned { flowTop = it.positionInRoot().y })
    Portal(Zen.frame.fixed) {
        Bar(
            modifier
                .align(Alignment.TopStart)
                .offset { IntOffset(0, max(0f, flowTop).roundToInt()) }
                .fillMaxWidth()
                .onSizeChanged { height = with(density) { it.height.toDp() } },
            skipLabel,
            content,
        )
    }
}

@Composable
private fun Bar(modifier: Modifier, skipLabel: String?, content: @Composable RowScope.() -> Unit) {
    val t = Zen.tokens
    val md = LocalPage.current.atLeast(Breakpoint.Md)
    Box(
        modifier
            .glowEdge(RectangleShape, Sides.Bottom)
            .then(if (coarsePointer) Modifier else Modifier.backdropBlur(RectangleShape, 24f))
            .box(
                RectangleShape,
                fill = SolidColor(t.background.color(if (coarsePointer) 0.95f else 0.6f)),
                border = SolidColor(t.tint.color(0.05f)),
                sides = Sides.Bottom,
            ),
    ) {
        if (skipLabel != null) SkipLink(skipLabel)
        Row(
            Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top))
                .padding(horizontal = if (md) 24.dp else 16.dp, vertical = if (md) 12.dp else 10.dp),
            horizontalArrangement = spaceBetween(if (md) 24.dp else 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

/** Hidden (taking no room) until focused, then over the bar's start. */
@Composable
private fun SkipLink(label: String) {
    val page = LocalPage.current
    val t = Zen.tokens
    val state = rememberControlState()
    val shown by state.source.collectIsFocusedAsState()
    Box(
        Modifier
            .zIndex(1f)
            .then(
                if (shown) Modifier.offset(16.dp, 8.dp).box(Zen.radii.lg, fill = SolidColor(t.primary.color()), shadows = focusRing(state.focusVisible))
                else Modifier.semantics { contentDescription = label },
            )
            .control(state, role = null) { page.main?.focus() }
            .then(if (shown) Modifier.padding(horizontal = 12.dp, vertical = 8.dp) else Modifier),
    ) {
        if (shown) Text(label, style = TextStyles.sm.merge(TextStyles.medium), color = t.primaryForeground.color())
    }
}
