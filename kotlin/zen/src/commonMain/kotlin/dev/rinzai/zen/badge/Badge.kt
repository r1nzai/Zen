package dev.rinzai.zen.badge

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii

enum class BadgeVariant { Default, Secondary, Outline }

enum class BadgeTone { Default, Negative }

/** A small label for status, counts and tags; `tone = Negative` for bad news. `contentPadding` replaces px-1.5 py-0.5. */
@Composable
fun Badge(
    modifier: Modifier = Modifier,
    variant: BadgeVariant = BadgeVariant.Default,
    tone: BadgeTone = BadgeTone.Default,
    contentPadding: PaddingValues = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
    content: @Composable RowScope.() -> Unit,
) {
    val t = Zen.tokens
    val negative = tone == BadgeTone.Negative
    val border = when {
        negative -> t.destructive.color(0.4f)
        variant == BadgeVariant.Default -> t.glow.color(0.3f)
        else -> t.tint.color(0.1f)
    }
    val fill = when {
        negative -> t.destructive.color(0.1f)
        variant == BadgeVariant.Default -> t.glow.color(0.1f)
        variant == BadgeVariant.Secondary -> t.tint.color(0.06f)
        else -> null
    }
    val text = when {
        negative -> t.destructive.color()
        variant == BadgeVariant.Default -> t.primary.color()
        else -> t.foreground.color()
    }
    Row(
        modifier
            .box(Zen.radii.md, fill = fill?.let(::SolidColor), border = SolidColor(border))
            .padding(contentPadding),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(text, TextStyles.xs.merge(TextStyles.medium)) { content() }
    }
}
