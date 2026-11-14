package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.formatDuration
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList

@Composable
internal fun UpNext(queue: Queue) {
    val popup = rememberPopupState()
    Button(popup::toggle, Modifier.popupAnchor(popup), variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Up next", popupOpen = popup.open) {
        Icon(Icons.QueueList)
    }
    PopoverContent(popup, label = "Up next") {
        val muted = Zen.tokens.mutedForeground.color()
        // As wide as its widest row (max-content), every row that wide.
        Column(Modifier.width(IntrinsicSize.Max).padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Up next", Modifier.padding(horizontal = 8.dp, vertical = 4.dp), TextStyles.xs.merge(TextStyles.medium), muted)
            val next = queue.upNext
            if (next.isEmpty()) {
                Text(
                    if (queue.repeat == Repeat.All) "The list starts again." else "Nothing after this one.",
                    Modifier.padding(horizontal = 8.dp, vertical = 12.dp),
                    TextStyles.sm,
                    muted,
                )
            } else {
                SortableList(next.map { it.id }, queue::reorder, Modifier.fillMaxWidth()) { id ->
                    val track = byId(id)
                    Row(
                        Modifier.fillMaxWidth().padding(start = 2.dp, end = 8.dp, top = 6.dp, bottom = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        SortableHandle(id, track.title)
                        Cover(track.album.colors, Zen.radii.md, Modifier.size(36.dp))
                        Column(Modifier.weight(1f)) {
                            Text(track.title, style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(track.album.artist, style = TextStyles.xs, color = muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Text(formatDuration(track.sound.seconds), style = TextStyles.xs.merge(TextStyles.tabular), color = muted)
                    }
                }
            }
        }
    }
}
