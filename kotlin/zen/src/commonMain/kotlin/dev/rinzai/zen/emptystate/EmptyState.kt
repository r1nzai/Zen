package dev.rinzai.zen.emptystate

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii

/**
 * What shows where there's nothing yet: a list with no items, a search with no results. A title,
 * a line saying why or what to do, an optional glowing `icon`, and `actions` under it.
 */
@Composable
fun EmptyState(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: ImageVector? = null,
    actions: (@Composable RowScope.() -> Unit)? = null,
) {
    val t = Zen.tokens
    Column(
        modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 40.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (icon != null) {
            Box(
                Modifier
                    .padding(bottom = 4.dp)
                    .size(48.dp)
                    .box(
                        Zen.radii.xl2,
                        fill = SolidColor(t.primary.color(0.1f)),
                        shadows = listOf(
                            Shadow(spread = 1f, color = t.primary.color(0.25f), inset = true),
                            Shadow(blur = 32f, spread = -6f, color = t.glow.color(0.6f * t.glowK)),
                        ),
                    ),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, size = 24.dp, color = t.primary.color()) }
        }
        // text-balance: lines of even length.
        val balanced = TextStyles.base.copy(lineBreak = LineBreak.Heading)
        Text(
            title,
            style = balanced.merge(TextStyles.semibold).merge(TextStyles.tight),
            color = t.foreground.color(),
            align = TextAlign.Center,
        )
        if (description != null) {
            Text(
                description,
                Modifier.widthIn(max = 384.dp),
                style = balanced.merge(TextStyles.sm).copy(lineHeight = 24.sp, lineBreak = LineBreak.Heading),
                color = t.mutedForeground.color(),
                align = TextAlign.Center,
            )
        }
        if (actions != null) {
            FlowRow(
                Modifier.padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) { actions() }
        }
    }
}
