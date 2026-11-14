package dev.rinzai.zen.alert

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalIconSize
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import androidx.compose.runtime.CompositionLocalProvider

/** `Positive` in the accent colour, `Negative` in red for bad news. */
enum class AlertTone { Default, Positive, Negative }

/** The tone's own icon: info, check, warning, at the size an Alert gives icons. */
@Composable
fun AlertToneIcon(tone: AlertTone) = Icon(
    when (tone) {
        AlertTone.Default -> Icons.InformationCircleMicro
        AlertTone.Positive -> Icons.CheckMicro
        AlertTone.Negative -> Icons.ExclamationTriangleMicro
    },
)

/**
 * A message beside the content it's about: a notice, a warning, a failure. A tinted box by
 * default, or with `plain`, just the icon and text in the tone's colour. With a `title`, the title
 * takes the tone and the text under it is quieter. Bad news is announced at once, anything else
 * politely; `announce = false` for a message that doesn't change. `icon` replaces the tone's;
 * null for none.
 */
@Composable
fun Alert(
    modifier: Modifier = Modifier,
    tone: AlertTone = AlertTone.Default,
    plain: Boolean = false,
    title: (@Composable () -> Unit)? = null,
    icon: (@Composable () -> Unit)? = { AlertToneIcon(tone) },
    announce: Boolean = true,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val (border, fill, colour) = when (tone) {
        AlertTone.Default -> Triple(t.tint.color(0.08f), t.tint.color(0.03f), t.mutedForeground.color())
        AlertTone.Positive -> Triple(t.primary.color(0.3f), t.primary.color(0.1f), t.primary.color())
        AlertTone.Negative -> Triple(t.destructive.color(0.35f), t.destructive.color(0.1f), t.destructive.color())
    }
    Row(
        modifier
            .semantics { if (announce) liveRegion = if (tone == AlertTone.Negative) LiveRegionMode.Assertive else LiveRegionMode.Polite }
            .then(
                if (plain) Modifier
                else Modifier.box(Zen.radii.lg, fill = SolidColor(fill), border = SolidColor(border)).padding(horizontal = 12.dp, vertical = 8.dp),
            ),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        ProvideText(colour, TextStyles.sm) {
            if (icon != null) {
                Box(Modifier.padding(top = 2.dp)) { CompositionLocalProvider(LocalIconSize provides 14.dp) { icon() } }
            }
            if (title != null) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    ProvideText(style = TextStyles.medium) { title() }
                    ProvideText(t.mutedForeground.color()) { content() }
                }
            } else {
                Box { content() }
            }
        }
    }
}
