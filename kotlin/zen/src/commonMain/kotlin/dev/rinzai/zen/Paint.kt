package dev.rinzai.zen

import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.invalidateMeasurement
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.offset
import androidx.compose.runtime.Immutable
import kotlin.math.ceil
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.node.requireGraphicsContext
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.BlurEffect
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.colorspace.ColorSpaces
import androidx.compose.ui.graphics.LinearGradientShader
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.RadialGradientShader
import androidx.compose.ui.graphics.Shader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import kotlin.math.floor
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.sin
import androidx.compose.ui.graphics.drawscope.scale
import kotlin.math.sqrt

/** A CSS box-shadow, in CSS px (dp): `x y blur spread color`, or `inset …`. */
@Immutable
data class Shadow(
    val x: Float = 0f,
    val y: Float = 0f,
    val blur: Float = 0f,
    val spread: Float = 0f,
    val color: Color,
    val inset: Boolean = false,
)

/** Makes `paint` blur what it draws by a Gaussian of `sigma` px: Skia's blur mask filter, as Chrome paints box-shadow with. */
internal expect fun Paint.blur(sigma: Float)

/**
 * Draws CSS box-shadow `s` of a box outlined `outline` (its border box, or for an inset shadow its
 * padding box): the outline spread, moved and blurred, all of it, as Chrome draws one. Clip it to
 * outside the box (inside, for an inset one) yourself.
 */
internal fun DrawScope.boxShadow(outline: Outline, s: Shadow, paint: Paint) {
    val offset = Offset(s.x.dp.toPx(), s.y.dp.toPx())
    val spread = s.spread.dp.toPx()
    val sigma = s.blur.dp.toPx() / 2f
    paint.color = s.color
    paint.blur(sigma)
    val path = if (!s.inset) outline.spread(spread).apply { translate(offset) } else {
        // An inset shadow is cast by everything outside the box, spread inward.
        val reach = 3 * sigma + abs(offset.x) + abs(offset.y) + abs(spread) + 1f
        Path().apply {
            addRect(outline.bounds.inflate(reach))
            addPath(outline.spread(-spread).apply { translate(offset) })
            fillType = PathFillType.EvenOdd
        }
    }
    drawIntoCanvas { it.drawPath(path, paint) }
}

/**
 * The outline grown by `by` px (shrunk, if negative), as CSS spreads a shadow: corners grow with
 * it, a small radius growing less so a nearly square corner stays nearly square.
 */
internal fun Outline.spread(by: Float): Path = when (this) {
    is Outline.Rectangle -> Path().apply { addRect(rect.inflate(by)) }
    is Outline.Rounded -> Path().apply {
        val r = roundRect
        fun grow(radius: Float): Float = when {
            by >= 0f && radius >= by -> radius + by
            by > 0f -> radius + by * (1f + (radius / by - 1f).let { it * it * it })
            else -> max(0f, radius + by)
        }
        fun CornerRadius.grown() = if (x == 0f && y == 0f) this else CornerRadius(grow(x), grow(y))
        addRoundRect(
            RoundRect(
                r.left - by, r.top - by, r.right + by, r.bottom + by,
                r.topLeftCornerRadius.grown(), r.topRightCornerRadius.grown(),
                r.bottomRightCornerRadius.grown(), r.bottomLeftCornerRadius.grown(),
            ),
        )
    }
    is Outline.Generic -> Path().apply { addPath(path) }
}

/**
 * CSS's `outline: <width> solid <color>` with `outline-offset`: a line `offset` out from the box,
 * over its content, its corners the box's radius grown by the offset as Chrome draws them.
 */
fun Modifier.outline(shape: Shape, color: Color, width: Dp, offset: Dp = 0.dp): Modifier = drawWithContent {
    drawContent()
    val box = shape.createOutline(size, layoutDirection, this)
    val (o, w) = offset.toPx() to width.toPx()
    val ring = Path().apply { op(box.grown(o + w), box.grown(o), PathOperation.Difference) }
    drawPath(ring, color)
}

private fun Outline.grown(by: Float): Path = when (this) {
    is Outline.Rounded -> Path().apply {
        val r = roundRect
        fun CornerRadius.grown() = if (x <= 0f && y <= 0f) this else CornerRadius(max(0f, x + by), max(0f, y + by))
        addRoundRect(
            RoundRect(
                r.left - by, r.top - by, r.right + by, r.bottom + by,
                r.topLeftCornerRadius.grown(), r.topRightCornerRadius.grown(),
                r.bottomRightCornerRadius.grown(), r.bottomLeftCornerRadius.grown(),
            ),
        )
    }
    else -> spread(by)
}

/** `0 0 0 width color`: a ring outside the box. */
fun ring(color: Color, width: Float) = Shadow(spread = width, color = color)

/** `inset 0 0 0 width color`: a ring inside the box. */
fun insetRing(color: Color, width: Float) = Shadow(spread = width, color = color, inset = true)

// ── Gradients, as CSS draws them ──

/** A gradient stop: a colour at a position 0–1. */
typealias Stop = Pair<Float, Color>

/**
 * CSS interpolates gradients in premultiplied alpha, so a colour fading to `transparent` doesn't
 * darken on the way. Skia doesn't: each span between colours of different alpha is cut finely and
 * the premultiplied blend written out, so both draw the same.
 */
internal fun premultiplied(stops: List<Stop>): Pair<List<Color>, List<Float>> {
    val colors = mutableListOf<Color>()
    val at = mutableListOf<Float>()
    stops.forEachIndexed { i, (pos, color) ->
        if (i > 0) {
            val (p0, c0) = stops[i - 1]
            if (c0.alpha != color.alpha && c0 != color) {
                for (k in 1 until 8) {
                    val t = k / 8f
                    colors += premulLerp(c0, color, t)
                    at += p0 + (pos - p0) * t
                }
            }
        }
        colors += color
        at += pos
    }
    return colors to at
}

private fun premulLerp(a: Color, b: Color, t: Float): Color {
    val alpha = a.alpha + (b.alpha - a.alpha) * t
    if (alpha <= 0f) return Color(0f, 0f, 0f, 0f)
    fun ch(x: Float, y: Float) = ((x * a.alpha) + (y * b.alpha - x * a.alpha) * t) / alpha
    return Color(ch(a.red, b.red), ch(a.green, b.green), ch(a.blue, b.blue), alpha)
}

/**
 * Stops for a gradient `in oklab` (Tailwind's bg-gradient-to-*, bg-linear-to-*): Skia blends in
 * sRGB, so each span is cut finely and the premultiplied Oklab blend written out.
 */
fun inOklab(vararg stops: Stop): Array<Stop> {
    val out = mutableListOf<Stop>()
    stops.forEachIndexed { i, (pos, color) ->
        if (i > 0) {
            val (p0, c0) = stops[i - 1]
            if (c0 != color) for (k in 1 until 16) {
                val t = k / 16f
                out += p0 + (pos - p0) * t to oklabMix(c0, color, t)
            }
        }
        out += pos to color
    }
    return out.toTypedArray()
}

private fun oklabMix(a: Color, b: Color, t: Float): Color {
    val alpha = a.alpha + (b.alpha - a.alpha) * t
    if (alpha <= 0f) return Color(0f, 0f, 0f, 0f)
    val (x, y) = a.convert(ColorSpaces.Oklab) to b.convert(ColorSpaces.Oklab)
    fun ch(p: Float, q: Float) = (p * a.alpha + (q * b.alpha - p * a.alpha) * t) / alpha
    return Color(ch(x.red, y.red), ch(x.green, y.green), ch(x.blue, y.blue), alpha, ColorSpaces.Oklab).convert(ColorSpaces.Srgb)
}

/** `linear-gradient(<angle>deg, stops…)` over the box it paints, its line as long as CSS makes it. */
fun linearGradient(angle: Float, vararg stops: Stop): Brush = object : ShaderBrush() {
    override fun createShader(size: Size): Shader = linearGradientShader(angle, Rect(Offset.Zero, size), stops.toList())
}

/** A linear gradient's shader over `box` (which may reach past what's painted, as a padded box's background does). */
internal fun linearGradientShader(angle: Float, box: Rect, stops: List<Stop>): Shader {
    val rad = angle * PI.toFloat() / 180f
    val dx = sin(rad)
    val dy = -cos(rad)
    val half = (abs(box.width * dx) + abs(box.height * dy)) / 2f
    val c = box.center
    val (colors, at) = premultiplied(stops)
    return LinearGradientShader(c - Offset(dx, dy) * half, c + Offset(dx, dy) * half, colors, at)
}

/** `radial-gradient(<radius> circle at <center>, stops…)`, the centre and radius in px of the box. */
fun radialGradient(center: Offset, radius: Float, vararg stops: Stop): Brush =
    radialGradient({ center }, { radius }, *stops)

/** A radial gradient whose centre and radius depend on the size of what it paints. */
fun radialGradient(center: (Size) -> Offset, radius: (Size) -> Float, vararg stops: Stop): Brush = object : ShaderBrush() {
    override fun createShader(size: Size): Shader {
        val (colors, at) = premultiplied(stops.toList())
        return RadialGradientShader(center(size), max(radius(size), 0.01f), colors, at)
    }
}

/** `radial-gradient(ellipse at <center>, stops…)`, its ellipse reaching the farthest corner as CSS's does, over all that's drawn. */
fun DrawScope.drawEllipseGradient(center: Offset, vararg stops: Stop) {
    val rx = sqrt(2f) * max(center.x, size.width - center.x)
    val ry = sqrt(2f) * max(center.y, size.height - center.y)
    if (rx <= 0f || ry <= 0f) return
    val k = ry / rx
    scale(1f, k, pivot = center) {
        drawRect(radialGradient(center, rx, *stops), topLeft = Offset(0f, center.y - center.y / k), size = Size(size.width, size.height / k))
    }
}

/** CSS's `farthest-corner` circle radius from a centre in a box. */
fun farthestCorner(center: Offset, size: Size) =
    hypot(max(center.x, size.width - center.x), max(center.y, size.height - center.y))

/** A colour fading out: the stop CSS means by `transparent` after it (the same colour, clear). */
fun Color.clear() = copy(alpha = 0f)

/** `color-mix` in sRGB, as a transition between two colours runs. */
fun mix(a: Color, b: Color, t: Float) = lerp(a, b, t)

// ── The box: shadows, fill, border, as CSS paints them ──

/**
 * Paints a CSS box: outer shadows (outside the box only, as browsers clip them), then the fill,
 * then inset shadows, then the border (on `sides`); content goes on top. Shadows are listed as CSS lists them,
 * the first on top. As in CSS (box-sizing: border-box), the border takes room: what's inside is
 * laid out within it, and a size set before this includes it. `dashed` dashes the border (all
 * sides one width) as `border-style: dashed` does.
 */
fun Modifier.box(
    shape: Shape,
    fill: Brush? = null,
    border: Brush? = null,
    sides: Sides = Sides.All,
    shadows: List<Shadow> = emptyList(),
    dashed: Boolean = false,
): Modifier = this then BoxElement(shape, fill, border, sides, shadows, dashed) then
    (if (border != null) BorderRoomElement(sides) else Modifier)

/** The room a border takes; a node of its own, as one that measures draws at its content's size. */
private data class BorderRoomElement(val sides: Sides) : ModifierNodeElement<BorderRoomNode>() {
    override fun create() = BorderRoomNode(sides)
    override fun update(node: BorderRoomNode) {
        node.sides = sides
        node.invalidateMeasurement()
    }
}

private class BorderRoomNode(var sides: Sides) : Modifier.Node(), LayoutModifierNode {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val (l, t) = sides.left.roundToPx() to sides.top.roundToPx()
        val (x, y) = l + sides.right.roundToPx() to t + sides.bottom.roundToPx()
        val p = measurable.measure(constraints.offset(-x, -y))
        return layout(constraints.constrainWidth(p.width + x), constraints.constrainHeight(p.height + y)) { p.place(l, t) }
    }
}

private data class BoxElement(
    val shape: Shape,
    val fill: Brush?,
    val border: Brush?,
    val sides: Sides,
    val shadows: List<Shadow>,
    val dashed: Boolean,
) : ModifierNodeElement<BoxNode>() {
    override fun create() = BoxNode(shape, fill, border, sides, shadows, dashed)
    override fun update(node: BoxNode) {
        node.shape = shape
        node.fill = fill
        node.border = border
        node.sides = sides
        node.shadows = shadows
        node.dashed = dashed
    }
}

private class BoxNode(
    var shape: Shape,
    var fill: Brush?,
    var border: Brush?,
    var sides: Sides,
    var shadows: List<Shadow>,
    var dashed: Boolean,
) : Modifier.Node(), DrawModifierNode {
    private val shade = Paint()

    override fun ContentDrawScope.draw() {
        drawBox(size, shape, fill, border, sides, shadows, shade, dashed)
        drawContent()
    }
}

/** Paints a box as Modifier.box does, `size` big at the origin: for a part drawn rather than laid out (a sliding indicator). */
internal fun DrawScope.drawBox(
    size: Size,
    shape: Shape,
    fill: Brush? = null,
    border: Brush? = null,
    sides: Sides = Sides.All,
    shadows: List<Shadow> = emptyList(),
    shade: Paint = Paint(),
    dashed: Boolean = false,
) {
    val outline = shape.createOutline(size, layoutDirection, this)
    val boxPath = outline.toPath()
    // Inset shadows fall inside the border, in the padding box, as CSS paints them.
    val (l, t) = if (border != null) sides.left.toPx() to sides.top.toPx() else 0f to 0f
    val (r, b) = if (border != null) sides.right.toPx() to sides.bottom.toPx() else 0f to 0f
    val padding = Size(size.width - l - r, size.height - t - b)

    // Outer shadows: the last listed is painted first, all outside the box.
    if (shadows.any { !it.inset }) clipPath(boxPath, ClipOp.Difference) {
        for (s in shadows.asReversed()) if (!s.inset) boxShadow(outline, s, shade)
    }
    fill?.let { drawOutline(outline, it) }
    if (shadows.any { it.inset }) translate(l, t) {
        val inner = if (border != null) PaddingBox(shape, sides).createOutline(padding, layoutDirection, this) else outline
        clipPath(inner.toPath()) { for (s in shadows.asReversed()) if (s.inset) boxShadow(inner, s, shade) }
    }
    if (border != null && dashed) {
        // As Blink paints it: the border's centre line stroked whole, dashes three times its width
        // and gaps two thirds of a dash, the gap evened out to fit the perimeter.
        val w = sides.top.toPx()
        val centre = PaddingBox(shape, (w / 2).toDp().let { Sides(it, it, it, it) }).createOutline(Size(size.width - w, size.height - w), layoutDirection, this).toPath()
        centre.translate(Offset(w / 2, w / 2))
        val length = PathMeasure().apply { setPath(centre, false) }.length
        val dash = maxOf(3 * w, 3f)
        val gap = bestDashGap(length, dash, dash * (if (w >= 3) 1f else if (w >= 1) 2f / 3f else 1f / 3f))
        drawPath(centre, border, style = Stroke(w, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash, gap))))
    } else border?.let { b ->
        val ring = Path().apply { op(boxPath, outline.inset(sides.left.toPx(), sides.top.toPx(), sides.right.toPx(), sides.bottom.toPx()), PathOperation.Difference) }
        drawPath(ring, b)
    }
}

/** Blink's SelectBestDashGap: the gap, near `gap`, that fits whole dashes round a closed path `length` long. */
private fun bestDashGap(length: Float, dash: Float, gap: Float): Float {
    val fewer = floor((length + gap) / (dash + gap))
    val more = fewer + 1
    val fewerGap = (length - fewer * dash) / fewer
    val moreGap = (length - more * dash) / more
    return if (moreGap <= 0 || abs(fewerGap - gap) < abs(moreGap - gap)) fewerGap else moreGap
}

/** The padding box of a box shaped `outer` with a border on `sides`, sized as the padding box. */
private class PaddingBox(val outer: Shape, val sides: Sides) : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline = with(density) {
        val (l, t) = sides.left.toPx() to sides.top.toPx()
        val (r, b) = sides.right.toPx() to sides.bottom.toPx()
        val box = outer.createOutline(Size(size.width + l + r, size.height + t + b), layoutDirection, density)
        Outline.Generic(box.inset(l, t, r, b).apply { translate(Offset(-l, -t)) })
    }
}

/** The padding box inside a border of `w`: CSS's inner corners are the outer radius less the border. */
internal fun Outline.inset(w: Float, top: Float = w, right: Float = w, bottom: Float = w): Path = when (this) {
    is Outline.Rounded -> Path().apply {
        val r = roundRect
        fun CornerRadius.less(x: Float, y: Float) = CornerRadius(max(0f, this.x - x), max(0f, this.y - y))
        addRoundRect(
            RoundRect(
                r.left + w, r.top + top, r.right - right, r.bottom - bottom,
                r.topLeftCornerRadius.less(w, top), r.topRightCornerRadius.less(right, top),
                r.bottomRightCornerRadius.less(right, bottom), r.bottomLeftCornerRadius.less(w, bottom),
            ),
        )
    }
    is Outline.Rectangle -> Path().apply { addRect(Rect(rect.left + w, rect.top + top, rect.right - right, rect.bottom - bottom)) }
    is Outline.Generic -> path
}

internal fun Outline.toPath(): Path = when (this) {
    is Outline.Rectangle -> Path().apply { addRect(rect) }
    is Outline.Rounded -> Path().apply { addRoundRect(roundRect) }
    is Outline.Generic -> path
}

/** Draws `block` with its origin moved, as `translate()` but reading clearer at the call. */
internal inline fun DrawScope.at(offset: Offset, block: DrawScope.() -> Unit) = translate(offset.x, offset.y, block)

/**
 * CSS's `filter: drop-shadow(x y blur color)`: a shadow of what's drawn (an icon's strokes, not
 * its box), blurred, under it. Null draws it plainly.
 */
fun Modifier.filterDropShadow(shadow: Shadow?): Modifier =
    if (shadow == null) this else this then FilterDropShadowElement(shadow)

private data class FilterDropShadowElement(val shadow: Shadow) : ModifierNodeElement<FilterDropShadowNode>() {
    override fun create() = FilterDropShadowNode(shadow)
    override fun update(node: FilterDropShadowNode) {
        node.shadow = shadow
    }
}

private class FilterDropShadowNode(var shadow: Shadow) : Modifier.Node(), DrawModifierNode {
    private var drawn: GraphicsLayer? = null
    private var blurred: GraphicsLayer? = null

    override fun onDetach() {
        val context = requireGraphicsContext()
        drawn?.let(context::releaseGraphicsLayer)
        blurred?.let(context::releaseGraphicsLayer)
        drawn = null
        blurred = null
    }

    override fun ContentDrawScope.draw() {
        val context = requireGraphicsContext()
        val content = drawn ?: context.createGraphicsLayer().also { drawn = it }
        val shade = blurred ?: context.createGraphicsLayer().also { blurred = it }
        content.record { this@draw.drawContent() }
        // drop-shadow's blur is the Gaussian's sigma itself (a filter's stdDeviation), not twice it as box-shadow's is.
        val r = max(0f, (shadow.blur * density - 0.5f) / 0.57735f)
        shade.renderEffect = if (r > 0f) BlurEffect(r, r, TileMode.Decal) else null
        shade.colorFilter = ColorFilter.tint(shadow.color, BlendMode.SrcIn)
        // Room for the blur to spread past the content's bounds.
        val pad = ceil(shadow.blur * density * 3f).toInt()
        shade.topLeft = IntOffset(-pad + (shadow.x * density).toInt(), -pad + (shadow.y * density).toInt())
        shade.record(IntSize(ceil(size.width).toInt() + 2 * pad, ceil(size.height).toInt() + 2 * pad)) {
            translate(pad.toFloat(), pad.toFloat()) { drawLayer(content) }
        }
        drawLayer(shade)
        drawLayer(content)
    }
}

/** Tailwind's shadow-md. */
val ShadowMd = listOf(
    Shadow(y = 4f, blur = 6f, spread = -1f, color = Color.Black.copy(alpha = 0.1f)),
    Shadow(y = 2f, blur = 4f, spread = -2f, color = Color.Black.copy(alpha = 0.1f)),
)
