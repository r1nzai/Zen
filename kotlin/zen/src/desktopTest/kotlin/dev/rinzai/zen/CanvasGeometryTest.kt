package dev.rinzai.zen

import dev.rinzai.zen.canvas.CanvasAxis
import dev.rinzai.zen.canvas.CanvasBounds
import dev.rinzai.zen.canvas.CanvasGuide
import dev.rinzai.zen.canvas.CanvasHandle
import dev.rinzai.zen.canvas.CanvasRect
import dev.rinzai.zen.canvas.SnapOptions
import dev.rinzai.zen.canvas.boundsOf
import dev.rinzai.zen.canvas.intersects
import dev.rinzai.zen.canvas.moveRect
import dev.rinzai.zen.canvas.resizeRect
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** web/packages/canvas/geometry.test.ts, case for case. */
class CanvasGeometryTest {
    private val bounds = CanvasBounds(400.0, 120.0, 8.0)
    private val box = CanvasRect(100.0, 40.0, 80.0, 40.0)
    private fun r(x: Int, y: Int, w: Int, h: Int) = CanvasRect(x.toDouble(), y.toDouble(), w.toDouble(), h.toDouble())

    @Test
    fun movesInWholeUnits() = assertEquals(r(110, 34, 80, 40), moveRect(box, 10.4, -5.6, bounds).rect)

    @Test
    fun moveStaysOnTheSurface() {
        assertEquals(r(0, 80, 80, 40), moveRect(box, -500.0, 500.0, bounds).rect)
        assertEquals(r(320, 0, 80, 40), moveRect(box, 500.0, -500.0, bounds).rect)
    }

    @Test
    fun snapsToTheSurfaceAndOthers() {
        val snap = SnapOptions(listOf(r(250, 0, 50, 20)), threshold = 4.0)
        val near = moveRect(box, 67.0, 0.0, bounds, snap)
        assertEquals(170.0, near.rect.x)
        assertTrue(CanvasGuide(CanvasAxis.X, 250.0) in near.guides)
        val middle = moveRect(box, 0.0, 2.0, bounds, snap)
        assertEquals(40.0, middle.rect.y)
        assertTrue(CanvasGuide(CanvasAxis.Y, 60.0) in middle.guides)
    }

    @Test
    fun noSnapBeyondThreshold() {
        val m = moveRect(box, 0.0, 10.0, bounds, SnapOptions(threshold = 4.0))
        assertEquals(50.0, m.rect.y)
        assertEquals(emptyList(), m.guides)
    }

    @Test
    fun resizesOnlyDraggedEdges() {
        assertEquals(r(100, 40, 100, 50), resizeRect(box, CanvasHandle.SE, 20.0, 10.0, bounds).rect)
        assertEquals(r(80, 30, 100, 50), resizeRect(box, CanvasHandle.NW, -20.0, -10.0, bounds).rect)
        assertEquals(r(100, 40, 100, 40), resizeRect(box, CanvasHandle.E, 20.0, 99.0, bounds).rect)
    }

    @Test
    fun keepsMinimum() = assertEquals(r(172, 40, 8, 40), resizeRect(box, CanvasHandle.W, 200.0, 0.0, bounds).rect)

    @Test
    fun resizeStaysOnTheSurface() {
        assertEquals(r(100, 40, 300, 80), resizeRect(box, CanvasHandle.SE, 999.0, 999.0, bounds).rect)
        assertEquals(r(0, 0, 180, 80), resizeRect(box, CanvasHandle.NW, -999.0, -999.0, bounds).rect)
    }

    @Test
    fun keepRatio() {
        assertEquals(r(100, 40, 120, 60), resizeRect(box, CanvasHandle.SE, 40.0, 0.0, bounds, keepRatio = true).rect)
        assertEquals(r(100, 40, 100, 50), resizeRect(box, CanvasHandle.S, 0.0, 10.0, bounds, keepRatio = true).rect)
        assertEquals(r(100, 40, 160, 80), resizeRect(box, CanvasHandle.SE, 999.0, 0.0, bounds, keepRatio = true).rect)
    }

    @Test
    fun snapsDraggedEdge() {
        val m = resizeRect(box, CanvasHandle.E, 17.0, 0.0, bounds, SnapOptions(threshold = 4.0))
        assertEquals(100.0, m.rect.w)
        assertEquals(listOf(CanvasGuide(CanvasAxis.X, 200.0)), m.guides)
    }

    @Test
    fun grid() {
        assertEquals(r(104, 40, 80, 40), moveRect(box, 5.0, 3.0, bounds, SnapOptions(grid = 8.0)).rect)
        val m = moveRect(box, 18.0, 0.0, bounds, SnapOptions(grid = 8.0, threshold = 4.0))
        assertEquals(120.0, m.rect.x)
        assertTrue(CanvasGuide(CanvasAxis.X, 200.0) in m.guides)
        assertEquals(r(100, 40, 84, 48), resizeRect(box, CanvasHandle.SE, 3.0, 5.0, bounds, SnapOptions(grid = 8.0)).rect)
    }

    @Test
    fun helpers() {
        assertEquals(r(10, 40, 170, 70), boundsOf(listOf(box, r(10, 90, 20, 20))))
        assertTrue(intersects(box, r(170, 70, 50, 50)))
        assertTrue(!intersects(box, r(180, 40, 10, 10)))
    }
}
