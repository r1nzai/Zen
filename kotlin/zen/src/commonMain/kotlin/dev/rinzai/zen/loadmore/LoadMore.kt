package dev.rinzai.zen.loadmore

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.spinner.Spinner

/**
 * The end of a long list that has more: a "Load more" button, which also presses itself when it
 * comes into view (`auto`, default). While `loading` it shows a spinner and won't ask again; once
 * there's nothing left (`hasMore` false) it's gone. Put it after the list, or in a table's last row.
 */
@Composable
fun LoadMore(
    onLoadMore: () -> Unit,
    hasMore: Boolean,
    modifier: Modifier = Modifier,
    loading: Boolean = false,
    auto: Boolean = true,
    label: String? = null,
    loadingLabel: String? = null,
) {
    if (!hasMore) return
    val m = LocalMessages.current
    val load by rememberUpdatedState(onLoadMore)
    var inView by remember { mutableStateOf(false) }
    // Asked afresh after each load, so a page too short to scroll keeps filling.
    LaunchedEffect(auto, loading, inView) {
        if (auto && !loading && inView) load()
    }
    Box(
        modifier
            .fillMaxWidth()
            .onGloballyPositioned { inView = !it.boundsInWindow().isEmpty }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Button(onLoadMore, variant = ButtonVariant.Ghost, size = ButtonSize.Sm, enabled = !loading) {
            if (loading) {
                Spinner(size = 14.dp)
                Text(loadingLabel ?: m.loadingMore)
            } else {
                Text(label ?: m.loadMore)
            }
        }
    }
}
