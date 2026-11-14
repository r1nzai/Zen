package dev.rinzai.zen.showcase.examples.tooltip

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.tooltip.TooltipContent
import dev.rinzai.zen.tooltip.rememberTooltipState
import dev.rinzai.zen.tooltip.tooltipTrigger

/** Shows on hover and on keyboard focus; the trigger is described by it for screen readers. */
@Composable
fun Default() {
    val tip = rememberTooltipState()
    val state = rememberControlState()
    // A button is an inline box: the badge sits on its line's baseline, under the line's leading.
    Row(
        Modifier
            .box(Zen.radii.md, shadows = focusRing(state.focusVisible))
            .tooltipTrigger(tip, description = "Beta feature. This feature is still in preview and may change.")
            .control(state) {},
    ) {
        Text("", Modifier.alignByBaseline())
        Badge(Modifier.alignByBaseline(), variant = BadgeVariant.Secondary) { Text("Beta") }
    }
    TooltipContent(tip) {
        Column(Modifier.padding(12.dp)) {
            Text("Beta feature", style = TextStyles.sm.merge(TextStyles.medium))
            Text(
                "This feature is still in preview and may change.",
                Modifier.padding(top = 2.dp),
                style = TextStyles.sm,
                color = Zen.tokens.mutedForeground.color(),
            )
        }
    }
}
