package dev.rinzai.zen.showcase

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.PopupSide
import dev.rinzai.zen.Fixed
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.tooltip.TooltipContent
import dev.rinzai.zen.tooltip.rememberTooltipState
import dev.rinzai.zen.tooltip.tooltipTrigger
import dev.rinzai.zen.transition

/** The library's sections down the side of a wide window, each named in a tooltip. */
@Composable
internal fun Rail() {
    val page = LocalPage.current
    if (!page.atLeast(Breakpoint.Md)) return
    Fixed {
        Column(
            Modifier
                .align(Alignment.CenterStart)
                .padding(start = 16.dp)
                .glass(Zen.radii.xl2, blur = true)
                .semantics { contentDescription = "Library" }
                .padding(6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            TABS.forEachIndexed { i, (label, icon) -> RailItem(label, icon, current = i == 0) }
        }
    }
}

@Composable
private fun RailItem(label: String, icon: ImageVector, current: Boolean) {
    val t = Zen.tokens
    val tip = rememberTooltipState()
    val state = rememberControlState()
    val fg by animateColorAsState(
        when {
            current -> t.primary.color()
            state.hovered -> t.foreground.color()
            else -> t.mutedForeground.color()
        },
        transition(150),
    )
    val bg by animateColorAsState(
        when {
            current -> t.primary.color(0.1f)
            state.hovered -> t.tint.color(0.07f)
            else -> t.tint.color(0f)
        },
        transition(150),
    )
    Box(
        Modifier
            .size(40.dp)
            .box(Zen.radii.xl, fill = SolidColor(bg), shadows = focusRing(state.focusVisible))
            .tooltipTrigger(tip)
            .control(state, label = label) {}
            .semantics {
                contentDescription = label
                selected = current
            },
        contentAlignment = Alignment.Center,
    ) { Icon(icon, size = 20.dp, color = fg) }
    TooltipContent(tip, side = PopupSide.Beside, offset = 10.dp) {
        Text(label, Modifier.padding(horizontal = 10.dp, vertical = 6.dp), TextStyles.sm)
    }
}
