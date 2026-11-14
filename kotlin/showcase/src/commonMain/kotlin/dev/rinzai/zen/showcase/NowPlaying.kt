package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.dialog.DialogSide
import dev.rinzai.zen.seekbar.SeekBar
import dev.rinzai.zen.seekbar.SeekTimes

/** The track playing, large, as a sheet from the bottom: its cover, like, seek and transport. */
@Composable
internal fun NowPlaying(open: Boolean, onOpenChange: (Boolean) -> Unit, controls: Controls, liked: Set<String>, onLike: (String) -> Unit) {
    val t = Zen.tokens
    val track = controls.queue.track
    val player = controls.player
    Dialog(open, onOpenChange, "Now playing", side = DialogSide.Bottom) {
        Column(
            Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Cover(
                track.album.colors,
                RoundedCornerShape((t.radius + 6).dp),
                Modifier.widthIn(max = 288.dp).fillMaxWidth().aspectRatio(1f),
                shadows = listOf(Shadow(y = 24f, blur = 64f, spread = -16f, color = t.glow.color(0.6f * t.glowK))),
            )
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1f)) {
                    Text(track.title, style = TextStyles.lg.merge(TextStyles.semibold), maxLines = 1, overflow = TextOverflow.Ellipsis, softWrap = false)
                    Text(
                        "${track.album.artist} · ${track.album.title}",
                        style = TextStyles.sm,
                        color = t.mutedForeground.color(),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        softWrap = false,
                    )
                }
                LikeButton(track.id in liked, { onLike(track.id) })
            }
            SeekBar(player.currentTime, player.duration, player::seek, Modifier.fillMaxWidth(), buffered = player.buffered, times = SeekTimes.Below)
            Transport(controls, large = true)
        }
    }
}
