package dev.rinzai.zen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection

/**
 * `justify-content: space-between` with a `gap`: the first item at the start, the last at the end,
 * the room left shared between them, but never less than `gap` apart (where it overflows, `gap`).
 */
fun spaceBetween(gap: Dp): Arrangement.Horizontal = object : Arrangement.Horizontal {
    override val spacing = gap

    override fun Density.arrange(totalSize: Int, sizes: IntArray, layoutDirection: LayoutDirection, outPositions: IntArray) {
        val min = gap.roundToPx()
        val between = if (sizes.size > 1) maxOf(min.toFloat(), (totalSize - sizes.sum()).toFloat() / (sizes.size - 1)) else 0f
        var x = 0f
        val rtl = layoutDirection == LayoutDirection.Rtl
        for (i in sizes.indices) {
            val at = kotlin.math.round(x).toInt()
            outPositions[i] = if (rtl) totalSize - at - sizes[i] else at
            x += sizes[i] + between
        }
    }
}
