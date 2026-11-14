package dev.rinzai.zen

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.LayoutModifier
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.unit.Constraints

/**
 * width: 100% on a table or a scroller: the full width, and, where something shrinks to fit it
 * (IntrinsicSize.Max, as a browser sizes a popover or a centred root), as wide as that is allowed
 * to get, not its content.
 */
internal fun Modifier.fullWidth() = then(WidestIntrinsic(sized = true)).fillMaxWidth()

/**
 * fullWidth() for what's sized only as it's laid out (a BoxWithConstraints, which can't be asked
 * its intrinsic size): no height until then, to whatever asks before.
 */
internal fun Modifier.fullWidthLaidOut() = then(WidestIntrinsic(sized = false)).fillMaxWidth()

private class WidestIntrinsic(private val sized: Boolean) : LayoutModifier {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val p = measurable.measure(constraints)
        return layout(p.width, p.height) { p.place(0, 0) }
    }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = WIDEST

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) =
        if (sized) measurable.minIntrinsicWidth(height) else 0

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) =
        if (sized) measurable.minIntrinsicHeight(width) else 0

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) =
        if (sized) measurable.maxIntrinsicHeight(width) else 0

    override fun equals(other: Any?) = other is WidestIntrinsic && other.sized == sized
    override fun hashCode() = sized.hashCode()

    private companion object {
        // The widest a fixed width can be in Constraints; whatever shrinks to fit clamps it to what it allows.
        const val WIDEST = (1 shl 18) - 2
    }
}

/**
 * contain: inline-size, for what's sized only as it's laid out (a SubcomposeLayout, which can't be
 * asked its intrinsic size): no intrinsic width, as the browser gives a contained box, and no
 * intrinsic height until then.
 */
internal fun Modifier.containInlineSize() = then(ContainInlineSize)

private object ContainInlineSize : LayoutModifier {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val p = measurable.measure(constraints)
        return layout(p.width, p.height) { p.place(0, 0) }
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = 0
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = 0
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = 0
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = 0
}
