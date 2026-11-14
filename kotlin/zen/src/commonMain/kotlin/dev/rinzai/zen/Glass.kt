package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.GlobalPositionAwareModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.currentValueOf
import androidx.compose.ui.node.requireGraphicsContext
import androidx.compose.ui.unit.IntSize
import kotlin.math.ceil
import kotlin.math.max

/**
 * The glass utility: tinted glass (a card colour fading a little towards the bottom) with a
 * hairline, a lit top edge and the theme's glass shadow. Without `blur` it's clear glass over the
 * page (cards); with it (glass-blur: popups, bars over scrolling content) what's behind frosts, at
 * 18px and saturated 1.4×, where there's live blur. On a touch screen it's solid card instead.
 * `background` lies under the tinted glass, over what's frosted (a `hover:bg-*` on glass);
 * `shadows` replace its own, as a later box-shadow does (a focus ring while focused), and
 * `border` its hairline's colour.
 */
@Composable
fun Modifier.glass(
    shape: Shape,
    blur: Boolean = false,
    sides: Sides = Sides.All,
    shadows: List<Shadow>? = null,
    /** The shadow under the panel (CSS's --glass-shadow), below its top highlight. */
    shadow: Shadow? = null,
    background: Color = Color.Transparent,
    border: Color? = null,
): Modifier {
    val t = Zen.tokens
    val solid = blur && coarsePointer
    val fill: Brush = if (solid) SolidColor(t.card.color()) else glassFill(t)
    return this
        .then(if (blur && !solid) Modifier.backdropBlur(shape, 18f, saturation = 1.4f) else Modifier)
        .box(shape, fill = SolidColor(background))
        .box(
            shape,
            fill = fill,
            border = SolidColor(border ?: t.tint.color(0.07f)),
            sides = sides,
            shadows = shadows ?: listOf(Shadow(y = 1f, color = Color.White.copy(alpha = 0.06f), inset = true), shadow ?: t.glassShadow),
        )
}

/** The glass utility's tint: a card colour fading a little towards the bottom. */
internal fun glassFill(t: Tokens): Brush = linearGradient(180f, 0f to t.card.color(0.82f), 1f to t.card.color(0.7f))

/**
 * CSS's `backdrop-filter: blur(sigma) saturate(saturation)`: what's drawn behind this (the page,
 * or everything, under a popup) blurred into it, clipped to `shape`. Only the part under the box is
 * sampled, edges mirrored, as Chrome does. Not on a touch screen.
 */
fun Modifier.backdropBlur(shape: Shape, sigma: Float, saturation: Float = 1f): Modifier =
    if (coarsePointer) this else this.graphicsLayer() then BackdropBlurElement(shape, sigma, saturation)

private data class BackdropBlurElement(val shape: Shape, val sigma: Float, val saturation: Float) :
    ModifierNodeElement<BackdropBlurNode>() {
    override fun create() = BackdropBlurNode(shape, sigma, saturation)
    override fun update(node: BackdropBlurNode) {
        node.shape = shape
        node.sigma = sigma
        node.saturation = saturation
    }
}

private class BackdropBlurNode(var shape: Shape, var sigma: Float, var saturation: Float) :
    Modifier.Node(), DrawModifierNode, GlobalPositionAwareModifierNode, CompositionLocalConsumerModifierNode {
    private var origin = Offset.Zero
    private var frosted: GraphicsLayer? = null

    override fun onGloballyPositioned(coordinates: LayoutCoordinates) {
        origin = coordinates.positionInRoot()
    }

    override fun onDetach() {
        frosted?.let { requireGraphicsContext().releaseGraphicsLayer(it) }
        frosted = null
    }

    override fun ContentDrawScope.draw() {
        val source = currentValueOf(LocalBackdrop)
        val behind = source?.layer
        if (source != null && behind != null) {
            // Read so this redraws whenever what's behind does.
            source.frame
            val layer = frosted ?: requireGraphicsContext().createGraphicsLayer().also { frosted = it }
            clipPath(shape.createOutline(size, layoutDirection, this).toPath()) {
                frost(layer, size, sigma, saturation) { translate(source.origin.x - origin.x, source.origin.y - origin.y) { drawLayer(behind) } }
            }
        }
        drawContent()
    }
}

/**
 * Draws `behind` (what's under this box, drawn in its coordinates) blurred by `sigma` and saturated,
 * as backdrop-filter does, recorded into `layer`: only the part under the box, edges mirrored.
 */
internal fun DrawScope.frost(layer: GraphicsLayer, size: Size, sigma: Float, saturation: Float, behind: DrawScope.() -> Unit) {
    // Compose's blur radius r is a sigma of 0.57735 r + 0.5; CSS gives the sigma. Mirrored at the edges, as backdrop-filter is.
    val r = max(0f, (sigma * density - 0.5f) / 0.57735f)
    layer.renderEffect = BlurEffect(r, r, TileMode.Mirror)
    layer.colorFilter = if (saturation != 1f) ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(saturation) }) else null
    layer.record(IntSize(ceil(size.width).toInt(), ceil(size.height).toInt()), block = behind)
    drawLayer(layer)
}
