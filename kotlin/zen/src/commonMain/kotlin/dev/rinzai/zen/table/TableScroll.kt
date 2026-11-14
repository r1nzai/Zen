package dev.rinzai.zen.table

import androidx.compose.foundation.MutatePriority
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.ScrollScope
import androidx.compose.foundation.gestures.ScrollableState
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.scrollableArea
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ScrollAxisRange
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.scrollBy
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.verticalScrollAxisRange
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/**
 * How far a TableContainer's rows are scrolled. The Table lays out only the view it's scrolled to,
 * so it can be any length (Compose can't measure anything past 262,142px): rows windowed with
 * rememberVirtualList and TableSpacerRows run to as many thousands as there are.
 */
@Stable
class TableScrollState(initial: Int = 0) : ScrollableState {
    var value by mutableIntStateOf(initial)
        private set

    /** How far it scrolls: the rows' height less the view's. */
    var maxValue: Int
        get() = max.intValue
        internal set(next) {
            max.intValue = next
            if (value > next) value = next
        }
    private val max = mutableIntStateOf(Int.MAX_VALUE)

    /** The view's height. */
    var viewportSize by mutableIntStateOf(0)
        internal set

    private var accumulator = 0f

    private val inner = ScrollableState { delta ->
        val absolute = value + delta + accumulator
        val next = absolute.coerceIn(0f, maxValue.toFloat())
        val consumed = next - value
        val whole = consumed.roundToInt()
        value += whole
        accumulator = consumed - whole
        if (absolute != next) consumed else delta
    }

    override suspend fun scroll(scrollPriority: MutatePriority, block: suspend ScrollScope.() -> Unit) = inner.scroll(scrollPriority, block)

    override fun dispatchRawDelta(delta: Float) = inner.dispatchRawDelta(delta)

    override val isScrollInProgress get() = inner.isScrollInProgress
    override val canScrollForward get() = value < maxValue
    override val canScrollBackward get() = value > 0

    /** Scrolls straight to `to`. */
    suspend fun scrollTo(to: Int) = scrollBy((to - value).toFloat())

    companion object {
        val Saver = Saver<TableScrollState, Int>({ it.value }, { TableScrollState(it) })
    }
}

@Composable
fun rememberTableScrollState(initial: Int = 0) = rememberSaveable(saver = TableScrollState.Saver) { TableScrollState(initial) }

/** The container's scrolling: drags, the wheel, flings and focus moving out of view, as verticalScroll's. */
internal fun Modifier.tableScroll(state: TableScrollState, scope: CoroutineScope): Modifier =
    semantics {
        isTraversalGroup = true
        verticalScrollAxisRange = ScrollAxisRange({ state.value.toFloat() }, { state.maxValue.toFloat() })
        scrollBy { _, y ->
            scope.launch { state.scrollBy(y) }
            true
        }
    }
        .scrollableArea(state, Orientation.Vertical)
