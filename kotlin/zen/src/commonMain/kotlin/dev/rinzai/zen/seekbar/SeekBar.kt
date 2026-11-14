package dev.rinzai.zen.seekbar

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.runtime.mutableLongStateOf
import kotlin.math.abs
import kotlin.time.TimeSource
import kotlin.time.DurationUnit
import kotlin.time.Duration
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.formatDuration
import dev.rinzai.zen.ring
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.slider.drawThumb
import dev.rinzai.zen.transition

/** Where the time played and the length go: either side of the bar, or under its ends (a phone's Now Playing screen). */
enum class SeekTimes { Beside, Below }

// Seconds an arrow key moves, as video players do.
private const val KEY_STEP = 5.0

/**
 * Where playback is in a track, and the way to move it: filled up to the current time, shaded on
 * to what's loaded, between the time played and the length. While dragging, the time follows the
 * thumb and the track keeps playing; letting go seeks. The arrow keys seek 5 seconds.
 */
@Composable
fun SeekBar(
    currentTime: Double,
    duration: Double,
    onSeek: (Double) -> Unit,
    modifier: Modifier = Modifier,
    buffered: Double = 0.0,
    times: SeekTimes = SeekTimes.Beside,
    enabled: Boolean = true,
    label: String? = null,
    /** While the time is running (playing, not waiting for data): the bar glides on between time updates. */
    playing: Boolean = false,
    /** How fast it moves on while playing. */
    playbackRate: Double = 1.0,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    var dragging by remember { mutableStateOf<Double?>(null) }
    // Once let go, the thumb stays where it was dropped until the player reports the seek.
    var dropped by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    val settling = dropped?.takeIf { it.second == currentTime }?.first
    val time = (dragging ?: settling ?: currentTime).coerceIn(0.0, maxOf(duration, 0.0))
    val drawn = glide(time, playing && dragging == null && settling == null && duration > 0 && time < duration, playbackRate, duration)
    val off = !enabled || duration <= 0.0
    val loaded by animateFloatAsState(if (duration > 0) (minOf(buffered, duration) / duration).toFloat() else 0f, transition(300))
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val ring = focused && Zen.page.keyboard
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val density = LocalDensity.current.density
    val shadows = listOf(ring(Color.Black.copy(alpha = 0.3f), 1f), Shadow(blur = 16f, color = t.glow.color(0.8f * t.glowK)))
    val ringShadow = ring(t.ring.color(0.4f), 4f)
    val shade = remember { Paint() }
    val primary = t.primary.color()

    val bar = @Composable { at: Modifier ->
        Box(
            at
                .height(20.dp)
                .then(if (off) Modifier.alpha(0.5f) else Modifier)
                .onPreviewKeyEvent { e ->
                    if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                    val by = when (e.key) {
                        Key.DirectionUp -> 1
                        Key.DirectionDown -> -1
                        Key.DirectionRight -> if (rtl) -1 else 1
                        Key.DirectionLeft -> if (rtl) 1 else -1
                        else -> return@onPreviewKeyEvent false
                    }
                    val to = (time + by * KEY_STEP).coerceIn(0.0, duration)
                    dropped = to to currentTime
                    onSeek(to)
                    true
                },
        ) {
            Canvas(Modifier.matchParentSize()) {
                val h = 10.dp.toPx()
                val r = 10.dp.toPx()
                val top = (size.height - h) / 2f
                val trackShape = Path().apply { addRoundRect(RoundRect(0f, top, size.width, top + h, CornerRadius(h / 2f))) }
                val p = if (duration > 0) (drawn() / duration).toFloat() else 0f
                val cx = r + (if (rtl) 1f - p else p) * (size.width - 2 * r)
                clipPath(trackShape) {
                    drawRect(t.muted.color(), Offset(0f, top), Size(size.width, h))
                    val lw = size.width * loaded
                    drawRect(t.tint.color(0.22f), Offset(if (rtl) size.width - lw else 0f, top), Size(lw, h))
                    // Thumb's centre to thumb's centre, as the slider runs.
                    drawRect(primary, Offset(if (rtl) cx else 0f, top), Size(if (rtl) size.width - cx else cx, h))
                }
                drawThumb(Offset(cx, size.height / 2f), r, 2.dp.toPx(), primary, shade, shadows, if (ring) ringShadow else null)
            }
            // The slider, unseen, takes the pointer, the keys and assistive tech; its thumb is the size of the one drawn.
            Slider(
                value = time.toFloat(),
                onValueChange = { dragging = it.toDouble() },
                onValueCommit = { v ->
                    dragging = null
                    dropped = v.toDouble() to currentTime
                    onSeek(v.toDouble())
                },
                modifier = Modifier.matchParentSize().alpha(0f),
                min = 0f,
                max = if (duration > 0) duration.toFloat() else 1f,
                step = null,
                enabled = !off,
                label = label ?: m.seek,
                valueText = { m.timeOf(formatDuration(time), formatDuration(duration)) },
                source = source,
            )
        }
    }
    val style = TextStyles.xs.merge(TextStyles.tabular)
    val muted = t.mutedForeground.color()
    if (times == SeekTimes.Below) {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            bar(Modifier.fillMaxWidth())
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(formatDuration(time), style = style, color = muted)
                Text(formatDuration(duration), style = style, color = muted)
            }
        }
    } else {
        // Both times are as wide as the length, so the track doesn't shift as they count.
        val measurer = rememberTextMeasurer()
        // CSS's ch: the plain "0" glyph's advance, whatever the figures are set to.
        val ch = LocalTextStyle.current.merge(TextStyles.xs).copy(fontFeatureSettings = null)
        val chars = formatDuration(duration).length
        val width = with(LocalDensity.current) { (measurer.measure("0", ch).multiParagraph.getLineRight(0) * chars).toDp() }
        Row(modifier, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(formatDuration(time), Modifier.width(width), style = style, color = muted, align = TextAlign.End, softWrap = false)
            bar(Modifier.weight(1f))
            Text(formatDuration(duration), Modifier.width(width), style = style, color = muted, softWrap = false)
        }
    }
}

/** Where a glide set off from: the time, when (on the monotonic clock), and how fast it runs. */
private class Glide(var time: Double = 0.0, var at: Duration = Duration.ZERO, var rate: Double = 1.0)

private val clock = TimeSource.Monotonic.markNow()

/**
 * The time, running on at `rate` between updates while `on`: an update close to where it's got
 * to (within 0.15s) doesn't set it back, so it moves on smoothly. Read in the draw phase.
 */
@Composable
private fun glide(time: Double, on: Boolean, rate: Double, duration: Double): () -> Double {
    val g = remember { Glide() }
    val now = clock.elapsedNow()
    if (!on || g.rate != rate || abs(g.time + (now - g.at).toDouble(DurationUnit.SECONDS) * rate - time) >= 0.15) {
        g.time = time
        g.at = now
        g.rate = rate
    }
    var frame by remember { mutableLongStateOf(0L) }
    if (on) LaunchedEffect(Unit) { while (true) withFrameNanos { frame = it } }
    return {
        if (!on) time
        else {
            frame
            minOf(duration, g.time + (clock.elapsedNow() - g.at).toDouble(DurationUnit.SECONDS) * g.rate)
        }
    }
}
