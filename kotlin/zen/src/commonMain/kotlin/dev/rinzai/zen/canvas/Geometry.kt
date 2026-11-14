package dev.rinzai.zen.canvas

import androidx.compose.runtime.Immutable
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** A box on a canvas, in the design's units. */
@Immutable
data class CanvasRect(val x: Double, val y: Double, val w: Double, val h: Double)

enum class CanvasAxis { X, Y }

/** A snap line: a vertical one at x, or a horizontal one at y. */
@Immutable
data class CanvasGuide(val axis: CanvasAxis, val at: Double)

/** Which corner or edge a resize handle is on. */
enum class CanvasHandle(val north: Boolean, val east: Boolean, val south: Boolean, val west: Boolean) {
    NW(true, false, false, true), N(true, false, false, false), NE(true, true, false, false), E(false, true, false, false),
    SE(false, true, true, false), S(false, false, true, false), SW(false, false, true, true), W(false, false, false, true),
}

/** The surface's size, and the smallest width and height. */
@Immutable
data class CanvasBounds(val width: Double, val height: Double, val min: Double)

/**
 * Lining up: with `others` (besides the surface) within `threshold` units (0, no lines), else to
 * multiples of `grid`.
 */
@Immutable
data class SnapOptions(val others: List<CanvasRect> = emptyList(), val threshold: Double = 0.0, val grid: Double? = null)

/** A moved or resized rect, and the lines it snapped to. */
@Immutable
data class Snapped(val rect: CanvasRect, val guides: List<CanvasGuide>)

/** The box around several rects. */
fun boundsOf(rects: List<CanvasRect>): CanvasRect {
    val x = rects.minOf { it.x }
    val y = rects.minOf { it.y }
    return CanvasRect(x, y, rects.maxOf { it.x + it.w } - x, rects.maxOf { it.y + it.h } - y)
}

/** Whether two rects overlap. */
fun intersects(a: CanvasRect, b: CanvasRect): Boolean = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** JS's Math.round: halves go up, -2.5 to -2. */
private fun round(v: Double) = floor(v + 0.5)

/** The lines an item snaps to: the surface's edges and centre, and the other rects' edges and centres. */
private fun targets(axis: CanvasAxis, bounds: CanvasBounds, others: List<CanvasRect>): List<Double> {
    val size = if (axis == CanvasAxis.X) bounds.width else bounds.height
    val lines = mutableListOf(0.0, size / 2, size)
    for (o in others) {
        val (start, length) = if (axis == CanvasAxis.X) o.x to o.w else o.y to o.h
        lines += listOf(start, start + length / 2, start + length)
    }
    return lines
}

/** The smallest shift (within threshold) that puts one of `points` on a line, and that line. */
private fun nearest(points: List<Double>, lines: List<Double>, threshold: Double): Pair<Double, Double>? {
    var best: Pair<Double, Double>? = null
    for (p in points) for (at in lines) {
        val by = at - p
        if (abs(by) <= threshold && (best == null || abs(by) < abs(best.first))) best = by to at
    }
    return best
}

private fun toGrid(v: Double, grid: Double?) = if (grid != null && grid != 0.0) round(v / grid) * grid else v

/**
 * `start` moved by dx, dy, then snapped: an edge or its centre onto a line in reach, otherwise its
 * corner onto the grid. Kept on the surface, in whole units.
 */
fun moveRect(start: CanvasRect, dx: Double, dy: Double, bounds: CanvasBounds, snap: SnapOptions = SnapOptions()): Snapped {
    val guides = mutableListOf<CanvasGuide>()
    fun axis(a: CanvasAxis, p: Double, size: Double): Double {
        val hit = if (snap.threshold != 0.0) nearest(listOf(p, p + size / 2, p + size), targets(a, bounds, snap.others), snap.threshold) else null
        if (hit == null) return toGrid(p, snap.grid)
        guides += CanvasGuide(a, hit.second)
        return p + hit.first
    }
    val x = axis(CanvasAxis.X, start.x + dx, start.w)
    val y = axis(CanvasAxis.Y, start.y + dy, start.h)
    return Snapped(
        CanvasRect(round(min(max(0.0, x), bounds.width - start.w)), round(min(max(0.0, y), bounds.height - start.h)), start.w, start.h),
        guides,
    )
}

/**
 * `start` resized by dragging `handle` by dx, dy: its moving edges snapped to a line or the grid,
 * no smaller than the minimum, kept on the surface, in whole units. With `keepRatio`, its shape
 * stays the same (and it doesn't snap).
 */
fun resizeRect(
    start: CanvasRect,
    handle: CanvasHandle,
    dx: Double,
    dy: Double,
    bounds: CanvasBounds,
    snap: SnapOptions = SnapOptions(),
    keepRatio: Boolean = false,
): Snapped {
    val west = handle.west
    val east = handle.east
    val north = handle.north
    val south = handle.south
    val right0 = start.x + start.w
    val bottom0 = start.y + start.h
    var left = start.x + if (west) dx else 0.0
    var right = right0 + if (east) dx else 0.0
    var top = start.y + if (north) dy else 0.0
    var bottom = bottom0 + if (south) dy else 0.0
    val guides = mutableListOf<CanvasGuide>()

    if (!keepRatio) {
        fun edge(axis: CanvasAxis, at: Double): Double {
            val hit = if (snap.threshold != 0.0) nearest(listOf(at), targets(axis, bounds, snap.others), snap.threshold) else null
            if (hit == null) return toGrid(at, snap.grid)
            guides += CanvasGuide(axis, hit.second)
            return hit.second
        }
        if (west) left = edge(CanvasAxis.X, left)
        if (east) right = edge(CanvasAxis.X, right)
        if (north) top = edge(CanvasAxis.Y, top)
        if (south) bottom = edge(CanvasAxis.Y, bottom)
    }

    // The room each way from the edges that stay put.
    val maxW = if (west) right0 else bounds.width - start.x
    val maxH = if (north) bottom0 else bounds.height - start.y
    var w = min(maxW, max(bounds.min, right - left))
    var h = min(maxH, max(bounds.min, bottom - top))

    if (keepRatio) {
        val ratio = start.w / start.h
        val sideways = west || east
        val upDown = north || south
        // The edge dragged further, relative to its size, leads.
        val byWidth = sideways && (!upDown || abs(w / start.w - 1) >= abs(h / start.h - 1))
        if (byWidth) h = w / ratio else w = h * ratio
        val fit = minOf(1.0, maxW / w, maxH / h)
        val grow = maxOf(1.0, bounds.min / w, bounds.min / h)
        val k = if (fit < 1) fit else grow
        w *= k
        h *= k
    }

    w = round(w)
    h = round(h)
    return Snapped(CanvasRect(if (west) right0 - w else start.x, if (north) bottom0 - h else start.y, w, h), guides)
}
