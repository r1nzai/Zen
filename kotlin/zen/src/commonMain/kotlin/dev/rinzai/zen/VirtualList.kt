package dev.rinzai.zen

import androidx.compose.foundation.ScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.table.TableScrollState
import kotlin.math.ceil
import kotlin.math.floor

/** One item a virtual list has now: its place, and where it starts from the top of the list. */
@Immutable
data class VirtualItem(val index: Int, val start: Dp, val size: Dp)

/** The items in view (and a few either side), and the room the others take above and below. */
@Immutable
class VirtualList internal constructor(val items: List<VirtualItem>, val totalSize: Dp, val paddingTop: Dp, val paddingBottom: Dp)

/**
 * Windowing for a scrolling list whose rows are all `itemHeight` tall: only the rows in view of
 * `scroll` (plus `overscan` either side) are had, so a list of thousands costs as much as one of a
 * screenful. `keep` is a row to have even out of view (one being dragged), and those between it and
 * the rest. It changes only as rows come into or go out of view, not with every pixel scrolled.
 */
@Composable
fun rememberVirtualList(count: Int, itemHeight: Dp, scroll: ScrollState, overscan: Int = 6, keep: Int? = null): VirtualList =
    virtualList(count, itemHeight, scroll, { scroll.value }, { scroll.viewportSize }, overscan, keep)

/** For a TableContainer's rows: give the container the same `scroll`. */
@Composable
fun rememberVirtualList(count: Int, itemHeight: Dp, scroll: TableScrollState, overscan: Int = 6, keep: Int? = null): VirtualList =
    virtualList(count, itemHeight, scroll, { scroll.value }, { scroll.viewportSize }, overscan, keep)

@Composable
private fun virtualList(count: Int, itemHeight: Dp, scroll: Any, offset: () -> Int, viewport: () -> Int, overscan: Int, keep: Int?): VirtualList {
    val row = with(LocalDensity.current) { itemHeight.toPx() }
    val range by remember(scroll, count, row, overscan) {
        derivedStateOf {
            // Until it can be measured, ten rows.
            val height = viewport().takeIf { it > 0 }?.toFloat() ?: (row * 10)
            maxOf(0, floor(offset() / row).toInt() - overscan) to minOf(count, ceil((offset() + height) / row).toInt() + overscan)
        }
    }
    val kept = keep != null && keep in 0 until count
    val first = minOf(if (kept) minOf(range.first, keep!!) else range.first, count)
    val last = minOf(if (kept) maxOf(range.second, keep!! + 1) else range.second, count)
    val items = (first until last).map { VirtualItem(it, itemHeight * it, itemHeight) }
    val total = itemHeight * count
    return VirtualList(
        items,
        total,
        items.firstOrNull()?.start ?: 0.dp,
        items.lastOrNull()?.let { total - (it.start + itemHeight) } ?: 0.dp,
    )
}
