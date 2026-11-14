package dev.rinzai.zen

import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import kotlin.math.max
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.node.invalidateMeasurement
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.InlineTextContent
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.roundToInt
import androidx.compose.ui.platform.LocalFontFamilyResolver
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.layout.layout
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.unit.TextUnit
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.resources.Res
import dev.rinzai.zen.resources.geist
import org.jetbrains.compose.resources.Font

/** CSS's `color`, inherited: what text and icons are drawn in (currentColor). */
val LocalContentColor = compositionLocalOf { Color.Unspecified }

/** The text style inherited here: font, size, weight, line height, letter spacing. */
val LocalTextStyle = compositionLocalOf { TextStyle.Default }

/** CSS's `text-transform`, inherited as it is: how Text sets its letters' case. */
enum class TextTransform { None, Uppercase, Lowercase }

val LocalTextTransform = compositionLocalOf { TextTransform.None }

/**
 * Geist, the face Zen is set in (base.css): the variable font the web loads, unhinted, so glyphs
 * advance by the same fractions of a pixel and text is as wide as in a browser.
 */
val Geist: FontFamily
    @Composable get() = FontFamily(
        Font(Res.font.geist, FontWeight.Normal),
        Font(Res.font.geist, FontWeight.Medium),
        Font(Res.font.geist, FontWeight.SemiBold),
        Font(Res.font.geist, FontWeight.Bold),
    )

/** A line box as CSS lays one out: the leading split evenly above and below, nothing trimmed. */
private val CssLine = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)

private fun size(size: Float, line: Float) = TextStyle(fontSize = size.sp, lineHeight = line.sp, lineHeightStyle = CssLine)

/** Tailwind's type scale (font size / line height), and the text utilities Zen's styles use. */
object TextStyles {
    val base = size(16f, 24f).copy(lineHeightStyle = CssLine)
    // text-2xs has no line height of its own: the inherited 1.5 applies.
    val xs2 = TextStyle(fontSize = 10.88.sp, lineHeight = 1.5.em, lineHeightStyle = CssLine)
    val xs = size(12f, 16f)
    val sm = size(14f, 20f)
    val md = size(16f, 24f)
    val lg = size(18f, 28f)
    val xl = size(20f, 28f)
    val xl2 = size(24f, 32f)
    val xl3 = size(30f, 36f)
    val xl4 = size(36f, 40f)
    val xl5 = size(48f, 48f)

    val medium = TextStyle(fontWeight = FontWeight.Medium)
    val semibold = TextStyle(fontWeight = FontWeight.SemiBold)
    val bold = TextStyle(fontWeight = FontWeight.Bold)

    /** tracking-tight, and every h1–h4 (base.css). */
    val tight = TextStyle(letterSpacing = (-0.025).em)

    /** tracking-wide. */
    val wide = TextStyle(letterSpacing = 0.025.em)

    /** tabular-nums: figures all one width, so numbers don't shift as they change. */
    val tabular = TextStyle(fontFeatureSettings = "tnum")

    /** font-mono: the platform's monospace face, for code and hex. */
    val mono: TextStyle get() = TextStyle(fontFamily = monospace)
}

/** Sets the colour and merges a style for the text inside, as CSS's inherited properties do. */
@Composable
fun ProvideText(
    color: Color = Color.Unspecified,
    style: TextStyle? = null,
    transform: TextTransform? = null,
    content: @Composable () -> Unit,
) {
    val merged = style?.let { LocalTextStyle.current.merge(it) } ?: LocalTextStyle.current
    val baseStyle = if (LocalTextStyle.current.fontFamily == null) merged.copy(fontFamily = Geist, platformStyle = platformText) else merged
    CompositionLocalProvider(
        LocalTextStyle provides baseStyle,
        LocalContentColor provides if (color.isSpecified()) color else LocalContentColor.current,
        LocalTextTransform provides (transform ?: LocalTextTransform.current),
        content = content,
    )
}

private fun Color.isSpecified() = this != Color.Unspecified

/** The page's own text (body's), whatever is inherited here: for what's portaled to the body. */
@Composable
fun BodyText(content: @Composable () -> Unit) {
    CompositionLocalProvider(
        LocalTextStyle provides TextStyle.Default,
        LocalTextTransform provides TextTransform.None,
    ) { ProvideText(color = Zen.tokens.foreground.color(), style = TextStyles.base, content = content) }
}

/**
 * Text in the inherited style and colour, as an element's text is: `style` merges over what's
 * inherited (TextStyles.sm + TextStyles.medium for `text-sm font-medium`). `inline`, for one line:
 * `modifier`'s box is the font's content area, as an inline element's is (its focus ring, hover
 * and the popup it anchors), the leading of the line it fills outside it. `inlineContent` draws
 * the text's appendInlineContent placeholders, for an element in the run of text (a Kbd).
 */
@Composable
fun Text(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle? = null,
    color: Color = Color.Unspecified,
    brush: Brush? = null,
    align: TextAlign? = null,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip,
    softWrap: Boolean = true,
    onTextLayout: ((TextLayoutResult) -> Unit)? = null,
    inline: Boolean = false,
) = Text(
    AnnotatedString(
        when (LocalTextTransform.current) {
            TextTransform.None -> text
            TextTransform.Uppercase -> text.uppercase()
            TextTransform.Lowercase -> text.lowercase()
        },
    ),
    modifier, style, color, brush, align, maxLines, overflow, softWrap, onTextLayout, inline,
)

@Composable
fun Text(
    text: AnnotatedString,
    modifier: Modifier = Modifier,
    style: TextStyle? = null,
    color: Color = Color.Unspecified,
    brush: Brush? = null,
    align: TextAlign? = null,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip,
    softWrap: Boolean = true,
    onTextLayout: ((TextLayoutResult) -> Unit)? = null,
    inline: Boolean = false,
    inlineContent: Map<String, InlineTextContent> = emptyMap(),
) {
    var resolved = LocalTextStyle.current.merge(style)
    resolved = when {
        // Painted over the text's box below, as background-clip: text is: opaque ink to clip it to.
        brush != null -> resolved.copy(color = Color.Black)
        color.isSpecified() -> resolved.copy(color = color)
        resolved.color.isSpecified() -> resolved
        else -> resolved.copy(color = LocalContentColor.current)
    }
    if (align != null) resolved = resolved.copy(textAlign = align)
    val laidOut = remember { arrayOfNulls<TextLayoutResult>(1) }
    val extent = if (resolved.lineHeight == TextUnit.Unspecified) null else fontExtent(resolved)
    // Top-aligned, the first baseline is drawn at the font's ascent, rounded; cssLineBox adds the leading.
    if (extent != null) resolved = resolved.copy(lineHeightStyle = TopLine)
    // text-wrap: balance, as Chrome does it everywhere: plain greedy lines, at the narrowest width that needs no more of them.
    val balance = resolved.lineBreak == LineBreak.Heading && softWrap
    if (balance) resolved = resolved.copy(lineBreak = LineBreak.Simple)
    val lines = (if (brush != null) Modifier.clipBrush(brush) else Modifier).then(if (balance) BalanceElement(resolved.textAlign) else Modifier)
    BasicText(
        text,
        if (inline && extent != null) {
            Modifier.cssLineBox(resolved, laidOut, extent, LinePart.Leading)
                .then(modifier)
                .cssLineBox(resolved, laidOut, extent, LinePart.Content)
                .then(lines)
        } else modifier.cssLineBox(resolved, laidOut, extent, LinePart.Whole).then(lines),
        style = resolved,
        maxLines = maxLines,
        overflow = overflow,
        softWrap = softWrap,
        inlineContent = inlineContent,
        onTextLayout = {
            laidOut[0] = it
            onTextLayout?.invoke(it)
        },
    )
}

/** The brush over the whole box, kept where the glyphs are: its gradient spans the box, however narrow the lines. */
private fun Modifier.clipBrush(brush: Brush) = graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
    .drawWithContent {
        drawContent()
        drawRect(brush, blendMode = BlendMode.SrcIn)
    }

/**
 * Balanced lines: the text laid out at the narrowest width that takes no more lines than the room
 * it has (found by halving, as Blink does, for up to six lines), set in that room by its alignment.
 */
private class BalanceElement(val align: TextAlign) : ModifierNodeElement<BalanceNode>() {
    override fun create() = BalanceNode(align)
    override fun update(node: BalanceNode) {
        node.align = align
        node.invalidateMeasurement()
    }
    override fun equals(other: Any?) = other is BalanceElement && other.align == align
    override fun hashCode() = align.hashCode()
}

private class BalanceNode(var align: TextAlign) : Modifier.Node(), LayoutModifierNode {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        if (!constraints.hasBoundedWidth) return measurable.measure(constraints).let { p -> layout(p.width, p.height) { p.place(0, 0) } }
        val room = minOf(constraints.maxWidth, measurable.maxIntrinsicWidth(Constraints.Infinity))
        val line = measurable.minIntrinsicHeight(Constraints.Infinity).coerceAtLeast(1)
        fun lines(width: Int) = (measurable.minIntrinsicHeight(width).toFloat() / line).roundToInt()
        val count = lines(room)
        var width = room
        if (count in 2..6) {
            var low = room / count
            var high = room
            while (low < high) {
                val mid = (low + high) / 2
                if (lines(mid) <= count) high = mid else low = mid + 1
            }
            width = high
        }
        val p = measurable.measure(constraints.copy(minWidth = 0, maxWidth = width))
        val w = maxOf(constraints.minWidth, room)
        return layout(w, p.height) {
            val start = when (align) {
                TextAlign.Center -> (w - p.width) / 2
                TextAlign.End, TextAlign.Right -> w - p.width
                else -> 0
            }
            if (align == TextAlign.Right || align == TextAlign.Left) p.place(if (align == TextAlign.Right) w - p.width else 0, 0)
            else p.placeRelative(start, 0)
        }
    }
}

private val TopLine = LineHeightStyle(LineHeightStyle.Alignment.Top, LineHeightStyle.Trim.None)

/** The font's ascent and descent at a style's size, in px, as its natural line gives them. */
internal class Extent(val ascent: Float, val descent: Float)

/** Geist's x-height (OS/2 sxHeight), in ems. */
private const val X_HEIGHT = 0.53f

/**
 * CSS's `vertical-align: middle` for an inline box (an inline-flex button in a heading) in the
 * text's line: its middle half the x-height over the baseline, the line box grown to hold it.
 */
@Composable
internal fun Modifier.alignMiddle(): Modifier {
    val style = LocalTextStyle.current
    val extent = fontExtent(style)
    return layout { m, c ->
        val p = m.measure(c.copy(minHeight = 0))
        val size = style.fontSize.toPx()
        val line = if (style.lineHeight.isEm) style.lineHeight.value * size else style.lineHeight.toPx()
        val ascent = extent.ascent.roundToInt()
        val descent = extent.descent.roundToInt()
        // The strut: the line's own text, its leading split around it.
        val over = floor((line - (ascent + descent)) / 2f) + ascent
        val under = line - over
        // Chrome holds the offset in 1/64ths of a pixel.
        val x = (size * X_HEIGHT / 2f * 64f).roundToInt() / 64f
        val half = p.height / 2f
        val baseline = max(over, x + half)
        layout(p.width, (baseline + max(under, half - x)).roundToInt()) { p.place(0, (baseline - x - half).roundToInt()) }
    }
}

@Composable
internal fun fontExtent(style: TextStyle): Extent {
    val resolver = LocalFontFamilyResolver.current
    val density = LocalDensity.current
    return remember(style.fontFamily, style.fontWeight, style.fontStyle, style.fontSize, resolver, density) {
        val measurer = TextMeasurer(resolver, density, LayoutDirection.Ltr, 0)
        val natural = style.copy(lineHeight = TextUnit.Unspecified, lineHeightStyle = null)
        val ascent = measurer.measure("", natural).firstBaseline
        // Skia rounds each natural line's height, moving both its baselines alike: from the first
        // of two lines to the second is that rounded height, the second's ascent past it the descent.
        val two = measurer.measure("\n", natural)
        Extent(ascent, two.getLineBaseline(1) - 2 * two.firstBaseline)
    }
}

/**
 * Holds the text to CSS's line boxes, as Chrome lays them out: each line exactly its line height,
 * the font's ascent and descent each rounded to a pixel and the leading split around them, the
 * half above floored. So the baseline lands on the same pixel row a browser puts it on. A box that
 * hugs its text is the text's exact width with its edge snapped to the nearest pixel, as a
 * browser paints it, where Compose rounds the width up.
 */
private fun Modifier.cssLineBox(style: TextStyle, laidOut: Array<TextLayoutResult?>, extent: Extent?, part: LinePart): Modifier =
    this then CssLineBoxElement(style, laidOut, extent, part)

/** The whole line box; or, for inline text, its content area and the leading around that. */
private enum class LinePart { Whole, Content, Leading }

private class CssLineBoxElement(
    val style: TextStyle,
    val laidOut: Array<TextLayoutResult?>,
    val extent: Extent?,
    val part: LinePart,
) : ModifierNodeElement<CssLineBoxNode>() {
    override fun create() = CssLineBoxNode(style, laidOut, extent, part)
    override fun update(node: CssLineBoxNode) {
        node.style = style
        node.laidOut = laidOut
        node.extent = extent
        node.part = part
        node.invalidateMeasurement()
    }
    override fun equals(other: Any?) =
        other is CssLineBoxElement && other.style == style && other.laidOut === laidOut && other.extent === extent && other.part == part
    override fun hashCode() = ((style.hashCode() * 31 + laidOut.hashCode()) * 31 + extent.hashCode()) * 31 + part.hashCode()
}

private class CssLineBoxNode(
    var style: TextStyle,
    var laidOut: Array<TextLayoutResult?>,
    var extent: Extent?,
    var part: LinePart,
) : Modifier.Node(), LayoutModifierNode {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val p = measurable.measure(if (part == LinePart.Leading) constraints.copy(minHeight = 0) else constraints)
        if (part == LinePart.Leading) {
            val extent = extent!!
            val line = lineHeight()
            val above = floor((line - (extent.ascent.roundToInt() + extent.descent.roundToInt())) / 2f).toInt()
            val want = line.roundToInt().coerceIn(constraints.minHeight, constraints.maxHeight)
            return layout(p.width, want) { p.place(0, above) }
        }
        val result = laidOut[0]
        val exact = result?.let { r -> (0 until r.lineCount).maxOfOrNull { r.getLineRight(it) - r.getLineLeft(it) } }
        val width = if (exact != null && p.width == ceil(exact).toInt()) exact.roundToInt().coerceIn(constraints.minWidth, constraints.maxWidth) else p.width
        val extent = extent ?: return layout(width, p.height) { p.place(0, 0) }
        val lines = result?.lineCount ?: 0
        val line = lineHeight()
        val ascent = extent.ascent.roundToInt()
        val area = ascent + extent.descent.roundToInt()
        if (part == LinePart.Content) return layout(width, if (lines == 0) p.height else area) { p.place(0, 0) }
        val above = floor((line - area) / 2f).toInt()
        val want = if (lines == 0) p.height else (line * lines).roundToInt().coerceIn(constraints.minHeight, constraints.maxHeight)
        return layout(width, want) { p.place(0, if (lines == 0) 0 else above) }
    }

    private fun MeasureScope.lineHeight(): Float {
        val lineHeight = style.lineHeight
        return if (lineHeight.isEm) lineHeight.value * style.fontSize.toPx() else lineHeight.toPx()
    }

    // The room the text needs, whole pixels rounded up: a box sized to fit it (the box drawn is
    // snapped to the nearest pixel) never gives it less than its glyphs take, so it doesn't wrap.
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) =
        measurable.maxIntrinsicWidth(height)

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) =
        measurable.minIntrinsicWidth(height)
}

/**
 * text-aurora: gradient headline text, near-white (the ink colour in the light theme) into the
 * accent by 85%, across the text's box. The box reaches 0.2em past the lines above and below, as
 * the web utility's does, so the gradient falls on the glyphs the same.
 */
@Composable
fun textAurora(fontSize: TextUnit): Brush {
    val t = Zen.tokens
    val from = if (Zen.page.appearance == Appearance.Light) t.foreground.color() else Oklch(0.98f, 0f, 0f).color()
    val to = t.primary.color()
    val reach = with(LocalDensity.current) { fontSize.toPx() } * 0.2f
    return remember(from, to, reach) {
        object : ShaderBrush() {
            override fun createShader(size: Size) =
                linearGradientShader(100f, Rect(0f, -reach, size.width, size.height + reach), listOf(0f to from, 0.85f to to))
        }
    }
}

/** text-glow: the accent's glow behind the text (text-shadow: 0 0 18px glow). */
@Composable
fun textGlow(): TextStyle {
    val t = Zen.tokens
    return TextStyle(shadow = androidx.compose.ui.graphics.Shadow(t.glow.color(0.55f * t.glowStrength), blurRadius = cssTextBlur(18f)))
}

// CSS's blur length is twice the Gaussian's sigma; Compose takes a radius it turns into sigma as 0.57735 r + 0.5.
internal fun cssTextBlur(blur: Float) = ((blur / 2f - 0.5f) / 0.57735f).coerceAtLeast(0f)
