package dev.rinzai.zen

import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.lazy.LazyListState

/** Scrolls the item at `index` just into view, as scrollIntoView({ block: 'nearest' }) does: not at all if it's in view. */
internal suspend fun LazyListState.scrollIntoView(index: Int) {
    val info = layoutInfo
    val item = info.visibleItemsInfo.firstOrNull { it.index == index }
    val top = info.viewportStartOffset + info.beforeContentPadding
    val bottom = info.viewportEndOffset - info.afterContentPadding
    when {
        item == null -> scrollToItem(index)
        item.offset < top -> scrollBy((item.offset - top).toFloat())
        item.offset + item.size > bottom -> scrollBy((item.offset + item.size - bottom).toFloat())
    }
}
