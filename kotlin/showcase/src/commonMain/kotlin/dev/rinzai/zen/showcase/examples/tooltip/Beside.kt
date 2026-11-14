package dev.rinzai.zen.showcase.examples.tooltip

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
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.PopupSide
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.tooltip.TooltipContent
import dev.rinzai.zen.tooltip.rememberTooltipState
import dev.rinzai.zen.tooltip.tooltipTrigger
import dev.rinzai.zen.transition

private val ITEMS = listOf("Home" to Icons.Squares, "Search" to Icons.Search, "Library" to Icons.MusicalNote, "Up next" to Icons.QueueList)

/** An icon rail, each icon's name in a tooltip beside it, clear of the icons below. The name is the button's own label, so it isn't also its description. */
@Composable
fun Beside() {
    val shape = Zen.radii.xl
    Column(Modifier.glass(shape).padding(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        for ((label, icon) in ITEMS) Item(label, icon)
    }
}

@Composable
private fun Item(label: String, icon: ImageVector) {
    val t = Zen.tokens
    val tip = rememberTooltipState()
    val state = rememberControlState()
    val fg by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
    val bg by animateColorAsState(t.tint.color(if (state.hovered) 0.07f else 0f), transition(150))
    Box(
        Modifier
            .size(40.dp)
            .box(Zen.radii.lg, fill = SolidColor(bg), shadows = focusRing(state.focusVisible))
            .tooltipTrigger(tip)
            .control(state) {}
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) { Icon(icon, size = 20.dp, color = fg) }
    TooltipContent(tip, side = PopupSide.Beside, offset = 8.dp) {
        Text(label, Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = TextStyles.sm)
    }
}
