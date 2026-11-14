package dev.rinzai.zen.showcase.examples.avatar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.avatar.Avatar

/** The example's photo: a figure on a dark square, drawn as the web example's SVG is. */
private class Photo : Painter() {
    override val intrinsicSize = Size(64f, 64f)
    override fun DrawScope.onDraw() {
        val k = size.width / 64f
        val accent = Color(0xFFAB93ED)
        drawRect(Color(0xFF2F2943))
        drawCircle(accent, 12f * k, Offset(32f * k, 26f * k))
        drawRoundRect(accent, Offset(12f * k, 42f * k), Size(40f * k, 30f * k), CornerRadius(15f * k))
    }
}

/** An image, or the name's initial on the accent. Size it with `size`. */
@Composable
fun Default() {
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Avatar("rin@example.com")
        Avatar("Sam", size = 48.dp, textStyle = TextStyles.lg)
        Avatar("Alex", image = remember { Photo() }, alt = "Alex", size = 48.dp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar("Priya", size = 28.dp, textStyle = TextStyles.xs)
            Text("Priya", style = TextStyles.sm)
        }
    }
}
