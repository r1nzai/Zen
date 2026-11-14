package dev.rinzai.zen.chart

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.filterDropShadow
import dev.rinzai.zen.rememberSeen
import dev.rinzai.zen.seen
import dev.rinzai.zen.transition
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/** A part of a donut's whole: its key, name, value and (else the palette's) colour. */
@Immutable
data class DonutItem(val key: String, val label: String, val value: Double, val color: Color? = null)

private const val EDGE = 8f // the tooltip is kept this far inside the window, dp

/**
 * A ring of parts of a whole (e.g. spending by category), with your content in the middle (e.g.
 * the total). Segments are parted by a small gap, with rounded corners; pointing at one (or
 * focusing it) lifts it and shows its value. A part too small to show at its share is drawn as a
 * pill, the narrowest segment, taking the room from the larger parts in proportion. Best for a
 * handful of parts: past about six, use bars. Colours default to the chart palette in order.
 * `size` is its diameter; `thickness` the ring's, as a share of the radius.
 */
@Composable
fun DonutChart(
    items: List<DonutItem>,
    label: String,
    modifier: Modifier = Modifier,
    size: Dp = 200.dp,
    thickness: Float = 0.32f,
    palette: ChartPalette = ChartPalette.Chart,
    formatValue: (Double) -> String = { it.toString() },
    content: (@Composable () -> Unit)? = null,
) {
    var active by remember { mutableStateOf<Int?>(null) }
    val total = items.sumOf { max(0.0, it.value) }
    val r = size.value / 2
    val inner = r * (1 - thickness)
    val corner = min(4f, (r - inner) / 4)
    // Half the gap between segments: the same width all the way across, so the gaps have parallel
    // sides (a fixed angle would make wedges, wider at the rim).
    val halfGap = if (items.count { it.value > 0 } > 1) 1.5f else 0f
    // The corners' centres: in from the edges and the gap by the corner radius.
    val r0 = inner + corner
    val r1 = r - corner
    val inset = halfGap + corner
    // The narrowest part: its outer edge cut down to a point, drawn as a pill.
    val least = 2 * cut(inset, r1)
    val sweeps = shares(items.map { it.value }, least)
    val colors = items.mapIndexed { i, it -> it.color ?: paletteColor(palette, i, items.size) }
    val arcs = buildList {
        var angle = -PI / 2
        for (i in items.indices) {
            add(angle to angle + sweeps[i])
            angle += sweeps[i]
        }
    }
    val paths = remember(sweeps, r, inner, corner, inset) {
        arcs.map { (start, end) ->
            if (end == start) null
            else if (end - start >= PI * 2 - 1e-6) sector(inner, r)
            else segment(r0, r1, start, end, inset, corner)
        }
    }
    val seen = rememberSeen()
    var bounds by remember { mutableStateOf(Rect.Zero) }

    Box(
        modifier
            .size(size)
            .seen(seen)
            .onGloballyPositioned { bounds = it.boundsInRoot() }
            .semantics { contentDescription = label }
            .pointerInput(paths) {
                val testers = paths.map { p -> p?.let(::HitTest) }
                awaitPointerEventScope {
                    while (true) {
                        val e = awaitPointerEvent()
                        val p = e.changes.firstOrNull()?.position ?: continue
                        if (e.type == PointerEventType.Exit) {
                            active = null
                            continue
                        }
                        // In the ring's own units, centred, less the lift of the one already out.
                        val at = Offset(p.x / density - r, p.y / density - r)
                        active = testers.indices.firstOrNull { i ->
                            val t = testers[i] ?: return@firstOrNull false
                            val (a0, a1) = arcs[i]
                            val lift = if (active == i && sweeps[i] < PI * 2 - 1e-6) 4f else 0f
                            val mid = (a0 + a1) / 2
                            t.contains(Offset(at.x - (cos(mid) * lift).toFloat(), at.y - (sin(mid) * lift).toFloat()))
                        }
                    }
                }
            },
    ) {
        for (i in items.indices) {
            val path = paths[i] ?: continue
            val pct = if (total > 0) (items[i].value / total * 100).roundToInt() else 0
            val whole = sweeps[i] >= PI * 2 - 1e-6
            key(items[i].key) {
                Segment(path, colors[i], i, arcs[i], active, seen.seen, "${items[i].label}: ${formatValue(items[i].value)} ($pct%)", whole, r) {
                    active = if (it) i else if (active == i) null else active
                }
            }
        }
        if (content != null) {
            // Stacked together in the middle, however many elements are passed.
            Column(Modifier.matchParentSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center) {
                ProvideText(style = TextStyle(textAlign = TextAlign.Center)) { content() }
            }
        }
    }

    val a = active
    if (a != null) {
        val angle = (arcs[a].first + arcs[a].second) / 2
        val pct = if (total > 0) (items[a].value / total * 100).roundToInt() else 0
        DonutTooltip(bounds, r, angle) {
            ChartTooltipCard(items[a].label, listOf(ChartTooltipRow("$pct%", formatValue(items[a].value), colors[a])))
        }
    }
}

@Composable
private fun Segment(
    path: Path,
    color: Color,
    index: Int,
    arc: Pair<Double, Double>,
    active: Int?,
    seen: Boolean,
    label: String,
    whole: Boolean,
    r: Float,
    onFocus: (Boolean) -> Unit,
) {
    val mid = (arc.first + arc.second) / 2
    val lift by animateFloatAsState(if (active == index && !whole) 4f else 0f, transition(200, Ease.CssOut))
    val dim by animateFloatAsState(if (active != null && active != index) 0.55f else 1f, transition(200, Ease.Css))
    val fade = remember { Animatable(0f) }
    val spec = transition<Float>(800, Ease.CssOut, delay = index * 60)
    LaunchedEffect(seen) { if (seen) fade.animateTo(1f, spec) }
    Box(
        Modifier
            .fillMaxSize()
            .semantics {
                role = Role.Image
                contentDescription = label
            }
            .onFocusChanged { onFocus(it.isFocused) }
            .focusable()
            .graphicsLayer {
                translationX = (cos(mid) * lift).toFloat() * density
                translationY = (sin(mid) * lift).toFloat() * density
                alpha = dim * fade.value
            }
            .filterDropShadow(if (active == index) Shadow(blur = 10f, color = color) else null)
            .drawBehind {
                val d = density
                val scaled = Path().apply {
                    addPath(path, Offset(r, r))
                    transform(androidx.compose.ui.graphics.Matrix().apply { scale(d, d) })
                }
                drawPath(scaled, color)
            },
    )
}

/** The tooltip in the top layer beside the segment, on the side it faces, so it never covers the middle; kept inside the window. */
@Composable
private fun DonutTooltip(bounds: Rect, r: Float, angle: Double, content: @Composable () -> Unit) {
    val page = LocalPage.current
    Portal(page.top) {
        Layout(content, Modifier.matchParentSize()) { measurables, c ->
            val p = measurables.first().measure(Constraints(maxWidth = c.maxWidth, maxHeight = c.maxHeight))
            val d = density
            val x = bounds.left + (r + cos(angle).toFloat() * (r + 10)) * d
            val y = bounds.top + (r + sin(angle).toFloat() * (r + 10)) * d
            fun clamp(v: Float, max: Int) = max(EDGE * d, min(v, max - EDGE * d))
            val left = clamp(if (cos(angle) >= 0) x else x - p.width, c.maxWidth - p.width)
            val top = clamp(y - p.height / 2f, c.maxHeight - p.height)
            layout(c.maxWidth, c.maxHeight) { p.place(left.roundToInt(), top.roundToInt()) }
        }
    }
}

/**
 * Each part's sweep round the ring, in radians: in proportion to its value, but none with a value
 * narrower than `least`. Parts that would be are drawn at `least`, and the rest share what's left,
 * still in proportion to each other. With too many parts for each to have `least`, all are equal.
 */
private fun shares(items: List<Double>, least: Double): List<Double> {
    val full = PI * 2
    val values = items.filter { it > 0 }
    if (values.isEmpty()) return items.map { 0.0 }
    val sorted = values.sorted()
    val floor = min(least, full / values.size)
    var rest = values.sum()
    var raised = 0
    fun share(v: Double) = v / rest * (full - raised * floor)
    // Raising a part to the floor leaves less for the rest, which can put the next smallest below
    // it too: so raise them smallest first, until one clears it (the largest always would).
    while (raised < sorted.size - 1 && share(sorted[raised]) < floor) rest -= sorted[raised++]
    return items.map { if (it > 0) max(floor, share(it)) else 0.0 }
}

/** How far round from a line through the centre a point at radius `rad` is `inset` from it: at most a quarter turn. */
private fun cut(inset: Float, rad: Float): Double = if (rad > inset) asin((inset / rad).toDouble()) else PI / 2

private fun at(rad: Float, a: Double) = Offset((rad * cos(a)).toFloat(), (rad * sin(a)).toFloat())
private fun plus(p: Offset, d: Offset, k: Float) = Offset(p.x + d.x * k, p.y + d.y * k)

/** The unit normal to the line from `a` to `b`, on its left: outward, going clockwise round a shape. */
private fun normal(a: Offset, b: Offset): Offset {
    val len = hypot(b.x - a.x, b.y - a.y)
    return Offset((b.y - a.y) / len, (a.x - b.x) / len)
}

private fun deg(a: Double) = (a * 180 / PI).toFloat()

/** An arc of radius `rad` round `centre` from the path's current point to `to`, clockwise or not, the short way. */
private fun Path.arcAround(centre: Offset, rad: Float, from: Offset, to: Offset, clockwise: Boolean) {
    val a0 = atan2((from.y - centre.y).toDouble(), (from.x - centre.x).toDouble())
    val a1 = atan2((to.y - centre.y).toDouble(), (to.x - centre.x).toDouble())
    var sweep = a1 - a0
    if (clockwise) { while (sweep < 0) sweep += 2 * PI } else { while (sweep > 0) sweep -= 2 * PI }
    if (abs(sweep) < 1e-9) return
    arcTo(Rect(centre, rad), deg(a0), deg(sweep), false)
}

/**
 * A ring segment, its corners rounded by `c`: the shape whose corners' centres are at radii r0
 * and r1 and two angles (radians, clockwise from 3 o'clock), each end cut `inset` inside its
 * boundary line, parallel to it, so neighbours are parted by an even gap. An edge too short for
 * both cuts comes to a point: the narrowest segment is a pill. One outline, so a translucent colour
 * is even all over. In the ring's units, centred on 0.
 */
private fun segment(r0: Float, r1: Float, a0: Double, a1: Double, inset: Float, c: Float): Path {
    fun edge(rad: Float): Pair<Double, Double> {
        val e0 = a0 + cut(inset, rad)
        val e1 = a1 - cut(inset, rad)
        return if (e1 < e0) ((a0 + a1) / 2).let { it to it } else e0 to e1
    }
    val (o0, o1) = edge(r1)
    val (i0, i1) = edge(r0)
    val O0 = at(r1, o0)
    val O1 = at(r1, o1)
    val I1 = at(r0, i1)
    val I0 = at(r0, i0)
    val end = normal(O1, I1)
    val start = normal(I0, O0)
    return Path().apply {
        val s = at(r1 + c, o0)
        moveTo(s.x, s.y)
        // Round the outer edge, down the end, back along the inner edge and up the start.
        if (o1 != o0) arcTo(Rect(Offset.Zero, r1 + c), deg(o0), deg(o1 - o0), false)
        arcAround(O1, c, at(r1 + c, o1), plus(O1, end, c), true)
        plus(I1, end, c).let { lineTo(it.x, it.y) }
        arcAround(I1, c, plus(I1, end, c), at(r0 - c, i1), true)
        if (i0 != i1) arcTo(Rect(Offset.Zero, r0 - c), deg(i1), deg(i0 - i1), false)
        arcAround(I0, c, at(r0 - c, i0), plus(I0, start, c), true)
        plus(O0, start, c).let { lineTo(it.x, it.y) }
        arcAround(O0, c, plus(O0, start, c), s, true)
        close()
    }
}

/** The whole ring: it has no ends, so no rounding. */
private fun sector(r0: Float, r1: Float) = Path().apply {
    addOval(Rect(Offset.Zero, r1))
    addOval(Rect(Offset.Zero, r0))
    fillType = PathFillType.EvenOdd
}

/** Whether a point is inside a path: what of a speck there the path covers (Skia's path ops, exact at curves). */
private class HitTest(val path: Path) {
    fun contains(p: Offset): Boolean {
        val speck = Path().apply { addRect(Rect(p, 0.01f)) }
        return !Path().apply { op(path, speck, PathOperation.Intersect) }.isEmpty
    }
}
