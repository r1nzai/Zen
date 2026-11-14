package dev.rinzai.zen.separator

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box

/**
 * A hairline between groups of content, across (the default) or upright (`Orientation.Vertical`,
 * e.g. between toolbar buttons; it takes its container's height).
 */
@Composable
fun Separator(modifier: Modifier = Modifier, orientation: Orientation = Orientation.Horizontal) {
    val size = if (orientation == Orientation.Horizontal) Modifier.fillMaxWidth().height(1.dp) else Modifier.width(1.dp).fillMaxHeight()
    Box(modifier.then(size).box(RectangleShape, fill = SolidColor(Zen.tokens.tint.color(0.09f))))
}
