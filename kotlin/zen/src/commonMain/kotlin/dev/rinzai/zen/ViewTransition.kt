package dev.rinzai.zen

import androidx.compose.animation.core.Easing
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.GraphicsContext
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalGraphicsContext
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.toIntSize
import androidx.compose.ui.unit.toSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.util.lerp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

/**
 * How a named part (Modifier.viewTransition) goes from how it was to how it is: Default as the
 * browser's own (its box moves and resizes in 250ms, the old picture fading into the new, both
 * stretched to the box's width); Morph, zen-morph: a card opening into its page, its box moving
 * and resizing in 420ms while what's in it keeps its size, clipped to the box, so text never
 * stretches; or Page, PageTransition's: the old page fading out as it lifts, the new one rising in.
 */
enum class ViewTransitionStyle(internal val ms: Int, internal val easing: Easing, internal val total: Int = ms) {
    Default(250, Ease.Css),
    Morph(420, Ease.OutSoft),
    Page(340, Ease.OutSoft, total = 400),
}

/** One element with a name: its picture, where it is in the window. A name's parts (a table row's cells) are one. */
internal class TransitionPart(val name: String, val style: ViewTransitionStyle, val layer: GraphicsLayer) {
    var bounds = Rect.Zero
}

/** A name's picture at a moment: its parts drawn together, where they were. */
private class Shot(val name: String, val style: ViewTransitionStyle, val rect: Rect, val image: ImageBitmap?)

/**
 * The page's view transitions, as the web's document.startViewTransition: see start. Get it with
 * Zen.viewTransition.
 */
@Stable
class ViewTransition internal constructor() {
    internal var scope: CoroutineScope? = null
    internal var graphics: GraphicsContext? = null
    internal var reduced = false
    internal var shape: androidx.compose.ui.graphics.Shape = androidx.compose.ui.graphics.RectangleShape
    internal val parts = mutableListOf<TransitionPart>()
    internal var density: androidx.compose.ui.unit.Density = androidx.compose.ui.unit.Density(1f)
    internal var direction = androidx.compose.ui.unit.LayoutDirection.Ltr
    internal var origin = Offset.Zero

    /** The names going from old to new while one runs: their parts aren't drawn in place (the transition draws them). */
    internal var moving by mutableStateOf<Set<String>>(emptySet())
    private var old: Map<String, Shot> = emptyMap()
    private var elapsed by mutableFloatStateOf(0f)
    private var job: Job? = null

    /**
     * Makes `change` with a transition: each name (Modifier.viewTransition) there both before and
     * after goes from where it was to where it is, as its style says, the old picture into the new.
     * The rest of the page is the new one at once, as React's ViewTransition has it. With reduced
     * motion, the change is just made.
     */
    fun start(change: () -> Unit) {
        val scope = scope
        if (reduced || scope == null || job?.isActive == true) {
            job?.cancel()
            finish()
            change()
            return
        }
        job = scope.launch {
            old = shots().associateBy { it.name }
            elapsed = 0f
            // Hidden in place from the frame that shows the change (a name gone after it is just gone).
            moving = old.keys
            change()
            val longest = old.values.maxOfOrNull { it.style.total } ?: 0
            var start = -1L
            while (elapsed < longest) {
                val now = withFrameNanos { it }
                if (start < 0) start = now
                elapsed = (now - start) / 1_000_000f
            }
            finish()
        }
    }

    private fun finish() {
        moving = emptySet()
        old = emptyMap()
        elapsed = 0f
    }

    private fun groups(): Map<String, List<TransitionPart>> = parts.groupBy { it.name }

    private fun rectOf(ps: List<TransitionPart>) = ps.map { it.bounds }.reduce { a, b -> Rect(min(a.left, b.left), min(a.top, b.top), max(a.right, b.right), max(a.bottom, b.bottom)) }

    /** Each name's parts drawn as one picture, where they are. */
    private suspend fun shots(): List<Shot> = groups().map { (name, ps) ->
        val rect = rectOf(ps)
        val graphics = graphics
        val image = if (graphics == null || rect.isEmpty) null else {
            val layer = graphics.createGraphicsLayer()
            try {
                layer.record(density, direction, IntSize(ceil(rect.width).toInt(), ceil(rect.height).toInt())) {
                    for (p in ps) translate(p.bounds.left - rect.left, p.bounds.top - rect.top) { drawLayer(p.layer) }
                }
                layer.toImageBitmap()
            } finally {
                graphics.releaseGraphicsLayer(layer)
            }
        }
        Shot(name, ps.first().style, rect, image)
    }

    /** The moving names over the page, each `elapsed` into its style's time. */
    internal fun DrawScope.drawTransition() {
        val now = groups()
        for (name in moving) {
            val was = old[name] ?: continue
            val ps = now[name] ?: continue
            val style = was.style
            val t = style.easing.transform(min(1f, elapsed / style.ms))
            val to = rectOf(ps)
            val box = Rect(lerp(was.rect.left, to.left, t), lerp(was.rect.top, to.top, t), lerp(was.rect.right, to.right, t), lerp(was.rect.bottom, to.bottom, t)).translate(-origin)
            fun pair() {
                // The old picture fading out, the new (live) fading in over it, added as plus-lighter adds them.
                fun pic(size: Size, draw: DrawScope.() -> Unit) {
                    if (style == ViewTransitionStyle.Morph) draw()
                    // Stretched to the box's width, as tall as that makes it.
                    else if (size.width > 0f) scale(box.width / size.width, box.width / size.width, Offset.Zero, draw)
                }
                // How far each picture is in, and how far it's lifted: a page's go their own ways (zen-page-out, zen-page-in).
                val (out, outY) = if (style == ViewTransitionStyle.Page) Ease.CssIn.transform(min(1f, elapsed / 160f)).let { it to -6.dp.toPx() * it } else t to 0f
                val (into, intoY) = if (style == ViewTransitionStyle.Page) style.easing.transform(((elapsed - 60f) / style.ms).coerceIn(0f, 1f)).let { it to 12.dp.toPx() * (1f - it) } else t to 0f
                // A page's own animations replace the browser's, plus-lighter mixing with them: its pictures just overlap.
                val mix = if (style == ViewTransitionStyle.Page) BlendMode.SrcOver else BlendMode.Plus
                if (was.image != null) translate(0f, outY) { pic(was.rect.size) { drawImage(was.image, alpha = 1f - out, blendMode = mix) } }
                translate(0f, intoY) {
                    pic(to.size) {
                        drawContext.canvas.saveLayer(Rect(-box.left, -box.top - intoY, size.width - box.left, size.height - box.top - intoY), androidx.compose.ui.graphics.Paint().apply { alpha = into; blendMode = mix })
                        for (p in ps) translate(p.bounds.left - to.left, p.bounds.top - to.top) { drawLayer(p.layer) }
                        drawContext.canvas.restore()
                    }
                }
            }
            // Layers as big as the page: a picture's shadows, and a page rising in, reach past its box.
            val page = Rect(-box.left, -box.top, size.width - box.left, size.height - box.top)
            translate(box.left, box.top) {
                // The pair is added up on its own, then laid over the page, as the image pair isolates it.
                fun isolated() = drawContext.canvas.run {
                    saveLayer(page, androidx.compose.ui.graphics.Paint())
                    pair()
                    restore()
                }
                if (style == ViewTransitionStyle.Morph) {
                    val outline = shape.createOutline(box.size, layoutDirection, this)
                    clipPath(Path().apply { addOutline(outline) }) { isolated() }
                } else isolated()
            }
        }
    }
}

private fun Rect.translate(by: Offset) = Rect(left + by.x, top + by.y, right + by.x, bottom + by.y)

/** The page's view transitions: `Zen.viewTransition.start { … }`. */
val Zen.viewTransition: ViewTransition @Composable get() = LocalPage.current.transition

/**
 * Names this for view transitions (ViewTransition.start): the element with this name before the
 * change goes to the one with it after, as `style` says. Every part with one name is one element
 * (a table row's cells, as TableRow's viewTransition names them).
 */
@Composable
fun Modifier.viewTransition(name: String, style: ViewTransitionStyle = ViewTransitionStyle.Default): Modifier {
    val transition = Zen.viewTransition
    val layer = rememberGraphicsLayer()
    val part = remember(transition, name, style, layer) { TransitionPart(name, style, layer) }
    DisposableEffect(part) {
        transition.parts += part
        onDispose { transition.parts -= part }
    }
    return onGloballyPositioned { part.bounds = Rect(it.positionInRoot(), it.size.toSize()) }
        .drawWithContent {
            layer.record(size.toIntSize()) { this@drawWithContent.drawContent() }
            if (name !in transition.moving) drawLayer(layer)
        }
}

/** What a view transition runs over: the page, its moving names drawn over it as it runs. */
@Composable
internal fun ViewTransition.Host(content: @Composable () -> Unit) {
    scope = rememberCoroutineScope()
    graphics = LocalGraphicsContext.current
    reduced = reducedMotion()
    shape = Zen.radii.xl
    Box(
        Modifier
            .fillMaxSize()
            .onGloballyPositioned { origin = it.positionInRoot() }
            .drawWithContent {
                this@Host.density = androidx.compose.ui.unit.Density(density, fontScale)
                direction = layoutDirection
                drawContent()
                if (moving.isNotEmpty()) drawTransition()
            },
    ) {
        content()
        // While one runs, nothing under the pointer takes it.
        if (moving.isNotEmpty()) Box(Modifier.matchParentSize().pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent().changes.forEach { it.consume() } } })
    }
}
