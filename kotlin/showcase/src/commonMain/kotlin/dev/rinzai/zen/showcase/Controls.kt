package dev.rinzai.zen.showcase

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.radii
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.marquee.Marquee
import dev.rinzai.zen.marquee.MarqueeTrigger
import dev.rinzai.zen.playerbar.PlayerBar
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.seekbar.SeekBar
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.slider.SliderSize
import kotlin.math.roundToInt

@Composable
internal fun NowPlayingBar(controls: Controls, liked: Set<String>, like: (String) -> Unit, onOpen: () -> Unit) {
    val t = Zen.tokens
    val page = LocalPage.current
    val md = page.atLeast(Breakpoint.Md)
    val player = controls.player
    val queue = controls.queue
    val track = queue.track
    PlayerBar(
        label = "Now playing",
        gap = if (md) 24.dp else 16.dp,
        overlay = {
            if (!md) {
                val p = if (player.duration > 0) (player.currentTime / player.duration).toFloat() else 0f
                Box(
                    Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth(p)
                        .height(2.dp)
                        .box(RectangleShape, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(blur = 8f, color = t.glow.color(0.8f * t.glowK)))),
                )
            }
        },
    ) {
        Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val source = remember { MutableInteractionSource() }
            val state = rememberControlState(source)
            Row(
                Modifier
                    .weight(1f, fill = false)
                    .box(Zen.radii.lg, shadows = focusRing(state.focusVisible))
                    .control(state, role = Role.Button, onClick = onOpen)
                    .semantics { contentDescription = "${track.title}, ${track.album.artist}. Open now playing" },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Cover(track.album.colors, Zen.radii.lg, Modifier.size(if (md) 48.dp else 40.dp))
                Column(Modifier.weight(1f, fill = false)) {
                    Marquee(track.title, style = TextStyles.sm.merge(TextStyles.medium), trigger = MarqueeTrigger.Always)
                    Marquee(track.album.artist, style = TextStyles.xs, color = t.mutedForeground.color(), trigger = MarqueeTrigger.Always)
                }
            }
            if (md) LikeButton(track.id in liked, onClick = { like(track.id) })
        }
        if (!md) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                PlayButton(controls, ButtonVariant.Ghost, ButtonSize.Icon)
                Button(onClick = queue::next, variant = ButtonVariant.Ghost, size = ButtonSize.Icon, label = "Next", enabled = queue.hasNext) {
                    Icon(Icons.Forward, size = 20.dp)
                }
            }
        } else {
            Column(Modifier.weight(2f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Transport(controls)
                SeekBar(player.currentTime, player.duration, player::seek, Modifier.widthIn(max = 576.dp).fillMaxWidth(), buffered = player.buffered)
            }
            Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.End)) {
                UpNext(queue)
                Volume(controls)
            }
        }
    }
}

@Composable
internal fun PlayButton(controls: Controls, variant: ButtonVariant, size: ButtonSize, modifier: Modifier = Modifier, side: androidx.compose.ui.unit.Dp? = null, icon: androidx.compose.ui.unit.Dp = 20.dp) {
    val player = controls.player
    val queue = controls.queue
    Button(
        onClick = { if (queue.started) player.toggle() else queue.playList(TRACKS.map { it.id }, queue.track.id) },
        modifier = modifier,
        variant = variant,
        size = size,
        side = side,
        shape = if (variant == ButtonVariant.Default) CircleShape else Zen.radii.lg,
        label = if (player.playing) "Pause" else "Play",
        enabled = controls.source != null,
    ) {
        Icon(if (player.playing) Icons.Pause else Icons.Play, size = icon)
    }
}

/** Shuffle, previous, play, next and repeat. */
@Composable
internal fun Transport(controls: Controls, large: Boolean = false) {
    val t = Zen.tokens
    val queue = controls.queue
    val small = if (large) ButtonSize.Icon else ButtonSize.IconSm
    val icon = if (large) 24.dp else 16.dp
    val on = t.primary.color()
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(if (large) 16.dp else 8.dp)) {
        Button(queue::toggleShuffle, variant = ButtonVariant.Ghost, size = small, label = "Shuffle", pressed = queue.shuffle, color = on.takeIf { queue.shuffle }) {
            Icon(Icons.ArrowsRightLeft, size = icon)
        }
        Button(controls.previous, variant = ButtonVariant.Ghost, size = small, label = "Previous") { Icon(Icons.Backward, size = icon) }
        PlayButton(controls, ButtonVariant.Default, if (large) ButtonSize.IconLg else ButtonSize.Icon, side = if (large) 64.dp else null, icon = if (large) 28.dp else 20.dp)
        Button(queue::next, variant = ButtonVariant.Ghost, size = small, label = "Next", enabled = queue.hasNext) { Icon(Icons.Forward, size = icon) }
        val repeating = queue.repeat != Repeat.Off
        Box {
            Button(
                queue::cycleRepeat,
                variant = ButtonVariant.Ghost,
                size = small,
                label = if (queue.repeat == Repeat.One) "Repeat one" else "Repeat",
                pressed = repeating,
                color = on.takeIf { repeating },
            ) {
                Icon(Icons.ArrowPath, size = icon)
            }
            if (queue.repeat == Repeat.One) {
                Text("1", Modifier.align(Alignment.TopEnd).padding(top = 2.dp, end = 2.dp), style = TextStyles.bold.copy(fontSize = androidx.compose.ui.unit.TextUnit(9.6f, androidx.compose.ui.unit.TextUnitType.Sp)), color = on)
            }
        }
    }
}

@Composable
internal fun LikeButton(liked: Boolean, onClick: () -> Unit, label: String? = null) {
    Button(
        onClick,
        variant = ButtonVariant.Ghost,
        size = ButtonSize.IconSm,
        label = if (label != null) "Like $label" else "Like",
        pressed = liked,
        color = if (liked) Zen.tokens.primary.color() else null,
    ) {
        Icon(if (liked) Icons.HeartSolid else Icons.Heart)
    }
}

@Composable
private fun Volume(controls: Controls) {
    val player = controls.player
    Button({ player.muted = !player.muted }, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = if (player.muted) "Unmute" else "Mute") {
        Icon(if (player.muted) Icons.SpeakerXMark else Icons.SpeakerWave)
    }
    Slider(
        value = if (player.muted) 0f else (player.volume * 100).roundToInt().toFloat(),
        onValueChange = { v ->
            player.volume = v / 100.0
            if (v > 0 && player.muted) player.muted = false
        },
        modifier = Modifier.width(96.dp),
        size = SliderSize.Sm,
        label = "Volume",
    )
}
