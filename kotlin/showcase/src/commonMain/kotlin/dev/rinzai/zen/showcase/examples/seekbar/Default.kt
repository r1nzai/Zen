package dev.rinzai.zen.showcase.examples.seekbar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.media.Audio
import dev.rinzai.zen.media.MediaSource
import dev.rinzai.zen.media.rememberMediaPlayer
import dev.rinzai.zen.seekbar.SeekBar
import dev.rinzai.zen.showcase.GLASS_AURORA
import dev.rinzai.zen.showcase.demoTrackWav

/** Filled to the time played, shaded on to what's loaded. Drag it: the track plays on, and seeks when you let go. */
@Composable
fun Default() {
    val player = rememberMediaPlayer()
    Audio(player, remember { MediaSource(demoTrackWav(GLASS_AURORA)) })
    Row(Modifier.width(384.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Button({ player.toggle() }, size = ButtonSize.IconSm, shape = CircleShape, label = if (player.playing) "Pause" else "Play") {
            Icon(if (player.playing) Icons.Pause else Icons.Play, size = 16.dp)
        }
        SeekBar(
            player.currentTime,
            player.duration,
            player::seek,
            Modifier.weight(1f),
            buffered = player.buffered,
            playing = player.playing && !player.waiting,
            playbackRate = player.playbackRate,
        )
    }
}
