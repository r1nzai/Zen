package dev.rinzai.zen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.VectorGroup
import androidx.compose.ui.graphics.vector.VectorNode
import androidx.compose.ui.graphics.vector.VectorPath
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** The size icons inside take, as a component's `[&_svg]:size-*` sets it: size-4 unless one says otherwise. */
val LocalIconSize = compositionLocalOf { 16.dp }

/**
 * An icon in the current colour (currentColor), `size` square (LocalIconSize by default). An
 * outline icon's lines are drawn `strokeWidth` wide, in its own units, where one is given.
 */
@Composable
fun Icon(
    icon: ImageVector,
    modifier: Modifier = Modifier,
    size: Dp = LocalIconSize.current,
    color: Color = Color.Unspecified,
    strokeWidth: Float? = null,
) {
    val tint = if (color != Color.Unspecified) color else LocalContentColor.current
    val drawn = if (strokeWidth == null) icon else remember(icon, strokeWidth) { icon.stroked(strokeWidth) }
    Image(drawn, contentDescription = null, modifier.size(size), colorFilter = ColorFilter.tint(tint))
}

private fun ImageVector.stroked(width: Float): ImageVector {
    val b = ImageVector.Builder(name, defaultWidth, defaultHeight, viewportWidth, viewportHeight)
    fun add(node: VectorNode) {
        when (node) {
            is VectorPath -> b.addPath(
                node.pathData, node.pathFillType, node.name, node.fill, node.fillAlpha, node.stroke, node.strokeAlpha,
                if (node.stroke != null) width else node.strokeLineWidth, node.strokeLineCap, node.strokeLineJoin, node.strokeLineMiter,
            )
            is VectorGroup -> {
                b.addGroup(node.name, node.rotation, node.pivotX, node.pivotY, node.scaleX, node.scaleY, node.translationX, node.translationY, node.clipPathData)
                for (child in node) add(child)
                b.clearGroup()
            }
        }
    }
    for (child in root) add(child)
    return b.build()
}
