package dev.rinzai.zen.avatar

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.Image
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.farthestCorner
import dev.rinzai.zen.radialGradient
import dev.rinzai.zen.ring

/**
 * Round profile picture; without an image, the name's initial on the glowing accent. Decorative
 * (hidden from screen readers) unless you give it `alt`. size-9 text-sm by default.
 */
@Composable
fun Avatar(
    name: String,
    modifier: Modifier = Modifier,
    /** The picture (a bitmap, a vector…), cropped to the circle. */
    image: Painter? = null,
    alt: String? = null,
    size: Dp = 36.dp,
    textStyle: TextStyle = TextStyles.sm,
) {
    val t = Zen.tokens
    val initial = (name.trim().firstOrNull() ?: '?').uppercaseChar().toString()
    val at = { s: androidx.compose.ui.geometry.Size -> Offset(s.width * 0.3f, s.height * 0.25f) }
    Box(
        modifier
            .size(size)
            .box(
                CircleShape,
                fill = radialGradient(at, { s -> farthestCorner(at(s), s) }, 0f to t.glow.color(0.9f), 1f to t.primary.color(0.55f)),
                shadows = listOf(ring(t.tint.color(0.12f), 1f), Shadow(blur = 18f, spread = -6f, color = t.glow.color(0.9f * t.glowStrength))),
            )
            .clip(CircleShape)
            .clearAndSetSemantics { if (alt != null) contentDescription = alt },
        contentAlignment = Alignment.Center,
    ) {
        // The initial stays under a picture, unseen: the avatar then sits on a line by the
        // initial's baseline either way, not by the picture's bottom edge.
        Text(initial, Modifier.alpha(if (image == null) 1f else 0f), style = textStyle.merge(TextStyles.semibold), color = t.primaryForeground.color())
        if (image != null) Image(image, null, Modifier.matchParentSize(), contentScale = ContentScale.Crop)
    }
}
