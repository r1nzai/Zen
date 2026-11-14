package dev.rinzai.zen.slider

import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.geometry.RoundRect
import dev.rinzai.zen.boxShadow
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.ring
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.roundToInt

/** md: a 10px track and 20px thumb; sm: a thin track and small thumb, for a compact control such as a volume slider. */
enum class SliderSize(internal val track: Float, internal val thumb: Float, internal val border: Float) {
    Md(10f, 20f, 2f),
    Sm(4f, 12f, 1.5f),
}

/**
 * A range slider: a rounded track, filled up to the value in the accent (or drawn with your own
 * `track`, e.g. a hue gradient), and a glowing thumb. It works as the browser's range input does:
 * press the track and the thumb jumps there, drag on; the arrow keys step (Page Up/Down a tenth,
 * Home and End to the ends). `step` null is CSS's "any": no snapping. `onValueChange` runs while
 * dragging, `onValueCommit` once the user lets go (and for each key). 20dp tall at both sizes, as
 * the area to grab; full width unless the modifier sets one.
 */
@Composable
fun Slider(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    min: Float = 0f,
    max: Float = 100f,
    step: Float? = 1f,
    onValueCommit: ((Float) -> Unit)? = null,
    enabled: Boolean = true,
    size: SliderSize = SliderSize.Md,
    track: ((Float) -> Brush)? = null,
    thumbColor: Color? = null,
    label: String? = null,
    valueText: ((Float) -> String)? = null,
    source: MutableInteractionSource = remember { MutableInteractionSource() },
) {
    val t = Zen.tokens
    val focused by source.collectIsFocusedAsState()
    val ring = focused && Zen.page.keyboard
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    val commit by rememberUpdatedState(onValueCommit)
    val range = max - min
    fun snap(v: Float) = snap(v, min, max, step)
    val pct = if (range > 0f) ((value - min) / range).coerceIn(0f, 1f) else 0f
    val primary = t.primary.color()
    val muted = t.muted.color()
    val thumbFill = thumbColor ?: primary
    val shadows = listOf(ring(Color.Black.copy(alpha = 0.3f), 1f), Shadow(blur = 16f, color = t.glow.color(0.8f * t.glowK)))
    val ringShadow = ring(t.ring.color(0.4f), 4f)
    val density = LocalDensity.current.density
    val shade = remember { Paint() }

    Canvas(
        modifier
            .fillMaxWidth()
            .height(20.dp)
            .pointerHoverIcon(pressCursor(enabled)).then(if (enabled) Modifier else Modifier.alpha(0.5f))
            .semantics {
                if (label != null) contentDescription = label
                progressBarRangeInfo = ProgressBarRangeInfo(value, min..max, steps(min, max, step))
                valueText?.let { stateDescription = it(value) }
                if (!enabled) disabled()
                setProgress { to ->
                    val v = snap(to)
                    change(v)
                    commit?.invoke(v)
                    true
                }
            }
            .onKeyEvent { e ->
                if (!enabled || e.type != KeyEventType.KeyDown) return@onKeyEvent false
                val v = keyTarget(e.key, current, min, max, step, rtl) ?: return@onKeyEvent false
                if (v != current) change(v)
                commit?.invoke(v)
                true
            }
            .activeElement()
            .focusable(enabled, source)
            .pointerInput(enabled, min, max, step, rtl, size) {
                if (!enabled) return@pointerInput
                val r = size.thumb.dp.toPx() / 2f
                fun at(x: Float): Float {
                    val travel = this.size.width - 2 * r
                    if (travel <= 0f) return min
                    val p = ((x - r) / travel).coerceIn(0f, 1f)
                    return snap(min + (if (rtl) 1f - p else p) * range)
                }
                fun centre(v: Float): Float {
                    val p = if (range > 0f) (v - min) / range else 0f
                    return r + (if (rtl) 1f - p else p) * (this.size.width - 2 * r)
                }
                awaitEachGesture {
                    val down = awaitFirstDown()
                    val c = centre(current)
                    // On the thumb, it's grabbed where it's held; on the track, it jumps there.
                    val grab = if (abs(down.position.x - c) <= r) down.position.x - c else 0f
                    var v = at(down.position.x - grab)
                    if (v != current) change(v)
                    down.consume()
                    while (true) {
                        val e = awaitPointerEvent()
                        val p = e.changes.firstOrNull { it.id == down.id } ?: break
                        if (!p.pressed) break
                        if (p.positionChange() != Offset.Zero) {
                            val next = at(p.position.x - grab)
                            if (next != v) {
                                v = next
                                change(v)
                            }
                            p.consume()
                        }
                    }
                    commit?.invoke(v)
                }
            },
    ) {
        val th = size.track.dp.toPx()
        val r = size.thumb.dp.toPx() / 2f
        val top = (this.size.height - th) / 2f
        val brush = track?.invoke(pct) ?: SolidColor(muted)
        drawRoundRect(brush, Offset(0f, top), Size(this.size.width, th), CornerRadius(th / 2f))
        if (track == null) {
            // The fill runs to the value's share of the whole track, as the input's gradient does.
            val w = this.size.width * pct
            clipPath(androidx.compose.ui.graphics.Path().apply {
                addRoundRect(androidx.compose.ui.geometry.RoundRect(0f, top, this@Canvas.size.width, top + th, CornerRadius(th / 2f)))
            }) {
                drawRect(primary, Offset(if (rtl) this.size.width - w else 0f, top), Size(w, th))
            }
        }
        val cx = r + (if (rtl) 1f - pct else pct) * (this.size.width - 2 * r)
        drawThumb(Offset(cx, this.size.height / 2f), r, size.border.dp.toPx(), thumbFill, shade, shadows, if (ring) ringShadow else null)
    }
}

/** The glowing thumb: a disc with a white border, its shadows, and the focus ring outside. */
internal fun DrawScope.drawThumb(
    center: Offset,
    r: Float,
    border: Float,
    fill: Color,
    shade: Paint,
    shadows: List<Shadow>,
    ring: Shadow?,
) {
    val disc = Outline.Rounded(RoundRect(center.x - r, center.y - r, center.x + r, center.y + r, CornerRadius(r)))
    for (s in (listOfNotNull(ring) + shadows).asReversed()) boxShadow(disc, s, shade)
    drawCircle(fill, r, center)
    drawCircle(Color.White, r - border / 2f, center, style = Stroke(border))
}

internal fun snap(v: Float, min: Float, max: Float, step: Float?): Float {
    val clamped = v.coerceIn(min, max)
    if (step == null || step <= 0f) return clamped
    return (min + ((clamped - min) / step).roundToInt() * step).coerceIn(min, max)
}

/** The steps between the ends, as accessibility services count them. */
internal fun steps(min: Float, max: Float, step: Float?) =
    if (step != null && step > 0f) (((max - min) / step).roundToInt() - 1).coerceAtLeast(0) else 0

/**
 * Where a key moves a thumb, as the range input moves: the arrows a step (reading direction for ←→),
 * Page Up/Down a tenth, Home and End to the ends; null for other keys.
 */
internal fun keyTarget(key: Key, current: Float, min: Float, max: Float, step: Float?, rtl: Boolean): Float? {
    val range = max - min
    val small = if (step == null || step <= 0f) range / 100f else step
    val big = max(small, range / 10f)
    val to = when (key) {
        Key.DirectionUp -> current + small
        Key.DirectionDown -> current - small
        Key.DirectionRight -> if (rtl) current - small else current + small
        Key.DirectionLeft -> if (rtl) current + small else current - small
        Key.PageUp -> current + big
        Key.PageDown -> current - big
        Key.MoveHome -> min
        Key.MoveEnd -> max
        else -> return null
    }
    return snap(to, min, max, step)
}
