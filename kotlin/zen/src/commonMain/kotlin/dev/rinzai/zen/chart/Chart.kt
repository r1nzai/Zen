package dev.rinzai.zen.chart

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.followed
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.Notation
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.radii
import dev.rinzai.zen.transition
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberSeen
import dev.rinzai.zen.seen
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

/** Smooth between points (a monotone curve that never overshoots them), or straight. */
enum class ChartCurve { Monotone, Linear }

/** Muted, or Negative for a line that warns (e.g. below zero). */
enum class ChartTone { Muted, Negative }

internal class Series<T>(
    val kind: ChartKind,
    val label: String,
    val color: Color,
    val dashed: Boolean,
    val curve: ChartCurve,
    val value: (T) -> Number?,
    val dim: ((T, Int) -> Boolean)?,
    val dimLabel: String?,
)

internal class Reference<X>(val y: Double?, val x: X?, val hasX: Boolean, val label: String?, val tone: ChartTone, val dashed: Boolean?)

/**
 * A chart's series and markers, in the order they're written: areas, lines and bars share one axis
 * (so scales, the crosshair, the tooltip and the legend all agree), colours defaulting to the next of
 * the palette's.
 */
class ChartScope<T, X> internal constructor() {
    private class Given<T>(val kind: ChartKind, val label: String, val color: Color?, val dashed: Boolean, val curve: ChartCurve, val value: (T) -> Number?, val dim: ((T, Int) -> Boolean)?, val dimLabel: String?)

    private val given = mutableListOf<Given<T>>()
    internal val references = mutableListOf<Reference<X>>()

    /** A line with a soft fill down to the baseline; `value` is null where there's none to draw (a gap). */
    fun area(label: String, color: Color? = null, dashed: Boolean = false, curve: ChartCurve = ChartCurve.Monotone, value: (T) -> Number?) {
        given += Given(ChartKind.Area, label, color, dashed, curve, value, null, null)
    }

    /** A 2px line. Gaps (null values) break it, so one series can be split into solid and dashed parts. */
    fun line(label: String, color: Color? = null, dashed: Boolean = false, curve: ChartCurve = ChartCurve.Monotone, value: (T) -> Number?) {
        given += Given(ChartKind.Line, label, color, dashed, curve, value, null, null)
    }

    /**
     * Bars, grouped with the other bar series, growing from the baseline. `dim` fades rows' bars (e.g.
     * months still to come); `dimLabel` says what that means, and the legend gets a faded key for it.
     */
    fun bar(label: String, color: Color? = null, dim: ((T, Int) -> Boolean)? = null, dimLabel: String? = null, value: (T) -> Number?) {
        given += Given(ChartKind.Bar, label, color, false, ChartCurve.Linear, value, dim, dimLabel)
    }

    /** A horizontal line across the plot at `y` (e.g. zero): solid unless `dashed`. */
    fun reference(y: Double, tone: ChartTone = ChartTone.Muted, dashed: Boolean = false) {
        references += Reference(y, null, false, null, tone, dashed)
    }

    /** A vertical line at the row whose x is `x` (e.g. today), with `label` beside it: dashed unless `dashed` is false. */
    fun referenceAt(x: X, label: String? = null, tone: ChartTone = ChartTone.Muted, dashed: Boolean = true) {
        references += Reference(null, x, true, label, tone, dashed)
    }

    @Composable
    internal fun series(palette: ChartPalette): List<Series<T>> = given.mapIndexed { i, g ->
        Series(g.kind, g.label, g.color ?: paletteColor(palette, i, given.size), g.dashed, g.curve, g.value, g.dim, g.dimLabel)
    }
}

private const val TOP = 12f
private const val RIGHT = 8f
private const val BOTTOM = 26f
private const val TICK = 11f

private val Draw = CubicBezierEasing(0.3f, 0.7f, 0.2f, 1f)

private fun defaultFormatY(v: Double) = formatNumber(v, "en", NumberOptions(maximumFractionDigits = 1, notation = Notation.Compact))

internal fun <T> Series<T>.at(row: T): Double? = value(row)?.toDouble()?.takeIf { it.isFinite() }

/**
 * A chart on one axis: areas, lines and bars over rows of data (e.g. months), with a recessive
 * grid, a crosshair and a tooltip listing every series at the pointer (or keyboard: focus it and
 * use the arrow keys), a legend for two or more series, and the values for screen readers. Series
 * draw in as they're first seen. Colours default to the chart palette in the order the series are
 * written; give each its own `color` for meaning (e.g. the theme's glow). `height` includes the
 * axis labels; `tooltip` draws your own card for a row (build it from ChartTooltipCard).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun <T, X> Chart(
    data: List<T>,
    x: (T) -> X,
    label: String,
    modifier: Modifier = Modifier,
    summary: String? = null,
    height: Dp = 240.dp,
    formatX: (X) -> String = { it.toString() },
    formatTooltipX: ((X) -> String)? = null,
    formatY: (Double) -> String = ::defaultFormatY,
    tooltip: (@Composable (row: T, index: Int) -> Unit)? = null,
    palette: ChartPalette = ChartPalette.Chart,
    legend: Boolean? = null,
    content: ChartScope<T, X>.() -> Unit,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val scope = ChartScope<T, X>().apply(content)
    val series = scope.series(palette)
    val refs = scope.references
    val rows = data
    val n = rows.size
    val bars = series.filter { it.kind == ChartKind.Bar }

    // Y: every value drawn, and the baseline when something is filled down to it.
    val values = series.flatMap { s -> rows.mapNotNull { s.at(it) } }.toMutableList()
    for (r in refs) r.y?.let { values += it }
    if (series.any { it.kind != ChartKind.Line }) values += 0.0
    val ticks = niceTicks(values.minOrNull() ?: 0.0, values.maxOrNull() ?: 1.0)
    val lo = ticks.first()
    val hi = ticks.last()
    val tickLabels = ticks.map(formatY)
    val left = ceil(tickLabels.maxOf { it.length } * TICK * 0.62f) + 10
    val h = height.value
    val plotH = max(0f, h - TOP - BOTTOM)
    val banded = bars.isNotEmpty() || n == 1
    fun cy(v: Double): Float = TOP + if (hi == lo) plotH / 2 else ((hi - v) / (hi - lo) * plotH).toFloat()
    val base = cy(min(max(0.0, lo), hi))
    val xLabels = rows.map { formatX(x(it)) }

    var width by remember { mutableStateOf(0f) }
    var plot by remember { mutableStateOf(androidx.compose.ui.geometry.Rect.Zero) }
    val dens = LocalDensity.current.density
    val plotW = max(0f, width - left - RIGHT)
    val step = if (n == 0) 0f else if (banded) plotW / n else plotW / (n - 1)
    fun cx0(i: Int) = left + if (banded) (i + 0.5f) * step else i * step
    val barW = if (bars.isEmpty()) 0f else max(2f, min(24f, step * 0.72f / bars.size - 2))
    fun barX(i: Int, k: Int) = cx0(i) - (bars.size * (barW + 2) - 2) / 2 + k * (barW + 2)

    var active by remember { mutableStateOf<Int?>(null) }
    var pointerY by remember { mutableStateOf<Int?>(null) }
    if (active != null && active!! >= n) active = null

    // One clock for every entrance: lines draw in (900ms), fills and dashed lines fade (800ms),
    // bars grow one after another (600ms each, 25ms apart, up to 400ms). Held until first seen.
    val seen = rememberSeen()
    val clock = remember { Animatable(0f) }
    val entrance = transition<Float>(1000, LinearEasing)
    LaunchedEffect(seen.seen) { if (seen.seen) clock.animateTo(1000f, entrance) }
    fun progress(ms: Float, delay: Float = 0f, easing: androidx.compose.animation.core.Easing): Float =
        easing.transform(((clock.value - delay) / ms).coerceIn(0f, 1f))

    // Bars beside the row under the pointer dim (200ms).
    val rowDim = (0 until n).map { i ->
        key(i) { animateFloatAsState(if (active != null && active != i) 0.7f else 1f, transition(200, Ease.Css)) }
    }

    val measurer = rememberTextMeasurer()
    val axis = LocalTextStyle.current.merge(TextStyle(fontSize = TICK.sp, color = t.mutedForeground.color()))
    val yText = remember(tickLabels, axis) { tickLabels.map { measurer.measure(it, axis.merge(TextStyles.tabular)) } }
    val xText = remember(xLabels, axis) { xLabels.map { measurer.measure(it, axis) } }
    val refText = remember(refs.map { it.label }, axis) { refs.map { r -> r.label?.let { measurer.measure(it, axis) } } }
    val glowLine = t.glow.color(0.4f)
    val band = t.tint.color(0.04f)
    val grid = t.tint.color(0.07f)
    val card = t.card.color()
    val negative = t.destructive.color(0.45f)
    val muted = t.mutedForeground.color(0.6f)

    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    val showLegend = legend ?: (series.size > 1 || series.any { it.dimLabel != null })
    val tipFormat = formatTooltipX ?: formatX

    fun indexAt(px: Float): Int? {
        if (n == 0 || step == 0f) return null
        val i = if (banded) floor((px - left) / step).toInt() else ((px - left) / step).roundToInt()
        return i.coerceIn(0, n - 1)
    }

    run {
        Column(modifier.semantics { contentDescription = label }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (showLegend) Legend(series)
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(height)
                    .seen(seen)
                    .box(Zen.radii.lg, shadows = focusRing(state.focusVisible))
                    .onFocusChanged { if (!it.isFocused) active = null }
                    .focusable(interactionSource = source)
                    .semantics {
                        contentDescription = m.readChart(label)
                        active?.let { a -> stateDescription = tipFormat(x(rows[a])) + ": " + series.mapNotNull { s -> s.at(rows[a])?.let { "${s.label} ${formatY(it)}" } }.joinToString(", ") }
                    }
                    .onKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown || n == 0) return@onKeyEvent false
                        when (e.key) {
                            Key.Escape -> { active = null; false }
                            Key.MoveHome -> { pointerY = null; active = 0; true }
                            Key.MoveEnd -> { pointerY = null; active = n - 1; true }
                            Key.DirectionRight, Key.DirectionLeft -> {
                                val next = if (e.key == Key.DirectionRight) 1 else -1
                                pointerY = null
                                active = active?.let { (it + next).coerceIn(0, n - 1) } ?: if (next > 0) 0 else n - 1
                                true
                            }
                            else -> false
                        }
                    }
                    .pointerInput(n, left, step, banded) {
                        awaitPointerEventScope {
                            while (true) {
                                val e = awaitPointerEvent()
                                val c = e.changes.firstOrNull() ?: continue
                                when {
                                    e.type == PointerEventType.Exit || (c.type != PointerType.Mouse && e.type == PointerEventType.Release) -> {
                                        active = null
                                        pointerY = null
                                    }
                                    e.type == PointerEventType.Move || e.type == PointerEventType.Enter || e.type == PointerEventType.Press -> {
                                        active = indexAt(c.position.x / density)
                                        pointerY = (c.position.y / density).roundToInt()
                                    }
                                }
                            }
                        }
                    }
                    .onSizeChanged { width = it.width / dens }
                    .onGloballyPositioned { plot = it.boundsInRoot() }
                    .drawBehind {
                        if (width == 0f) return@drawBehind
                        val d = density
                        // Behind: grid and axis labels.
                        for ((i, tk) in ticks.withIndex()) {
                            crispH(cy(tk) * d, left * d, (left + plotW) * d, grid)
                            text(yText[i], (left - 8) * d, (cy(tk) + 0.32f * TICK) * d, Anchor.End)
                        }
                        val every = if (step > 0) max(1, ceil((max(1, xLabels.maxOfOrNull { it.length } ?: 1) * TICK * 0.6f + 12) / step).toInt()) else 1
                        for (i in xLabels.indices) {
                            if (i % every != 0) continue
                            val anchor = when {
                                bars.isEmpty() && n > 1 && i == 0 -> Anchor.Start
                                bars.isEmpty() && i == n - 1 -> Anchor.End
                                else -> Anchor.Middle
                            }
                            text(xText[i], cx0(i) * d, (h - 8) * d, anchor)
                        }
                        val a = active
                        // The row under the pointer: a band behind bars, else a crosshair.
                        if (a != null) {
                            if (bars.isNotEmpty()) drawRect(band, Offset((cx0(a) - step / 2) * d, TOP * d), Size(step * d, plotH * d))
                            else drawLine(glowLine, Offset(cx0(a) * d, TOP * d), Offset(cx0(a) * d, (TOP + plotH) * d), strokeWidth = d)
                        }
                        // Bars, each growing from the baseline.
                        for ((k, s) in bars.withIndex()) for ((i, r) in rows.withIndex()) {
                            val v = s.at(r) ?: continue
                            val y = cy(v)
                            val bh = abs(base - y)
                            val neg = v < 0
                            val top = if (neg) base else y
                            val grow = progress(600f, min(i * 25f, 400f), Ease.OutSoft)
                            val alpha = (if (s.dim?.invoke(r, i) == true) 0.35f else 0.9f) * rowDim[i].value
                            val bx = barX(i, k)
                            scale(1f, grow, Offset(bx * d, (if (neg) top else top + bh) * d)) {
                                drawPath(barPath(bx * d, top * d, barW * d, bh * d, neg, d), s.color, alpha = alpha)
                            }
                        }
                        // Above the bars: areas, lines and reference markers.
                        val fade = progress(800f, easing = Ease.CssOut)
                        val drawn = progress(900f, easing = Draw)
                        for (s in series) {
                            if (s.kind == ChartKind.Bar) continue
                            val pts = rows.mapIndexed { i, r -> s.at(r)?.let { Offset(cx0(i) * d, cy(it) * d) } }
                            for (seg in segments(pts)) {
                                val line = if (s.curve == ChartCurve.Linear) linearPath(seg) else monotonePath(seg)
                                if (s.kind == ChartKind.Area) {
                                    val fill = Path().apply {
                                        addPath(line)
                                        lineTo(seg.last().x, base * d)
                                        lineTo(seg.first().x, base * d)
                                        close()
                                    }
                                    val bounds = fill.getBounds()
                                    val alpha = if (s.dashed) 0.16f else 0.32f
                                    drawPath(fill, Brush.verticalGradient(listOf(s.color.copy(alpha = s.color.alpha * alpha), s.color.copy(alpha = 0f)), bounds.top, bounds.bottom), alpha = fade)
                                }
                                val w = (if (s.kind == ChartKind.Area && !s.dashed) 2.5f else 2f) * d
                                if (s.dashed) {
                                    drawPath(line, s.color, alpha = fade, style = Stroke(w, cap = StrokeCap.Round, join = StrokeJoin.Round, pathEffect = PathEffect.dashPathEffect(floatArrayOf(5 * d, 5 * d))))
                                } else if (drawn > 0f) {
                                    // Solid lines draw themselves in; dashed ones (their dashes are the pattern) fade in.
                                    val measure = PathMeasure().apply { setPath(line, false) }
                                    val part = Path()
                                    measure.getSegment(0f, measure.length * drawn, part, true)
                                    drawPath(part, s.color, style = Stroke(w, cap = StrokeCap.Round, join = StrokeJoin.Round))
                                }
                            }
                        }
                        for ((i, r) in refs.withIndex()) {
                            val tone = if (r.tone == ChartTone.Negative) negative else muted
                            if (r.y != null) {
                                if (r.dashed == true) dashedCrispH(cy(r.y) * d, left * d, (left + plotW) * d, tone, d)
                                else crispH(cy(r.y) * d, left * d, (left + plotW) * d, tone)
                                continue
                            }
                            val at = rows.indexOfFirst { x(it) == r.x }
                            if (at < 0) continue
                            val lx = cx0(at) * d
                            drawLine(tone, Offset(lx, TOP * d), Offset(lx, (TOP + plotH) * d), strokeWidth = d, pathEffect = if (r.dashed == false) null else PathEffect.dashPathEffect(floatArrayOf(3 * d, 4 * d)))
                            val label = refText[i] ?: continue
                            // Its label sits left of the line, or right of it where the plot has no room on the left.
                            val right = cx0(at) - 6 - r.label!!.length * TICK * 0.6f < left
                            text(label, (cx0(at) + if (right) 6 else -6) * d, (TOP + 4 + 0.7f * TICK) * d, if (right) Anchor.Start else Anchor.End)
                        }
                        // Markers where the crosshair meets each line, ringed in the surface colour.
                        if (a != null) for (s in series) {
                            if (s.kind == ChartKind.Bar) continue
                            val v = s.at(rows[a]) ?: continue
                            val c = Offset(cx0(a) * d, cy(v) * d)
                            drawCircle(s.color, 4 * d, c)
                            drawCircle(card, 4 * d, c, style = Stroke(2 * d))
                        }
                    },
            ) {
                // For screen readers: a sentence on what it shows, and every row's values.
                Box(Modifier.size(0.dp).clipToBounds()) {
                    Column {
                        summary?.let { Text(it) }
                        for (r in rows) Text(tipFormat(x(r)) + ": " + series.joinToString(", ") { s -> "${s.label} ${s.at(r)?.let(formatY).orEmpty()}" })
                    }
                }
                val a = active
                if (a != null && width > 0f) {
                    val tipX = cx0(a)
                    val tipY = pointerY?.toFloat() ?: TOP
                    Tooltip(plot, tipX, tipY, width, h) {
                        if (tooltip != null) tooltip(rows[a], a)
                        else ChartTooltipCard(
                            tipFormat(x(rows[a])),
                            series.mapNotNull { s -> s.at(rows[a])?.let { ChartTooltipRow(s.label, formatY(it), s.color, s.dashed) } },
                        )
                    }
                }
            }
        }
    }
}

/**
 * The tooltip beside the crosshair, inside the chart: past the middle it's on its left, its right
 * edge 12dp from it. It follows the crosshair (75ms) and changes side at once; placed in whole
 * pixels so its text stays crisp.
 */
@Composable
private fun Tooltip(plot: androidx.compose.ui.geometry.Rect, x: Float, y: Float, width: Float, height: Float, content: @Composable () -> Unit) {
    val flip = x > width / 2
    val at by followed(Offset(x, min(max(0f, y - 20), height - 80)), 75, Ease.Css)
    // In the top layer, over the plot: its glass frosts the chart under it.
    Portal(LocalPage.current.top) {
        Layout(content, Modifier.matchParentSize()) { measurables, c ->
            val p = measurables.first().measure(Constraints())
            layout(c.maxWidth, c.maxHeight) {
                val gap = (12 * density).roundToInt()
                val x0 = plot.left.roundToInt() + (at.x * density).roundToInt()
                p.place(if (flip) x0 - gap - p.width else x0 + gap, plot.top.roundToInt() + (at.y * density).roundToInt())
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun <T> Legend(series: List<Series<T>>) {
    val t = Zen.tokens
    // After the series, a faded key for each name given to faded bars (once, however many series share it).
    val faded = series.filterIndexed { i, s -> s.dimLabel != null && series.indexOfFirst { it.dimLabel == s.dimLabel } == i }
    val m = LocalMessages.current
    ProvideText(style = TextStyles.xs, color = t.mutedForeground.color()) {
        FlowRow(
            Modifier.semantics { contentDescription = m.legend },
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            for (s in series) Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Key(s.color, s.dashed, s.kind)
                Text(s.label)
            }
            for (s in faded) Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Key(s.color, kind = ChartKind.Bar, faded = true)
                Text(s.dimLabel!!)
            }
        }
    }
}

private enum class Anchor { Start, Middle, End }

/** SVG text: `x` and the baseline `y` (px), placed by its start, middle or end. */
private fun DrawScope.text(layout: TextLayoutResult, x: Float, y: Float, anchor: Anchor) {
    val w = layout.size.width
    val left = when (anchor) {
        Anchor.Start -> x
        Anchor.Middle -> x - w / 2f
        Anchor.End -> x - w
    }
    drawText(layout, topLeft = Offset(left, y - layout.firstBaseline))
}

/** A 1px horizontal hairline at `y` (px), drawn as shape-rendering: crispEdges draws it: on whole pixels, unblended. */
private fun DrawScope.crispH(y: Float, x0: Float, x1: Float, color: Color) {
    val (top, bottom) = crispSpan(y)
    drawRect(color, Offset(x0, top), Size(x1 - x0, bottom - top))
}

private fun DrawScope.dashedCrispH(y: Float, x0: Float, x1: Float, color: Color, d: Float) {
    val (top, bottom) = crispSpan(y)
    var at = x0
    while (at < x1) {
        drawRect(color, Offset(at, top), Size(min(3 * d, x1 - at), bottom - top))
        at += 7 * d
    }
}

/** The pixel rows a 1dp stroke centred on `y` covers without anti-aliasing: those whose centres it spans. */
private fun DrawScope.crispSpan(y: Float): Pair<Float, Float> {
    val half = density / 2
    return ceil(y - half - 0.5f) to max(ceil(y - half - 0.5f) + 1, ceil(y + half - 0.5f))
}

/** Round tick values covering [min, max]: 0 / 5k / 10k, never 0 / 3,127 / 6,254. */
fun niceTicks(min: Double, max: Double, count: Int = 5): List<Double> {
    var lo0 = min
    var hi0 = max
    if (lo0 == hi0) {
        if (lo0 == 0.0) { lo0 = 0.0; hi0 = 1.0 } else { lo0 = minOf(0.0, min); hi0 = maxOf(0.0, max) }
    }
    val raw = (hi0 - lo0) / count
    val mag = 10.0.pow(floor(kotlin.math.log10(raw)))
    val err = raw / mag
    val step = mag * when {
        err >= 7.5 -> 10
        err >= 3.5 -> 5
        err >= 1.5 -> 2
        else -> 1
    }
    val lo = floor(lo0 / step).toLong()
    val hi = ceil(hi0 / step).toLong()
    return (0..(hi - lo)).map { i -> roundPrecision((lo + i) * step) }
}

/** As JS's Number(x.toPrecision(12)): drops the float error a step's multiples pick up. */
private fun roundPrecision(v: Double): Double {
    if (v == 0.0 || !v.isFinite()) return v
    val digits = 12 - 1 - floor(kotlin.math.log10(abs(v))).toInt()
    val k = 10.0.pow(digits)
    return kotlin.math.round(v * k) / k
}

/** Runs of consecutive points: a null (no value) breaks the line. */
private fun segments(pts: List<Offset?>): List<List<Offset>> {
    val out = mutableListOf<List<Offset>>()
    var run = mutableListOf<Offset>()
    for (p in pts) {
        if (p != null) run += p
        else if (run.isNotEmpty()) {
            out += run
            run = mutableListOf()
        }
    }
    if (run.isNotEmpty()) out += run
    return out
}

private fun linearPath(pts: List<Offset>) = Path().apply {
    moveTo(pts[0].x, pts[0].y)
    for (p in pts.drop(1)) lineTo(p.x, p.y)
}

/** A smooth curve through the points that never overshoots them (monotone cubic, as d3's curveMonotoneX). */
private fun monotonePath(pts: List<Offset>): Path {
    val n = pts.size
    if (n < 3) return linearPath(pts)
    val dx = (0 until n - 1).map { pts[it + 1].x - pts[it].x }
    val m = (0 until n - 1).map { (pts[it + 1].y - pts[it].y) / dx[it] }
    val t = (0 until n).map { i ->
        when {
            i == 0 -> m[0]
            i == n - 1 -> m[n - 2]
            m[i - 1] * m[i] <= 0 -> 0f
            else -> 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
        }
    }
    return Path().apply {
        moveTo(pts[0].x, pts[0].y)
        for (i in 0 until n - 1) {
            val h = dx[i] / 3
            cubicTo(pts[i].x + h, pts[i].y + t[i] * h, pts[i + 1].x - h, pts[i + 1].y - t[i + 1] * h, pts[i + 1].x, pts[i + 1].y)
        }
    }
}

/** A bar with a 4px rounded data end and a square base (px; `d` is the density). */
private fun barPath(x: Float, y: Float, w: Float, h: Float, negative: Boolean, d: Float) = Path().apply {
    val r = minOf(4 * d, w / 2, h)
    if (!negative) {
        moveTo(x, y + h)
        lineTo(x, y + r)
        quadraticTo(x, y, x + r, y)
        lineTo(x + w - r, y)
        quadraticTo(x + w, y, x + w, y + r)
        lineTo(x + w, y + h)
    } else {
        moveTo(x, y)
        lineTo(x, y + h - r)
        quadraticTo(x, y + h, x + r, y + h)
        lineTo(x + w - r, y + h)
        quadraticTo(x + w, y + h, x + w, y + h - r)
        lineTo(x + w, y)
    }
    close()
}
