package dev.rinzai.zen.showcase.examples.playerbar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Frame
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.inOklab
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.media.Audio
import dev.rinzai.zen.media.MediaSession
import dev.rinzai.zen.media.MediaSource
import dev.rinzai.zen.media.rememberMediaPlayer
import dev.rinzai.zen.playerbar.PlayerBar
import dev.rinzai.zen.radii
import dev.rinzai.zen.seekbar.SeekBar
import dev.rinzai.zen.showcase.GLASS_AURORA
import dev.rinzai.zen.showcase.demoTrackWav
import dev.rinzai.zen.slider.Slider
import kotlin.math.roundToInt

/** Tailwind's fuchsia-400, the cover's far corner. */
internal val Fuchsia400 = Oklch(0.74f, 0.238f, 322.16f)

/** The demo cover: a gradient from the accent to fuchsia. */
@Composable
internal fun Cover(modifier: Modifier) = androidx.compose.foundation.layout.Box(
    modifier.box(Zen.radii.lg, fill = linearGradient(135f, *inOklab(0f to Zen.tokens.primary.color(), 1f to Fuchsia400.color()))),
)

/**
 * Your own audio, driven by a MediaPlayer: the cover and title, the controls over a SeekBar, and
 * the volume. MediaSession puts it on the lock screen and the media keys. Fixed to the bottom of
 * its frame; here a Frame stands in for the screen.
 */
@Composable
fun Default() {
    val t = Zen.tokens
    val player = rememberMediaPlayer()
    Audio(player, remember { MediaSource(demoTrackWav(GLASS_AURORA)) })
    MediaSession(player, title = "Glass Aurora", artist = "Zen")
    val shape = RoundedCornerShape(16.dp)
    Frame(
        Modifier
            .fillMaxWidth()
            .height(192.dp)
            .clip(shape)
            .box(shape, border = SolidColor(t.tint.color(0.1f))),
    ) {
        PlayerBar(label = "Now playing", shape = RoundedCornerShape(bottomStart = 15.dp, bottomEnd = 15.dp)) {
            Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Cover(Modifier.size(44.dp))
                Column(Modifier.weight(1f, fill = false)) {
                    Text("Glass Aurora", style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Zen", style = TextStyles.xs, color = t.mutedForeground.color(), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Column(Modifier.weight(2f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Button({ player.seek(0.0) }, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Restart") {
                        Icon(Icons.Backward, size = 16.dp)
                    }
                    Button({ player.toggle() }, size = ButtonSize.Icon, shape = CircleShape, label = if (player.playing) "Pause" else "Play") {
                        Icon(if (player.playing) Icons.Pause else Icons.Play, size = 20.dp)
                    }
                }
                SeekBar(
                    player.currentTime,
                    player.duration,
                    player::seek,
                    Modifier.fillMaxWidth(),
                    buffered = player.buffered,
                    playing = player.playing && !player.waiting,
                    playbackRate = player.playbackRate,
                )
            }
            if (Zen.page.atLeast(Breakpoint.Sm)) {
                Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalAlignment = Alignment.CenterVertically) {
                    Button({ player.muted = !player.muted }, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = if (player.muted) "Unmute" else "Mute") {
                        Icon(if (player.muted) Icons.SpeakerXMark else Icons.SpeakerWave, size = 16.dp)
                    }
                    Slider(
                        if (player.muted) 0f else (player.volume * 100).roundToInt().toFloat(),
                        { v ->
                            player.volume = v / 100.0
                            if (v > 0 && player.muted) player.muted = false
                        },
                        Modifier.width(96.dp),
                        label = "Volume",
                    )
                }
            }
        }
    }
}
