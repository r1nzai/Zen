package dev.rinzai.zen.meter

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.layout.layout
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.inOklab
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.transition
import kotlin.math.roundToInt

/** `Auto` picks Warning past `warnAt` of max and Negative past max. */
enum class MeterTone { Auto, Default, Warning, Negative }

/**
 * A measure against a limit, e.g. spend against a budget: a bar with a label, a figure (`detail`,
 * top right) and a note (`hint`, below). Over the limit it turns red; near it, warm. `valueText`
 * is read out instead of the bare number. `marks` are milestones along the bar, in value's units.
 */
@Composable
fun Meter(
    value: Double,
    modifier: Modifier = Modifier,
    max: Double = 100.0,
    label: String? = null,
    detail: String? = null,
    hint: String? = null,
    valueText: String? = null,
    tone: MeterTone = MeterTone.Auto,
    warnAt: Double = 0.85,
    marks: List<Double> = emptyList(),
) {
    val t = Zen.tokens
    val ratio = if (max > 0) value / max else if (value > 0) 1.0 else 0.0
    val pct = (ratio * 100).roundToInt().coerceIn(0, 100)
    val resolved = when {
        tone != MeterTone.Auto -> tone
        value > max -> MeterTone.Negative
        ratio >= warnAt -> MeterTone.Warning
        else -> MeterTone.Default
    }
    val quiet = if (resolved == MeterTone.Negative) t.destructive.color() else t.mutedForeground.color()
    val width by animateFloatAsState(pct / 100f, transition(700, Ease.OutSoft))
    val (fill, glow) = when (resolved) {
        MeterTone.Negative -> SolidColor(t.destructive.color()) to t.destructive.color(0.7f * t.glowK)
        MeterTone.Warning -> SolidColor(t.accentForeground.color()) to t.accentForeground.color(0.6f * t.glowK)
        else -> linearGradient(90f, *inOklab(0f to t.primary.color(), 1f to t.glow2.color())) to t.glow.color(0.6f * t.glowK)
    }
    val pill = RoundedCornerShape(50)
    Column(
        modifier.semantics(mergeDescendants = true) {
            progressBarRangeInfo = ProgressBarRangeInfo(minOf(value, max).toFloat(), 0f..max.toFloat())
            if (valueText != null) stateDescription = valueText
        },
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (label != null || detail != null) {
            Row {
                Box(Modifier.weight(1f)) { if (label != null) Text(label, style = TextStyles.sm.merge(TextStyles.medium)) }
                Box(Modifier.weight(1f)) {
                    if (detail != null) {
                        Text(detail, Modifier.fillMaxWidth(), style = TextStyles.sm.merge(TextStyles.tabular), color = quiet, align = TextAlign.End)
                    }
                }
            }
        }
        Box(Modifier.fillMaxWidth().height(8.dp).clip(pill).drawBehind { drawRect(t.muted.color()) }) {
            Box(
                Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(width)
                    .box(pill, fill = fill, shadows = listOf(Shadow(blur = 12f, color = glow))),
            )
            for (mark in marks) {
                val reached by animateColorAsState(
                    if (value >= mark) t.background.color(0.7f) else t.tint.color(0.25f),
                    transition(700),
                )
                val at = if (max > 0) minOf(1.0, mark / max).toFloat() else 0f
                Box(
                    Modifier
                        // left: at% of the track, then -translate-x-1/2.
                        .layout { m, c ->
                            val p = m.measure(c.copy(minWidth = 0))
                            layout(p.width, p.height) { p.place((c.maxWidth * at).roundToInt() - p.width / 2, 0) }
                        }
                        .width(2.dp)
                        .fillMaxHeight()
                        .drawBehind { drawRect(reached) },
                )
            }
        }
        if (hint != null) ProvideText(quiet, TextStyles.xs) { Text(hint) }
    }
}
