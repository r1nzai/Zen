package dev.rinzai.zen.showcase.examples.seekbar

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.media.Audio
import dev.rinzai.zen.media.MediaSource
import dev.rinzai.zen.media.rememberMediaPlayer
import dev.rinzai.zen.seekbar.SeekBar
import dev.rinzai.zen.seekbar.SeekTimes
import dev.rinzai.zen.showcase.GLASS_AURORA
import dev.rinzai.zen.showcase.demoTrackWav

/** The times under the bar's ends, as on a phone's Now Playing screen. */
@Composable
fun TimesBelow() {
    val player = rememberMediaPlayer()
    Audio(player, remember { MediaSource(demoTrackWav(GLASS_AURORA)) })
    SeekBar(
        player.currentTime,
        player.duration,
        player::seek,
        Modifier.width(320.dp),
        buffered = player.buffered,
        times = SeekTimes.Below,
        playing = player.playing && !player.waiting,
        playbackRate = player.playbackRate,
    )
}
