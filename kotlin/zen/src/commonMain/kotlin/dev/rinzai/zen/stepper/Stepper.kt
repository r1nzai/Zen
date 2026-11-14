package dev.rinzai.zen.stepper

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.transition

private enum class StepState { Done, Current, Upcoming }

/** The steps of a Stepper, in order. */
class StepperScope internal constructor() {
    internal val steps = mutableListOf<Pair<@Composable () -> Unit, (@Composable () -> Unit)?>>()

    /** One step's label, and optionally a line under it (hidden on phones). */
    fun step(description: (@Composable () -> Unit)? = null, label: @Composable () -> Unit) {
        steps += label to description
    }

    fun step(label: String, description: String? = null) =
        step(description?.let { { Text(it) } }) { Text(label) }
}

/**
 * The steps of a flow (sign-up, checkout, import), with where you are: steps before `value` (from
 * 0) are done, the one at it is current. The line between them fills in as you go.
 */
@Composable
fun Stepper(value: Int, modifier: Modifier = Modifier, label: String? = null, content: StepperScope.() -> Unit) {
    val m = LocalMessages.current
    val steps = StepperScope().apply(content).steps
    Layout(
        content = {
            steps.forEachIndexed { i, (stepLabel, description) ->
                val state = when {
                    i < value -> StepState.Done
                    i == value -> StepState.Current
                    else -> StepState.Upcoming
                }
                Step(i, state, stepLabel, description, Modifier)
            }
        },
        modifier = modifier.fillMaxWidth().semantics { contentDescription = label ?: m.progress },
        measurePolicy = EqualSteps,
    )
}

/**
 * The steps side by side in equal shares (flex-1), as a flex row sizes them: as wide as all of
 * them at their natural widths, then shared out evenly, so a long label wraps.
 */
private object EqualSteps : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val n = measurables.size
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth
        else measurables.sumOf { it.maxIntrinsicWidth(constraints.maxHeight) }
        fun edge(i: Int) = (width.toLong() * i / n.coerceAtLeast(1)).toInt()
        val placeables = measurables.mapIndexed { i, m ->
            val w = edge(i + 1) - edge(i)
            m.measure(Constraints.fixedWidth(w))
        }
        val height = constraints.constrainHeight(placeables.maxOfOrNull { it.height } ?: 0)
        return layout(width, height) { placeables.forEachIndexed { i, p -> p.placeRelative(edge(i), 0) } }
    }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
        measurables.sumOf { it.maxIntrinsicWidth(height) }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
        measurables.sumOf { it.minIntrinsicWidth(height) }

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
        measurables.maxOfOrNull { it.maxIntrinsicHeight(share(it, width, measurables.size)) } ?: 0

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
        measurables.maxOfOrNull { it.minIntrinsicHeight(share(it, width, measurables.size)) } ?: 0

    /** A step's share of `width`; with no width to share, its own natural width. */
    private fun share(m: IntrinsicMeasurable, width: Int, n: Int) =
        if (width == Constraints.Infinity) m.maxIntrinsicWidth(Constraints.Infinity) else width / n
}

@Composable
private fun Step(i: Int, state: StepState, label: @Composable () -> Unit, description: (@Composable () -> Unit)?, modifier: Modifier) {
    val t = Zen.tokens
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val spec = transition<Color>(300)
    val fill by animateColorAsState(
        when (state) {
            StepState.Upcoming -> t.tint.color(0.05f)
            StepState.Current -> t.primary.color(0.15f)
            StepState.Done -> t.primary.color()
        },
        spec,
    )
    val ink by animateColorAsState(
        when (state) {
            StepState.Upcoming -> t.mutedForeground.color()
            StepState.Current -> t.foreground.color()
            StepState.Done -> t.primaryForeground.color()
        },
        spec,
    )
    val edge by animateColorAsState(
        when (state) {
            StepState.Upcoming -> t.tint.color(0.12f)
            StepState.Current -> t.primary.color(0.5f)
            StepState.Done -> t.primary.color(0f)
        },
        spec,
    )
    val halo by animateColorAsState(t.glow.color(if (state == StepState.Current) 0.7f * t.glowK else 0f), spec)
    val filled by animateFloatAsState(if (state == StepState.Upcoming) 0f else 1f, transition(500, Ease.OutSoft))
    val track = t.tint.color(0.1f)
    val bar = t.primary.color()
    Column(
        modifier
            // The line from the step before: from 1.25rem past its circle to 1.25rem short of this one.
            .drawBehind {
                if (i == 0) return@drawBehind
                val gap = 20.dp.toPx()
                val from = -size.width / 2 + gap
                val to = size.width / 2 - gap
                if (to <= from) return@drawBehind
                val y = 14.dp.toPx()
                val h = 1.dp.toPx()
                val length = to - from
                fun x(at: Float) = if (rtl) size.width - at else at
                drawRect(track, Offset(minOf(x(from), x(to)), y), Size(length, h))
                val start = if (rtl) x(from) - length * filled else x(from)
                drawRect(bar, Offset(start, y), Size(length * filled, h))
            }
            .semantics(mergeDescendants = true) {
                stateDescription = when (state) {
                    StepState.Done -> "done"
                    StepState.Upcoming -> "not started"
                    StepState.Current -> "current step"
                }
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            Modifier
                .size(28.dp)
                .box(CircleShape, fill = SolidColor(fill), shadows = listOf(Shadow(spread = 1f, color = edge, inset = true), Shadow(blur = 18f, spread = -2f, color = halo))),
            contentAlignment = Alignment.Center,
        ) {
            if (state == StepState.Done) Icon(Icons.CheckMicro, size = 14.dp, color = ink)
            else Text("${i + 1}", style = TextStyles.xs.merge(TextStyles.semibold).merge(TextStyles.tabular), color = ink)
        }
        Column(Modifier.padding(horizontal = 4.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            val lit = state != StepState.Upcoming
            ProvideText(if (lit) t.foreground.color() else t.mutedForeground.color(), TextStyles.sm.merge(TextStyles.medium).copy(textAlign = TextAlign.Center)) { label() }
            if (description != null && Zen.page.atLeast(Breakpoint.Sm)) {
                ProvideText(t.mutedForeground.color(), TextStyles.xs.copy(textAlign = TextAlign.Center)) { description() }
            }
        }
    }
}
