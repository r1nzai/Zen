package dev.rinzai.zen

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

private const val DURATION = 1330f
private val EASE = floatArrayOf(0.25f, 0.55f, 0.35f, 1f)
private const val CLOSE_DURATION = 1050f
private val FALL = floatArrayOf(0.55f, 0f, 0.85f, 0.35f)
private const val WOBBLE = 0.05f
private const val MAX_WOBBLE = 36f
/** The edge's wobble: lobes round the ring, how fast each turns, its share. */
private val LOBES = listOf(Triple(3f, 1.9f, 0.5f), Triple(5f, -2.7f, 0.3f), Triple(8f, 4.1f, 0.2f))
private const val POINTS = 72
private const val WAVELENGTH = 28f

/** A shader made from Skia shading-language source, its uniforms set afresh for each frame. */
internal fun interface RuntimeShader {
    fun shader(uniforms: Map<String, FloatArray>): Shader
}

/** The platform's runtime shaders (Skia's runtime effects; AGSL on Android 13+), or null where there are none. */
internal expect fun runtimeShader(source: String): RuntimeShader?

private fun Float.f() = toString().let { if ('.' in it || 'E' in it) it else "$it.0" }

/** utils/theme-wave.ts's shader, in Skia's shading language: the water's ripples, glints and soap-film sheen. */
private val SHADER = """
uniform float dpr;
uniform float2 from;
uniform float time;
uniform float seed;
uniform float strength;
uniform float dir;
uniform float edge;
uniform float prism;
uniform float3 aurora0;
uniform float3 aurora1;
uniform float3 aurora2;
uniform float light;

float wobble(float a, float r) {
    float size = min(${MAX_WOBBLE.f()}, ${WOBBLE.f()} * r);
    return size * (${LOBES.mapIndexed { i, (n, speed, share) -> "${share.f()} * sin(${n.f()} * a + ${speed.f()} * time + seed * ${(i + 1f).f()})" }.joinToString(" + ")});
}

float rippleSlope(float x) {
    float k = 6.2832 / ${WAVELENGTH.f()};
    float reach = x < 0.0 ? ${(2.5f * WAVELENGTH).f()} : ${(0.35f * WAVELENGTH).f()};
    float phase = k * x - 7.0 * time;
    return exp(-x * x / (2.0 * reach * reach)) * (-x / (reach * reach) * cos(phase) / k - sin(phase));
}

const float3 LIGHT = float3(-0.45, -0.55, 0.7);

float glint(float2 slope, float bend) {
    float3 n = normalize(float3(-slope * bend, 1.0));
    float3 mid = normalize(normalize(LIGHT) + float3(0.0, 0.0, 1.0));
    return max(0.0, pow(max(dot(n, mid), 0.0), 40.0) - pow(mid.z, 40.0));
}

half4 main(float2 fragCoord) {
    float2 v = fragCoord / dpr - from;
    float a = atan(v.y, v.x);
    float e = length(v) - edge - wobble(a, edge);
    float2 slope = 0.9 * strength * dir * rippleSlope(dir * e) * v / max(length(v), 0.001);
    float hue = fract(a / 6.2832 + 0.15 * time + length(v) * 0.0008) * 3.0;
    float3 tint = hue < 1.0 ? mix(aurora0, aurora1, hue)
        : hue < 2.0 ? mix(aurora1, aurora2, hue - 1.0)
        : mix(aurora2, aurora0, hue - 2.0);
    float film = 0.02 * e + 0.35 * sin(2.0 * a + 0.6 * time + seed) + 0.25 * sin(5.0 * a - 0.9 * time) + 0.25 * time;
    float3 sheen = mix(mix(tint, 0.5 + 0.5 * cos(6.2832 * (film + float3(0.0, 0.33, 0.67))), 0.5), float3(1.0), 0.2);
    float3 spark = float3(glint(slope, 0.8), glint(slope, 1.0), glint(slope, 1.2));
    float facing = dot(normalize(float3(-slope, 1.0)), normalize(LIGHT)) - normalize(LIGHT).z;
    float3 color = 1.6 * spark * mix(float3(1.0), mix(tint, sheen, 0.6), mix(0.4, 0.85, light)) + 0.6 * max(facing, 0.0) * tint;
    float shade = mix(0.7, 0.45, light) * max(-facing, 0.0);
    color += prism * (0.9 * sheen * exp(-e * e / 160.0) + 0.5 * exp(-e * e / 6.0));
    color += prism * 0.45 * tint * exp(-(e + 28.0 * dir) * (e + 28.0 * dir) / 1800.0);
    color = clamp(color, 0.0, 1.0);
    float cover = max(color.r, max(color.g, color.b));
    return half4(half3(color), half(cover + shade * (1.0 - cover)));
}
"""

private fun smoothstep(a: Float, b: Float, t: Float): Float {
    val x = ((t - a) / (b - a)).coerceIn(0f, 1f)
    return x * x * (3 - 2 * x)
}

private fun bezier(b: FloatArray, t: Float): Float {
    fun at(p: Float, q: Float, s: Float) = 3 * p * s * (1 - s).pow(2) + 3 * q * s * s * (1 - s) + s * s * s
    var lo = 0f
    var hi = 1f
    repeat(24) {
        val mid = (lo + hi) / 2
        if (at(b[0], b[2], mid) < t) lo = mid else hi = mid
    }
    return at(b[1], b[3], (lo + hi) / 2)
}

private fun wobble(a: Float, r: Float, t: Float, seed: Float): Float =
    min(MAX_WOBBLE, WOBBLE * r) * LOBES.withIndex().sumOf { (i, l) -> (l.third * sin(l.first * a + l.second * t + seed * (i + 1))).toDouble() }.toFloat()

/**
 * The theme switch's water (utils/theme-wave.ts): a drop falling into water at a point. Into a light
 * theme the new one spreads in a wavy ring; into a dark one the old is pulled into the point.
 * Ripples trail the edge, glinting in the theme's glow colours, its edge shimmering like a soap
 * film. The old page is a still snapshot, as a view transition takes; the water is a shader over
 * it all. With reduced motion, or no runtime shaders, the theme just changes.
 */
@Stable
internal class ThemeWave(private val scope: CoroutineScope, private val water: RuntimeShader?) {
    /** The theme is changing: transitions are off, so every colour changes at once ([data-zen-theme-applying]). */
    var applying by mutableStateOf(false)
        private set
    private var job: Job? = null
    private var capture: CompletableDeferred<Unit>? = null
    private var redraw by mutableIntStateOf(0)
    private var old by mutableStateOf<ImageBitmap?>(null)
    private var waving by mutableStateOf(false)
    private var progress by mutableFloatStateOf(0f)
    private var closing = false
    private var from = Offset.Zero
    private var radius = 0f
    private var seed = 0f
    private var aurora = emptyList<FloatArray>()
    internal var reduced = false

    private val duration get() = if (closing) CLOSE_DURATION else DURATION

    /** How far the ring's edge is from the point, t of the way through. */
    private fun reach(t: Float) = (if (closing) 1 - bezier(FALL, t) else bezier(EASE, t)) * radius

    private var layer: GraphicsLayer? = null
    private var box = Size.Zero
    private var density = 1f

    /** Where the surface is in the window, to start the water at a point given there. */
    private var origin = Offset.Zero

    /** Changes the theme to `to` with `apply`, the water spreading from `at` (in the window). */
    fun change(to: Appearance, at: Offset?, apply: () -> Unit) {
        // A wave still running is cut short.
        job?.cancel()
        old = null
        waving = false
        applying = true
        if (reduced || water == null) {
            apply()
            // The next frame recomposes in the new theme, its transitions off; they're back from the one after.
            job = scope.launch {
                withFrameNanos {}
                withFrameNanos {}
                applying = false
            }
            return
        }
        job = scope.launch {
            // Under a view transition nothing is hovered, from before the old page is captured: the
            // next frame puts the cover over the page (the pointer leaves what it was on once that's
            // laid out), and the one after draws it unhovered, which is the frame captured.
            waving = true
            withFrameNanos {}
            withFrameNanos {}
            val ask = CompletableDeferred<Unit>()
            capture = ask
            redraw++
            ask.await()
            val still = layer!!.toImageBitmap()
            apply()
            val t = to.tokens
            closing = t.background.l <= 0.5f
            val glow = t.glow
            aurora = listOf(glow, t.glow2, Oklch(glow.l, glow.c, (glow.h + 240f) % 360f)).map { it.color().let { c -> floatArrayOf(c.red, c.green, c.blue) } }
            val d = density
            from = (at?.minus(origin) ?: Offset(box.width / 2, box.height / 2)) / d
            val w = box.width / d
            val h = box.height / d
            // Past the furthest corner, however far the wobble pulls the edge in.
            radius = hypot(max(from.x, w - from.x), max(from.y, h - from.y)) + MAX_WOBBLE + 2
            seed = Random.nextFloat() * 2 * PI.toFloat()
            progress = 0f
            old = still
            var start = -1L
            while (true) {
                val now = withFrameNanos { it }
                if (start < 0) start = now
                progress = min(1f, (now - start) / 1_000_000f / duration)
                if (progress >= 1f) break
            }
            old = null
            waving = false
            applying = false
        }
    }

    /** Whether the next frame should be kept for the snapshot, and that it's been drawn. */
    internal fun takeCapture(): CompletableDeferred<Unit>? = capture?.also { capture = null }

    /** What the theme changes in: the water runs over it, inside `shape`. */
    @Composable
    fun Surface(modifier: Modifier = Modifier.fillMaxSize(), shape: Shape = RectangleShape, content: @Composable () -> Unit) {
        val layer = rememberGraphicsLayer().also { layer = it }
        val canvas = Zen.tokens.background.color()
        Box(
            modifier
                .onPlaced { origin = it.positionInWindow() }
                .drawWithContent {
                    redraw
                    box = size
                    this@ThemeWave.density = density
                    val ask = takeCapture()
                    if (ask != null) {
                        layer.record { drawRect(canvas); this@drawWithContent.drawContent() }
                        ask.complete(Unit)
                    }
                    drawContent()
                    val still = old ?: return@drawWithContent
                    val outline = shape.createOutline(size, layoutDirection, this)
                    clipPath(Path().apply { addOutline(outline) }) {
                    val p = progress
                    val d = density
                    val edge = reach(p)
                    val seconds = p * duration / 1000f
                    val ring = Path().apply {
                        for (i in 0 until POINTS) {
                            val a = i.toFloat() / POINTS * 2 * PI.toFloat()
                            val out = max(0f, edge + wobble(a, edge, seconds, seed))
                            val x = (from.x + out * cos(a)) * d
                            val y = (from.y + out * sin(a)) * d
                            if (i == 0) moveTo(x, y) else lineTo(x, y)
                        }
                        close()
                    }
                    // The old page: outside the ring as the new spreads, inside it as it closes in.
                    clipPath(ring, if (closing) ClipOp.Intersect else ClipOp.Difference) { drawImage(still) }
                    // Everything fades to nothing by the end.
                    val fade = min(1f, (1 - p) / 0.12f)
                    val strength: Float
                    val prism: Float
                    if (closing) {
                        strength = 1.6f * p * sqrt(1 - p) * fade
                        prism = min(1f, p * 4) * min(1f, edge / 24) * fade
                    } else {
                        // It comes in calm and its ripples build as more pours in, then settle as it fills.
                        strength = 1.6f * smoothstep(0.05f, 0.45f, p) * (1 - p).pow(1.5f) * fade
                        // The sheen shows once the edge is off the switch, and fades as it reaches the corners.
                        prism = min(1f, edge / 40) * (1 - p * p * p) * fade
                    }
                    val shader = water!!.shader(
                        mapOf(
                            "dpr" to floatArrayOf(d),
                            "from" to floatArrayOf(from.x, from.y),
                            "time" to floatArrayOf(seconds),
                            "seed" to floatArrayOf(seed),
                            "strength" to floatArrayOf(strength),
                            "dir" to floatArrayOf(if (closing) -1f else 1f),
                            "edge" to floatArrayOf(edge),
                            "prism" to floatArrayOf(prism),
                            "aurora0" to aurora[0],
                            "aurora1" to aurora[1],
                            "aurora2" to aurora[2],
                            "light" to floatArrayOf(if (closing) 0f else 1f),
                        ),
                    )
                    drawRect(ShaderBrush(shader))
                    }
                },
        ) {
            content()
            // The page is a picture while the wave runs, as under a view transition: nothing under the pointer is hovered or pressed.
            if (waving) Box(Modifier.matchParentSize().pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent().changes.forEach { it.consume() } } })
        }
    }
}

@Composable
internal fun rememberThemeWave(): ThemeWave {
    val scope = rememberCoroutineScope()
    val wave = remember { ThemeWave(scope, runtimeShader(SHADER)) }
    wave.reduced = reducedMotion()
    return wave
}

/** The wave of the themed area around (the page's, or a Themed one's): its change turns transitions off. */
internal val LocalThemeWave = staticCompositionLocalOf<ThemeWave> { error("Zen components must be inside ZenTheme") }

/** One area in its own theme (a panel, a preview), for a ThemeToggle to switch: see Themed. */
@Stable
class ThemeTarget internal constructor() {
    internal var wave: ThemeWave? = null
}

@Composable
fun rememberThemeTarget(): ThemeTarget = remember { ThemeTarget() }

/**
 * `content` in its own theme, whatever the page's: a panel, a preview. A ThemeToggle given it as its
 * `target` switches it with the water inside it (within `shape`), the page around it as it is.
 * It themes only: it draws no background of its own.
 */
@Composable
fun Themed(
    appearance: Appearance,
    modifier: Modifier = Modifier,
    target: ThemeTarget? = null,
    shape: Shape = RectangleShape,
    content: @Composable () -> Unit,
) {
    val wave = rememberThemeWave()
    target?.wave = wave
    CompositionLocalProvider(LocalThemeWave provides wave, LocalTokens provides appearance.tokens) {
        wave.Surface(modifier, shape) { ProvideText(color = Zen.tokens.foreground.color(), content = content) }
    }
}
