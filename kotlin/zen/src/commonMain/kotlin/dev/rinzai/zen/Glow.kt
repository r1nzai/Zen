package dev.rinzai.zen

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.GlobalPositionAwareModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.currentValueOf
import androidx.compose.ui.node.invalidateDraw
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The pointer light Backdrop drives, in the page's coordinates: where it is (trailing the pointer
 * by --glow-trail), and how lit it is (fading out where it is as the pointer leaves the window,
 * and back in where it returns, over 400ms).
 */
@Stable
class PointerLight internal constructor() {
    /** Where the light is now. */
    var at by mutableStateOf(Offset(-9999f, -9999f))
        internal set

    /** Where the pointer is, which the light chases. */
    internal var target = Offset(-9999f, -9999f)

    /** 1 while the pointer is in the window, fading to 0 out of it. */
    internal val lit = Animatable(0f)

    /** The pointer is in the window. */
    var inside by mutableStateOf(false)
        internal set
}

/** Which sides of a box have a border (CSS border widths): the light is drawn on those. */
data class Sides(val top: Dp = 0.dp, val right: Dp = 0.dp, val bottom: Dp = 0.dp, val left: Dp = 0.dp) {
    companion object {
        val All = Sides(1.dp, 1.dp, 1.dp, 1.dp)
        val Top = Sides(top = 1.dp)
        val Bottom = Sides(bottom = 1.dp)
    }
}

internal val LocalAmbientGlow = staticCompositionLocalOf<State<Float>?> { null }

/**
 * data-zen-glow="ambient", for what never gets a pointer (a stream overlay, a kiosk): the edge
 * light inside goes slowly round each border by itself (corner to corner, 12s a lap). Wrap the
 * whole app for every surface. Still, at the top-left corner, with reduced motion.
 */
@Composable
fun AmbientGlow(content: @Composable () -> Unit) {
    val lap = if (reducedMotion()) {
        remember { mutableFloatStateOf(0f) }
    } else {
        rememberInfiniteTransition().animateFloat(0f, 1f, infiniteRepeatable(tween(12_000, easing = LinearEasing), RepeatMode.Restart))
    }
    CompositionLocalProvider(LocalAmbientGlow provides lap, content = content)
}

/** Where the ambient light is `lap` of the way round a box: along the top, down the right, back along the bottom, up the left. */
private fun orbit(lap: Float, width: Float, height: Float): Offset {
    val q = lap * 4f
    val f = q - q.toInt()
    return when (q.toInt()) {
        0 -> Offset(width * f, 0f)
        1 -> Offset(width, height * f)
        2 -> Offset(width * (1 - f), height)
        else -> Offset(0f, height * (1 - f))
    }
}

/** The edge glow's gradient: 360px circle, from the glow colour to glow-2, gone by 65%. */
internal const val GLOW_RADIUS = 360f

/**
 * glow-edge: the element's border lights up near the pointer, as if from one light over every
 * surface. Drawn over the border (as the web library's ::before is), on the sides `sides` has.
 * `cover` is a border colour painted over the light, as a field's focus or error border is.
 */
fun Modifier.glowEdge(shape: Shape, sides: Sides = Sides.All, cover: Color = Color.Transparent): Modifier =
    this then GlowEdgeElement(shape, sides, cover)

private data class GlowEdgeElement(val shape: Shape, val sides: Sides, val cover: Color) : ModifierNodeElement<GlowEdgeNode>() {
    override fun create() = GlowEdgeNode(shape, sides, cover)
    override fun update(node: GlowEdgeNode) {
        node.shape = shape
        node.sides = sides
        node.cover = cover
        node.invalidateDraw()
    }
}

private class GlowEdgeNode(var shape: Shape, var sides: Sides, var cover: Color) :
    Modifier.Node(), DrawModifierNode, GlobalPositionAwareModifierNode, CompositionLocalConsumerModifierNode {
    private var origin by mutableStateOf(Offset.Zero)

    override fun onGloballyPositioned(coordinates: LayoutCoordinates) {
        origin = coordinates.positionInRoot()
    }

    private fun ContentDrawScope.ring(): Path {
        val outline = shape.createOutline(size, layoutDirection, this)
        return Path().apply {
            op(
                outline.toPath(),
                outline.inset(sides.left.toPx(), sides.top.toPx(), sides.right.toPx(), sides.bottom.toPx()),
                PathOperation.Difference,
            )
        }
    }

    override fun ContentDrawScope.draw() {
        drawContent()
        light()
        if (cover.alpha > 0f) drawPath(ring(), cover)
    }

    private fun ContentDrawScope.light() {
        val tokens = currentValueOf(LocalTokens)
        if (tokens.glowStrength <= 0f) return
        val ambient = currentValueOf(LocalAmbientGlow)
        val center: Offset
        val lit: Float
        if (ambient != null) {
            center = orbit(ambient.value, size.width, size.height)
            lit = 1f
        } else {
            if (coarsePointer) return
            val light = currentValueOf(LocalPage).light
            lit = light.lit.value
            if (lit <= 0f) return
            center = light.at - origin
        }
        val reach = GLOW_RADIUS.dp.toPx()
        // Nothing to light this far away (the gradient is gone by 65% of its radius).
        if (center.x < -reach || center.y < -reach || center.x > size.width + reach || center.y > size.height + reach) return
        val s = tokens.glowStrength
        clipPath(ring()) {
            drawRect(
                radialGradient(
                    center,
                    reach,
                    0f to tokens.glow.color(0.7f * s),
                    0.4f to tokens.glow2.color(0.2f * s),
                    0.65f to tokens.glow2.color(0f),
                ),
                alpha = lit,
            )
        }
    }
}
