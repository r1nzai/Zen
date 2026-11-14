package dev.rinzai.zen.chart

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Ease
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.NumberStyle
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.filterDropShadow
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.locale
import dev.rinzai.zen.rememberSeen
import dev.rinzai.zen.seen
import dev.rinzai.zen.transition
import kotlin.math.roundToInt

/** A part of an allocation's whole: its key, name, value and (else the palette's) colour. */
@Immutable
data class AllocationItem(val key: String, val label: String, val value: Double, val color: Color? = null)

private val Sweep = CubicBezierEasing(0.3f, 0.7f, 0.2f, 1f)

/**
 * Where a whole went, as one bar split into its parts (e.g. income across spending, savings and
 * bills), with a legend of each part's value and share. Pointing at a part, in the bar or the
 * legend, picks it out; screen readers hear every part's value and share from the bar's label.
 * Sweeps in from the start the first time it's seen. Colours default to the chart palette in
 * order, like DonutChart's. `label` says what the whole is, e.g. "Income in September";
 * `locale` is for the shares' percent format.
 */
@Composable
fun AllocationBar(
    items: List<AllocationItem>,
    label: String,
    modifier: Modifier = Modifier,
    palette: ChartPalette = ChartPalette.Chart,
    formatValue: (Double) -> String = { it.toString() },
    locale: String? = null,
    legend: Boolean = true,
) {
    var active by remember { mutableStateOf<String?>(null) }
    val parts = items.filter { it.value > 0 }
    val total = parts.sumOf { it.value }
    val colors = items.mapIndexed { i, it -> it.key to (it.color ?: paletteColor(palette, i, items.size)) }.toMap()
    val loc = locale(locale)
    fun percent(v: Double) = formatNumber(if (total > 0) v / total else 0.0, loc, NumberOptions(NumberStyle.Percent, maximumFractionDigits = 0))
    val seen = rememberSeen()
    val sweep = remember { Animatable(0f) }
    val spec = transition<Float>(900, Sweep)
    LaunchedEffect(seen.seen) { if (seen.seen) sweep.animateTo(1f, spec) }

    // As wide as it's given, or (given no width) as its legend: the bar fills whichever.
    Column(modifier.width(IntrinsicSize.Max).seen(seen), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        val described = "$label. " + parts.joinToString("; ") { "${it.label}: ${formatValue(it.value)}, ${percent(it.value)}" }
        Layout(
            content = {
                for (it in parts) key(it.key) {
                    val on = active == it.key
                    val dimmed = active != null && !on
                    val opacity by animateFloatAsState(if (dimmed) 0.35f else 1f, transition(200, Ease.Css))
                    val glow by animateFloatAsState(if (on) 1f else 0f, transition(200, Ease.Css))
                    val color = colors.getValue(it.key)
                    Box(
                        Modifier
                            .pointing { over -> active = if (over) it.key else if (active == it.key) null else active }
                            .graphicsLayer { alpha = opacity }
                            .filterDropShadow(if (glow > 0f) Shadow(blur = 8f * glow, color = color.copy(alpha = color.alpha * glow)) else null)
                            .box(androidx.compose.ui.graphics.RectangleShape, fill = SolidColor(color)),
                    )
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(12.dp)
                .clearAndSetSemantics {
                    role = Role.Image
                    contentDescription = described
                }
                .drawWithContent {
                    // Revealed from the start, as if drawn.
                    clipRect(right = size.width * sweep.value) { this@drawWithContent.drawContent() }
                }
                .clip(CircleShape),
            measurePolicy = remember(parts) { BarPolicy(parts.map { it.value }) },
        )
        if (legend) {
            // The bar's label reads every part out; this is the same, to look at.
            val columns = if (Zen.page.atLeast(Breakpoint.Sm)) 2 else 1
            ProvideText(style = TextStyles.sm) {
                Column(Modifier.clearAndSetSemantics {}, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    for (row in items.chunked(columns)) Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                        for (it in row) key(it.key) {
                            val dimmed = active != null && active != it.key
                            val opacity by animateFloatAsState(if (dimmed) 0.5f else 1f, transition(200, Ease.Css))
                            Row(
                                Modifier
                                    .weight(1f)
                                    .pointing { over -> active = if (over) it.key else if (active == it.key) null else active }
                                    .graphicsLayer { alpha = opacity },
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Box(Modifier.size(10.dp).box(CircleShape, fill = SolidColor(colors.getValue(it.key))))
                                Text(it.label, Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(formatValue(it.value), style = TextStyles.tabular)
                                Text(percent(maxOf(0.0, it.value)), Modifier.width(40.dp), style = TextStyles.tabular, color = Zen.tokens.mutedForeground.color(), align = TextAlign.End)
                            }
                        }
                        if (row.size < columns) Box(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

/** A mouse pointing at it, or leaving. */
private fun Modifier.pointing(onChange: (Boolean) -> Unit) = pointerInput(Unit) {
    awaitPointerEventScope {
        while (true) {
            when (awaitPointerEvent().type) {
                PointerEventType.Enter -> onChange(true)
                PointerEventType.Exit -> onChange(false)
            }
        }
    }
}

/**
 * CSS flex's widths for items growing by `grows` from a basis of 0 in `room`, each at least `min`:
 * an item its share would put under its minimum is frozen there, and the rest share what's left.
 */
internal fun flexWidths(grows: List<Double>, room: Float, min: Float): List<Float> {
    val frozen = BooleanArray(grows.size)
    val widths = FloatArray(grows.size)
    while (true) {
        val free = room - grows.indices.filter { frozen[it] }.sumOf { widths[it].toDouble() }.toFloat()
        val growing = grows.indices.filter { !frozen[it] }
        val sum = growing.sumOf { grows[it] }
        var violated = false
        for (i in growing) widths[i] = if (sum > 0) (grows[i] / sum * free).toFloat() else 0f
        for (i in growing) if (widths[i] < min) {
            widths[i] = min
            frozen[i] = true
            violated = true
        }
        if (!violated) return widths.toList()
    }
}

/** The bar's parts laid out as flex lays them; its least width is every part at its 4dp minimum. */
private class BarPolicy(val values: List<Double>) : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val gap = 2.dp.roundToPx()
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth else least(this)
        // Flex: each part's share of the room left after the 2dp gaps, by value, but none under 4dp.
        val room = (width - gap * (measurables.size - 1).coerceAtLeast(0)).toFloat()
        val widths = flexWidths(values, room, 4.dp.toPx())
        val placeables = measurables.mapIndexed { i, m -> m.measure(Constraints.fixed(widths[i].roundToInt().coerceAtLeast(0), constraints.maxHeight)) }
        return layout(width, constraints.maxHeight) {
            var x = 0f
            for ((i, p) in placeables.withIndex()) {
                p.place(x.roundToInt(), 0)
                x += widths[i] + gap
            }
        }
    }

    private fun least(d: androidx.compose.ui.unit.Density) = with(d) { values.size * 4.dp.roundToPx() + (values.size - 1).coerceAtLeast(0) * 2.dp.roundToPx() }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) = least(this)
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) = least(this)
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) = 0
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) = 0
}
