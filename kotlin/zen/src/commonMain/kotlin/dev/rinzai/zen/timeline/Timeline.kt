package dev.rinzai.zen.timeline

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.spaceBetween

internal class TimelineEvent(
    val title: String,
    val time: String?,
    val icon: ImageVector?,
    val active: Boolean,
    val content: (@Composable () -> Unit)?,
)

/** The events of a Timeline, in order. */
class TimelineScope internal constructor() {
    internal val events = mutableListOf<TimelineEvent>()

    /**
     * One event: its title, when (`time`), and anything more as `content`. `icon` replaces the
     * dot; `active` lights it in the accent, e.g. what's happening now.
     */
    fun item(title: String, time: String? = null, icon: ImageVector? = null, active: Boolean = false, content: (@Composable () -> Unit)? = null) {
        events += TimelineEvent(title, time, icon, active, content)
    }
}

/** Events in order, each on a dot joined by a line: an activity feed, a history. */
@Composable
fun Timeline(modifier: Modifier = Modifier, content: TimelineScope.() -> Unit) {
    val t = Zen.tokens
    val events = TimelineScope().apply(content).events
    val line = t.tint.color(0.1f)
    Column(modifier) {
        events.forEachIndexed { i, e ->
            val last = i == events.lastIndex
            Row(
                Modifier
                    .fillMaxWidth()
                    .drawBehind {
                        // The line on to the next event.
                        if (last) return@drawBehind
                        val x = 11.dp.toPx().let { if (layoutDirection == LayoutDirection.Rtl) size.width - it - 1.dp.toPx() else it }
                        drawRect(line, Offset(x, 28.dp.toPx()), Size(1.dp.toPx(), size.height - 32.dp.toPx()))
                    }
                    .padding(bottom = if (last) 0.dp else 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Dot(e.icon, e.active)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = spaceBetween(12.dp)) {
                        Text(e.title, Modifier.alignByBaseline(), style = TextStyles.sm.merge(TextStyles.medium), color = t.foreground.color())
                        if (e.time != null) {
                            Text(e.time, Modifier.alignByBaseline(), style = TextStyles.xs.merge(TextStyles.tabular), color = t.mutedForeground.color())
                        }
                    }
                    if (e.content != null) ProvideText(t.mutedForeground.color(), TextStyles.sm.copy(lineHeight = 24.sp)) { e.content.invoke() }
                }
            }
        }
    }
}

@Composable
private fun Dot(icon: ImageVector?, active: Boolean) {
    val t = Zen.tokens
    val fill = when {
        active -> t.primary.color(0.15f)
        icon != null -> t.tint.color(0.06f)
        else -> null
    }
    val shadows = when {
        active -> listOf(Shadow(spread = 1f, color = t.primary.color(0.35f), inset = true), Shadow(blur = 16f, spread = -2f, color = t.glow.color(0.7f * t.glowK)))
        icon != null -> listOf(Shadow(spread = 1f, color = t.tint.color(0.1f), inset = true))
        else -> emptyList()
    }
    Box(
        Modifier.padding(top = 2.dp).size(24.dp).box(CircleShape, fill = fill?.let(::SolidColor), shadows = shadows),
        contentAlignment = Alignment.Center,
    ) {
        if (icon != null) {
            Icon(icon, size = 14.dp, color = if (active) t.primary.color() else t.mutedForeground.color())
        } else {
            Box(Modifier.size(8.dp).box(CircleShape, fill = SolidColor(if (active) t.primary.color() else t.tint.color(0.3f))))
        }
    }
}
