package dev.rinzai.zen.backdrop

import dev.rinzai.zen.frame
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.CanvasDrawScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.Zen
import dev.rinzai.zen.clear
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.radialGradient
import dev.rinzai.zen.drawEllipseGradient
import dev.rinzai.zen.reducedMotion
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.collectLatest
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/** The background pattern: contour lines (from an image) or a dot grid. */
enum class Pattern { Contours, Dots }

/**
 * The page background: slow aurora glows over a faint pattern (contour lines or a dot grid), with
 * a light that follows the pointer. It also lights every glow edge near the pointer. Declare it
 * once, anywhere: it's drawn behind everything, filling the window.
 *
 * `topo` is a contour-line SVG (strokes on transparent), drawn as the lines' mask, as the web
 * library's `topoSrc` is; the lines show once it's loaded. Without it, the dot grid.
 */
@Composable
fun Backdrop(topo: Contours? = null, pattern: Pattern = if (topo != null) Pattern.Contours else Pattern.Dots) {
    val page = LocalPage.current
    DriveLight()
    val lines by produceState<ContourLines?>(null, topo, pattern) {
        value = if (topo != null && pattern == Pattern.Contours) withContext(Dispatchers.Default) { ContourLines.parse(topo.load()) } else null
    }
    Portal(Zen.frame.under) { BackdropLayer(lines, pattern) }
}

/** The light trails the pointer by --glow-trail, and fades out where it is when the pointer leaves the window (400ms). */
@Composable
private fun DriveLight() {
    val page = LocalPage.current
    val light = page.light
    val tokens = Zen.tokens
    val reduced = reducedMotion()
    // Touch screens have no hovering pointer to follow.
    if (coarsePointer) return
    LaunchedEffect(light) {
        snapshotFlow { light.inside }.collectLatest { inside ->
            if (inside) light.at = light.target
            light.lit.animateTo(if (inside) 1f else 0f, tween(if (reduced) 0 else 400, easing = Ease.Css))
        }
    }
    LaunchedEffect(light, tokens.glowTrail, reduced) {
        var last = 0L
        while (true) {
            withFrameMillis { now ->
                // A frame's worth at most: after the light has been still, it starts easing, not jumping.
                val dt = min((now - last).toFloat(), 1000f / 60f)
                last = now
                if (!light.inside) return@withFrameMillis
                val trail = if (reduced) 0f else tokens.glowTrail
                val k = if (trail > 0f) 1f - exp(-dt / trail) else 1f
                val target = light.target
                val at = light.at
                val next = at + (target - at) * k
                light.at = if (abs(target.x - next.x) < 0.5f && abs(target.y - next.y) < 0.5f) target else next
            }
        }
    }
}

// The aurora's drift (theme.css @keyframes zen-aurora-a/b/c): dx, dy (vmax) and scale at each twelfth.
private val AURORA_A = floatArrayOf(0.0f, 0.0f, 1.0f, 0.1633f, 0.1088f, 1.0014f, 0.6736f, 0.449f, 1.0056f, 1.5499f, 1.0333f, 1.0129f, 2.7813f, 1.8542f, 1.0232f, 4.3059f, 2.8706f, 1.0359f, 6.0f, 4.0f, 1.05f, 7.6941f, 5.1294f, 1.0641f, 9.2187f, 6.1458f, 1.0768f, 10.4501f, 6.9667f, 1.0871f, 11.3264f, 7.551f, 1.0944f, 11.8367f, 7.8912f, 1.0986f, 12.0f, 8.0f, 1.1f)
private val AURORA_B = floatArrayOf(-0.0f, -0.0f, 1.0f, -0.1905f, -0.0816f, 0.9993f, -0.7858f, -0.3368f, 0.9972f, -1.8083f, -0.775f, 0.9935f, -3.2448f, -1.3906f, 0.9884f, -5.0236f, -2.153f, 0.9821f, -7.0f, -3.0f, 0.975f, -8.9764f, -3.847f, 0.9679f, -10.7552f, -4.6094f, 0.9616f, -12.1917f, -5.225f, 0.9565f, -13.2142f, -5.6632f, 0.9528f, -13.8095f, -5.9184f, 0.9507f, -14.0f, -6.0f, 0.95f)
private val AURORA_C = floatArrayOf(-0.0f, 0.0f, 1.0f, -0.136f, 0.0816f, 1.002f, -0.5613f, 0.3368f, 1.0084f, -1.2916f, 0.775f, 1.0194f, -2.3177f, 1.3906f, 1.0348f, -3.5883f, 2.153f, 1.0538f, -5.0f, 3.0f, 1.075f, -6.4117f, 3.847f, 1.0962f, -7.6823f, 4.6094f, 1.1152f, -8.7084f, 5.225f, 1.1306f, -9.4387f, 5.6632f, 1.1416f, -9.864f, 5.9184f, 1.148f, -10.0f, 6.0f, 1.15f)

/**
 * A light's drift at `ms` into its animation: `period` long, alternating, in steps(n) per twelfth
 * (each step 1/6s, so all three move together, about 6 times a second), between the keyframes.
 */
private fun drift(frames: FloatArray, periodS: Int, steps: Int, ms: Long): Triple<Float, Float, Float> {
    val period = periodS * 1000L
    val cycle = (ms / period) % 2
    var t = (ms % period).toFloat() / period
    if (cycle == 1L) t = 1f - t
    val seg = min(11, floor(t * 12).toInt())
    val local = floor((t * 12 - seg) * steps) / steps
    fun at(i: Int, k: Int) = frames[i * 3 + k]
    fun lerp(k: Int) = at(seg, k) + (at(seg + 1, k) - at(seg, k)) * local
    return Triple(lerp(0), lerp(1), lerp(2))
}

@Composable
private fun BackdropLayer(topo: ContourLines?, pattern: Pattern) {
    val page = LocalPage.current
    val t = Zen.tokens
    val still = coarsePointer || reducedMotion()
    val host = page.host
    var clock by remember { mutableLongStateOf(0L) }
    if (!still) {
        // From where the host window's aurora is, if framed in one.
        LaunchedEffect(host?.auroraMs) {
            val start = withFrameMillis { it } - (host?.auroraMs ?: 0L)
            while (true) {
                clock = withFrameMillis { it } - start
                delay(1000L / 6)
            }
        }
    }
    val mask = remember(topo) { MaskCache(topo) }
    val light = page.light
    val frame = Zen.frame
    Canvas(Modifier.fillMaxSize()) {
        val shift = host?.let { Offset(it.offset.x.toPx(), it.offset.y.toPx()) } ?: Offset.Zero
        inWindow(shift, host?.let { Size(it.size.width.toPx(), it.size.height.toPx()) } ?: size) {
            // The pointer, in the window drawn in.
            val at = light.at - frame.origin + shift
            drawRect(t.background.color())
            val vmax = max(size.width, size.height)
            // Aurora: three soft lights in one layer, faded as one.
            val (adx, ady, asc) = drift(AURORA_A, 38, 19, clock)
            val (bdx, bdy, bsc) = drift(AURORA_B, 46, 23, clock)
            val (cdx, cdy, csc) = drift(AURORA_C, 52, 26, clock)
            val auroraAlpha = 0.16f * t.glowStrength
            fun glowCircle(center: Offset, radius: Float, color: Color) =
                drawCircle(radialGradient(center, radius, 0f to color, 1f to color.clear()), radius, center, alpha = auroraAlpha)
            val v = vmax / 100f
            glowCircle(Offset(25 * v + adx * v, -13 * v + ady * v), 35 * v * asc, t.glow.color(0.9f))
            glowCircle(Offset(size.width - 10 * v + bdx * v, size.height + bdy * v), 35 * v * bsc, t.glow2.color(0.7f))
            glowCircle(Offset(0.4f * size.width + 22.5f * v + cdx * v, 0.3f * size.height + 22.5f * v + cdy * v), 22.5f * v * csc, t.glow.color(0.6f))

            val lit = if (coarsePointer) 0f else light.lit.value
            when (pattern) {
                Pattern.Contours -> mask.bitmap(this)?.let { lines ->
                    // Faint everywhere, in the ink colour…
                    drawImage(lines, colorFilter = ColorFilter.tint(t.tint.color(), BlendMode.SrcIn), alpha = 0.1f * t.topoStrength)
                    // …and lit up around the pointer in the glow colour.
                    if (lit > 0f) {
                        val r = 420.dp.toPx()
                        litThrough(lines, at, r, 0.6f * t.topoStrength * t.glowStrength * lit) {
                            drawCircle(
                                radialGradient(at, r, 0f to t.glow.color(0.9f), 0.45f to t.glow2.color(0.3f), 0.7f to t.glow2.color(0f)),
                                r,
                                at,
                            )
                        }
                    }
                }
                Pattern.Dots -> drawDots(this, t, clock, lit, at, still)
            }
            // Vignette, so content edges stay calm: ellipse at 50% 20%, farthest corner.
            drawEllipseGradient(Offset(size.width / 2, size.height * 0.2f), 0f to t.background.color(0f), 0.4f to t.background.color(0f), 1f to t.background.color(0.85f))
        }
    }
}

/** Draws as if over a window of `size` that this one sits in at `offset`. */
private inline fun DrawScope.inWindow(offset: Offset, size: Size, draw: DrawScope.() -> Unit) {
    val own = drawContext.size
    translate(-offset.x, -offset.y) {
        drawContext.size = size
        try { draw() } finally { drawContext.size = own }
    }
}

/** Draws `light` where `mask`'s lines are, within the light's box only, at `alpha`. */
private inline fun DrawScope.litThrough(mask: ImageBitmap, at: Offset, r: Float, alpha: Float, light: DrawScope.() -> Unit) {
    val box = Rect(at.x - r, at.y - r, at.x + r, at.y + r)
    drawContext.canvas.saveLayer(box, Paint().apply { this.alpha = alpha })
    light()
    drawImage(mask, blendMode = BlendMode.DstIn)
    drawContext.canvas.restore()
}

/** The dot grid: 1px dots every 12px, faint; the aurora shows through the same dots; near the pointer they light up. */
private fun drawDots(scope: DrawScope, t: dev.rinzai.zen.Tokens, clock: Long, lit: Float, at: Offset, still: Boolean) = with(scope) {
    val step = 12.dp.toPx()
    val dot = 1.dp.toPx()
    val dots = Path()
    var y = step / 2
    while (y < size.height) {
        var x = step / 2
        while (x < size.width) {
            dots.addOval(Rect(x - dot, y - dot, x + dot, y + dot))
            x += step
        }
        y += step
    }
    drawPath(dots, t.mutedForeground.color(0.13f), alpha = t.topoStrength)
    // Ambient: the glow colours drifting through the dots, never as bright as the pointer light.
    val vmax = max(size.width, size.height) / 100f
    val p = if (still) 0f else ((clock % 120_000L).let { if (it > 60_000L) 120_000L - it else it } / 60_000f).let { floor(it * 360) / 360 }
    val ambient = min(0.6f, 1.1f * t.topoStrength * t.glowStrength)
    drawContext.canvas.saveLayer(Rect(Offset.Zero, size), Paint().apply { alpha = ambient })
    val a = Offset(0.15f * size.width + 6 * vmax * p, 0.1f * size.height + 4 * vmax * p)
    val b = Offset(0.9f * size.width - 6 * vmax * p, 0.95f * size.height - 3 * vmax * p)
    // Seen only through the dots (the dot mask).
    clipPath(dots) {
        scale(1f, 45f / 60f, pivot = a) { drawCircle(radialGradient(a, 60 * vmax, 0f to t.glow.color(0.45f), 0.75f to t.glow.color(0f)), 60 * vmax / 0.75f, a) }
        scale(1f, 42f / 55f, pivot = b) { drawCircle(radialGradient(b, 55 * vmax, 0f to t.glow2.color(0.4f), 0.75f to t.glow2.color(0f)), 55 * vmax / 0.75f, b) }
    }
    drawContext.canvas.restore()
    if (lit > 0f) {
        val r = 110.dp.toPx()
        val box = Rect(at.x - r, at.y - r, at.x + r, at.y + r)
        drawContext.canvas.saveLayer(box, Paint().apply { alpha = min(1f, 100f * t.topoStrength * t.glowStrength) * lit })
        clipPath(dots) { drawCircle(radialGradient(at, r, 0f to t.glow.color(), 0.45f to t.glow.color(0.35f), 0.75f to t.glow.color(0f)), r, at) }
        drawContext.canvas.restore()
    }
}

/**
 * A contour-line image for Backdrop: SVG source (strokes on transparent, as the web library's
 * topoSrc), loaded when Backdrop first draws, e.g. `Contours { Res.readBytes("files/topo.svg").decodeToString() }`.
 */
class Contours(internal val load: suspend () -> String)

/** The image's paths, each with its group's stroke width and opacity, in its viewBox, fitted over the window as `cover`. */
internal class ContourLines(val width: Float, val height: Float, val strokes: List<Triple<Path, Float, Float>>) {
    companion object {
        /** Reads the paths and their groups' stroke-width and stroke-opacity from SVG source. */
        fun parse(svg: String): ContourLines {
            val box = Regex("""viewBox="([^"]+)"""").find(svg)!!.groupValues[1].split(' ').map { it.toFloat() }
            val strokes = mutableListOf<Triple<Path, Float, Float>>()
            for (group in Regex("""<g([^>]*)>([\s\S]*?)</g>""").findAll(svg)) {
                val attrs = group.groupValues[1]
                val width = Regex("""stroke-width="([\d.]+)"""").find(attrs)?.groupValues?.get(1)?.toFloat() ?: 1f
                val opacity = Regex("""stroke-opacity="([\d.]+)"""").find(attrs)?.groupValues?.get(1)?.toFloat() ?: 1f
                val path = Path()
                for (d in Regex(""" d="([^"]+)"""").findAll(group.groupValues[2])) {
                    // toPath() resets the path it is given: each one is made apart, then added.
                    path.addPath(PathParser().parsePathString(d.groupValues[1]).toPath())
                }
                strokes += Triple(path, width, opacity)
            }
            return ContourLines(box[2], box[3], strokes)
        }
    }
}

/**
 * The lines drawn once into a bitmap at the window's exact pixel size (again after a resize), as
 * the web library does: re-stroking thousands of path segments on every pointer move costs frames.
 */
private class MaskCache(private val topo: ContourLines?) {
    private var size = IntSize.Zero
    private var image: ImageBitmap? = null

    fun bitmap(scope: DrawScope): ImageBitmap? {
        val topo = topo ?: return null
        val want = IntSize(scope.size.width.toInt(), scope.size.height.toInt())
        if (want.width <= 0 || want.height <= 0) return null
        if (image == null || size != want) {
            size = want
            val bitmap = ImageBitmap(want.width, want.height)
            val s = max(want.width / topo.width, want.height / topo.height)
            CanvasDrawScope().draw(Density(scope.density), LayoutDirection.Ltr, Canvas(bitmap), Size(want.width.toFloat(), want.height.toFloat())) {
                translate((want.width - topo.width * s) / 2, (want.height - topo.height * s) / 2) {
                    scale(s, s, pivot = Offset.Zero) {
                        for ((path, width, opacity) in topo.strokes) {
                            drawPath(path, Color.White, alpha = opacity, style = Stroke(width, cap = StrokeCap.Round, join = StrokeJoin.Round))
                        }
                    }
                }
            }
            image = bitmap
        }
        return image
    }
}
