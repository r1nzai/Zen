package dev.rinzai.zen.rangeslider

import dev.rinzai.zen.pressCursor
import dev.rinzai.zen.activeElement
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import kotlin.math.roundToInt
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Zen
import dev.rinzai.zen.ring
import dev.rinzai.zen.slider.SliderSize
import dev.rinzai.zen.slider.drawThumb
import dev.rinzai.zen.slider.keyTarget
import dev.rinzai.zen.slider.snap
import dev.rinzai.zen.slider.steps
import kotlin.math.abs

/**
 * Two thumbs on one track, for a span such as an amount from $50 to $500: each
 * works as Slider's does from the keyboard and for screen readers, the span
 * between them filled. The thumbs can meet but not cross, and are moved by
 * dragging them (a press on the track leaves them be). `label` names the pair;
 * `thumbLabels` each thumb ("Minimum", "Maximum" by default).
 */
@Composable
fun RangeSlider(
    value: ClosedFloatingPointRange<Float>,
    onValueChange: (ClosedFloatingPointRange<Float>) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: Float = 0f,
    max: Float = 100f,
    step: Float? = 1f,
    /** Once the user lets go: the moment to save or filter. */
    onValueCommit: ((ClosedFloatingPointRange<Float>) -> Unit)? = null,
    thumbLabels: Pair<String, String>? = null,
    /** Spoken value of a thumb, e.g. { "$$it" }. */
    valueText: ((Float) -> String)? = null,
    size: SliderSize = SliderSize.Md,
    enabled: Boolean = true,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val names = thumbLabels ?: (m.minimum to m.maximum)
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    val commit by rememberUpdatedState(onValueCommit)
    val sources = remember { List(2) { MutableInteractionSource() } }
    val focus = remember { List(2) { FocusRequester() } }
    val keyboard = Zen.page.keyboard
    val rings = sources.map { it.collectIsFocusedAsState().value && keyboard }
    val range = max - min
    fun at(v: Float) = if (range > 0f) ((v - min) / range).coerceIn(0f, 1f) else 0f
    fun set(thumb: Int, v: Float): ClosedFloatingPointRange<Float> {
        val (low, high) = current.start to current.endInclusive
        return if (thumb == 0) minOf(v, high)..high else low..maxOf(v, low)
    }
    fun move(thumb: Int, v: Float) {
        val next = set(thumb, v)
        if (next != current) change(next)
    }
    // Both thumbs at the top end: the low one goes on top, or it couldn't be moved back.
    fun top() = if (current.start > (min + max) / 2) 0 else 1

    val primary = t.primary.color()
    val muted = t.muted.color()
    val shadows = listOf(ring(Color.Black.copy(alpha = 0.3f), 1f), Shadow(blur = 16f, color = t.glow.color(0.8f * t.glowK)))
    val ringShadow = ring(t.ring.color(0.4f), 4f)
    val shade = remember { Paint() }

    Box(
        modifier
            .fillMaxWidth()
            .height(20.dp)
            .then(if (enabled) Modifier else Modifier.alpha(0.5f))
            .semantics {
                contentDescription = label
                isTraversalGroup = true
            }
            .pointerInput(enabled, min, max, step, rtl, size) {
                if (!enabled) return@pointerInput
                val r = size.thumb.dp.toPx() / 2f
                val travel = this.size.width - 2 * r
                fun centre(v: Float) = r + (if (rtl) 1f - at(v) else at(v)) * travel
                fun value(x: Float): Float {
                    if (travel <= 0f) return min
                    val p = ((x - r) / travel).coerceIn(0f, 1f)
                    return snap(min + (if (rtl) 1f - p else p) * range, min, max, step)
                }
                awaitEachGesture {
                    val down = awaitFirstDown()
                    // Only the thumbs take presses; the one on top first.
                    val y = abs(down.position.y - this.size.height / 2f)
                    val order = top().let { listOf(it, 1 - it) }
                    val thumb = order.firstOrNull { i ->
                        val v = if (i == 0) current.start else current.endInclusive
                        abs(down.position.x - centre(v)) <= r && y <= r
                    } ?: return@awaitEachGesture
                    val grab = down.position.x - centre(if (thumb == 0) current.start else current.endInclusive)
                    focus[thumb].requestFocus()
                    down.consume()
                    while (true) {
                        val e = awaitPointerEvent()
                        val p = e.changes.firstOrNull { it.id == down.id } ?: break
                        if (!p.pressed) break
                        if (p.positionChange() != Offset.Zero) {
                            move(thumb, value(p.position.x - grab))
                            p.consume()
                        }
                    }
                    commit?.invoke(current)
                }
            }
            .pointerHoverIcon(pressCursor(enabled)),
    ) {
        val r = size.thumb.dp / 2
        Canvas(Modifier.matchParentSize()) {
            val th = size.track.dp.toPx()
            val top = (this.size.height - th) / 2f
            val radius = CornerRadius(th / 2f)
            drawRoundRect(muted, Offset(0f, top), Size(this.size.width, th), radius)
            // The span runs between the values' shares of the whole track, as the input's gradient does.
            val (a, b) = at(value.start) * this.size.width to at(value.endInclusive) * this.size.width
            drawRect(primary, Offset(if (rtl) this.size.width - b else a, top), Size(b - a, th))
            val rp = r.toPx()
            for (i in top().let { listOf(1 - it, it) }) {
                val v = if (i == 0) value.start else value.endInclusive
                val cx = rp + (if (rtl) 1f - at(v) else at(v)) * (this.size.width - 2 * rp)
                drawThumb(Offset(cx, this.size.height / 2f), rp, size.border.dp.toPx(), primary, shade, shadows, if (rings[i]) ringShadow else null)
            }
        }
        for (i in 0..1) {
            val v = if (i == 0) value.start else value.endInclusive
            val p = if (rtl) 1f - at(v) else at(v)
            Box(
                Modifier
                    // At its value along the track, as wide as the track for placing.
                    .layout { measurable, constraints ->
                        val d = size.thumb.dp.roundToPx()
                        val thumb = measurable.measure(Constraints.fixed(d, d))
                        // Unbounded (measured for its intrinsic size), it's just the thumb.
                        val w = if (constraints.hasBoundedWidth) constraints.maxWidth else d
                        val h = if (constraints.hasBoundedHeight) constraints.maxHeight else d
                        layout(w, h) { thumb.place(((w - d) * p).roundToInt(), (h - d) / 2) }
                    }
                    .focusRequester(focus[i])
                    .onKeyEvent { e ->
                        if (!enabled) return@onKeyEvent false
                        val now = if (i == 0) current.start else current.endInclusive
                        val to = keyTarget(e.key, now, min, max, step, rtl) ?: return@onKeyEvent false
                        if (e.type == KeyEventType.KeyDown) move(i, to)
                        else if (e.type == KeyEventType.KeyUp) commit?.invoke(current)
                        true
                    }
                    .activeElement()
                    .focusable(enabled, sources[i])
                    .semantics {
                        contentDescription = if (i == 0) names.first else names.second
                        progressBarRangeInfo = ProgressBarRangeInfo(v, min..max, steps(min, max, step))
                        valueText?.let { stateDescription = it(v) }
                        if (!enabled) disabled()
                        setProgress { to ->
                            move(i, snap(to, min, max, step))
                            commit?.invoke(current)
                            true
                        }
                    },
            )
        }
    }
}
