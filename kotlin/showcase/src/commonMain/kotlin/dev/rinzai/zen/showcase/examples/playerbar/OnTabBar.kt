package dev.rinzai.zen.showcase.examples.playerbar

import dev.rinzai.zen.ScrollArea
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Frame
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.frame
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.media.Audio
import dev.rinzai.zen.media.MediaSource
import dev.rinzai.zen.media.rememberMediaPlayer
import dev.rinzai.zen.playerbar.PlayerBar
import dev.rinzai.zen.radii
import dev.rinzai.zen.showcase.GLASS_AURORA
import dev.rinzai.zen.showcase.demoTrackWav
import dev.rinzai.zen.tabbar.TabBar
import dev.rinzai.zen.tabbar.TabBarItem

/**
 * On a phone, it sits on the TabBar beside it, and the page pads its end by both bars' heights
 * (Zen.frame.tabBarHeight and playerBarHeight).
 */
@Composable
fun OnTabBar() {
    val t = Zen.tokens
    val player = rememberMediaPlayer()
    Audio(player, remember { MediaSource(demoTrackWav(GLASS_AURORA)) })
    val progress = if (player.duration > 0) (player.currentTime / player.duration).toFloat() else 0f
    val shape = RoundedCornerShape(16.dp)
    Frame(
        Modifier
            .size(320.dp, 384.dp)
            .clip(shape)
            .box(shape, border = SolidColor(t.tint.color(0.1f))),
    ) {
        ScrollArea(Modifier.fillMaxHeight(), vertical = rememberScrollState()) { Column(
            Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = Zen.frame.tabBarHeight + Zen.frame.playerBarHeight),
        ) { Text("Home", style = TextStyles.sm, color = t.mutedForeground.color()) }}
        PlayerBar(
            label = "Now playing",
            gap = 12.dp,
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
            overlay = {
                Box(
                    Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth(progress)
                        .height(2.dp)
                        .box(RectangleShape, fill = SolidColor(t.primary.color()), shadows = listOf(Shadow(blur = 8f, color = t.glow.color(0.8f * t.glowK)))),
                )
            },
        ) {
            Box(Modifier.size(36.dp).box(Zen.radii.md, fill = dev.rinzai.zen.linearGradient(135f, *dev.rinzai.zen.inOklab(0f to t.primary.color(), 1f to Fuchsia400.color()))))
            Column(Modifier.weight(1f)) {
                Text("Glass Aurora", style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("Zen", style = TextStyles.xs, color = t.mutedForeground.color(), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Button({ player.toggle() }, variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = if (player.playing) "Pause" else "Play") {
                Icon(if (player.playing) Icons.Pause else Icons.Play, size = 20.dp)
            }
        }
        TabBar(label = "Main", hideFrom = null, shape = RoundedCornerShape(bottomStart = 15.dp, bottomEnd = 15.dp)) {
            TabBarItem("Home", Icons.Squares, onClick = {}, active = true)
            TabBarItem("Search", Icons.Search, onClick = {})
            TabBarItem("Library", Icons.ListBullet, onClick = {})
        }
    }
}
