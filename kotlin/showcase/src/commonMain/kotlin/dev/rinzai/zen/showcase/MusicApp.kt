package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.radii
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.frame
import dev.rinzai.zen.HostWindow
import dev.rinzai.zen.ZenTheme
import dev.rinzai.zen.avatar.Avatar
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.header.Header
import dev.rinzai.zen.toast.ToastProvider
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.media.Audio
import dev.rinzai.zen.media.MediaPlayer
import dev.rinzai.zen.media.MediaSession
import dev.rinzai.zen.media.MediaSource
import dev.rinzai.zen.media.rememberMediaPlayer
import dev.rinzai.zen.rise
import dev.rinzai.zen.showcase.resources.Res
import dev.rinzai.zen.tabbar.TabBar
import dev.rinzai.zen.tabbar.TabBarItem
import dev.rinzai.zen.textAurora
import dev.rinzai.zen.themetoggle.ThemeToggle
import dev.rinzai.zen.formatDuration

/** The music showcase as an app: Zen's theme and backdrop around MusicApp. */
@Composable
fun MusicShowcase(appearance: Appearance = Appearance.Dark, nav: Boolean = true, host: HostWindow? = null) {
    ZenTheme(appearance, host = host) {
        Backdrop(Topo)
        // Inside a ToastProvider, as an app is (the web showcase's Storybook and docs wrap it in one).
        ToastProvider { MusicApp(nav) }
    }
}

internal val TABS = listOf("Home" to Icons.Squares, "Search" to Icons.Search, "Library" to Icons.MusicalNote)

/** `nav = false` drops the app's own top bar and tab bar, for pages that already have one. */
@Composable
fun MusicApp(nav: Boolean = true) {
    val page = LocalPage.current
    val queue = remember { Queue() }
    val track = queue.track
    val source = remember(track.sound) { MediaSource(demoTrackWav(track.sound)) }
    val player = rememberMediaPlayer()
    var liked by remember { mutableStateOf(setOf("glass-aurora", "low-tide")) }
    var nowPlaying by remember { mutableStateOf(false) }
    val like = { id: String -> liked = if (id in liked) liked - id else liked + id }

    // Back to the start of the track, or to the one before when near it.
    val previous = { if (player.currentTime > 3) player.seek(0.0) else queue.previous() }
    val play = { ids: List<String>, start: String? ->
        val at = start ?: ids.first()
        if (start == track.id && queue.started) player.toggle()
        else {
            queue.playList(ids, at)
            // The track already loaded doesn't load again, so autoPlay won't start it.
            if (at == track.id) player.play()
        }
    }
    val controls = Controls(player, queue, previous, source)

    Audio(player, source, autoPlay = queue.started, loop = queue.repeat == Repeat.One, onEnded = queue::ended)
    MediaSession(
        player,
        title = track.title,
        artist = track.album.artist,
        album = track.album.title,
        artwork = coverArt(track.album.colors),
        onPrevious = previous,
        onNext = if (queue.hasNext) queue::next else null,
    )
    if (nav) {
        Header {
            Text("Zen Music", style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ThemeToggle()
                Avatar("Rin", size = 32.dp, textStyle = TextStyles.xs)
            }
        }
    }
    Rail()
    val md = page.atLeast(Breakpoint.Md)
    Column(
        Modifier
            .fillMaxWidth()
            .wrapContentWidth()
            .widthIn(max = 1152.dp)
            .fillMaxWidth()
            .rise(0)
            .padding(
                start = if (md) 96.dp else 24.dp,
                end = if (md) 40.dp else 24.dp,
                top = if (md) 40.dp else 24.dp,
                bottom = Zen.frame.tabBarHeight + Zen.frame.playerBarHeight + 40.dp,
            ),
        verticalArrangement = Arrangement.spacedBy(40.dp),
    ) {
        Featured(
            AURORA,
            playing = player.playing && track.album == AURORA,
            onPlay = { ids -> if (queue.started && track.album == AURORA) player.toggle() else play(ids, null) },
        )
        Mixes(onPlay = { mix -> play(mix.tracks, null) })
        Tracks(
            current = track,
            playing = player.playing,
            liked = liked,
            onLike = like,
            onPlay = { id, ids -> play(ids, id) },
            onPlayNext = queue::playNext,
        )
    }
    NowPlayingBar(controls, liked, like, onOpen = { nowPlaying = true })
    NowPlaying(nowPlaying, { nowPlaying = it }, controls, liked, like)
    if (nav) {
        TabBar(label = "Main") {
            TABS.forEachIndexed { i, (label, icon) -> TabBarItem(label, icon, onClick = {}, active = i == 0) }
        }
    }
}

internal class Controls(val player: MediaPlayer, val queue: Queue, val previous: () -> Unit, val source: MediaSource?)

@Composable
private fun Featured(album: Album, playing: Boolean, onPlay: (List<String>) -> Unit, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    val page = LocalPage.current
    val tracks = TRACKS.filter { it.album == album }
    val length = tracks.sumOf { it.sound.seconds }
    val cover = @Composable { m: Modifier ->
        Cover(
            album.colors,
            Zen.radii.xl2,
            m.widthIn(max = 224.dp).fillMaxWidth().aspectRatio(1f),
            shadows = listOf(Shadow(y = 24f, blur = 64f, spread = -16f, color = t.glow.color(0.7f * t.glowK))),
        )
    }
    val lg = page.atLeast(Breakpoint.Lg)
    val heading = if (lg) TextStyles.xl5 else TextStyles.xl4
    val text = @Composable {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("New album · ${album.year}", style = TextStyles.sm, color = t.mutedForeground.color())
            Text(album.title, style = heading.merge(TextStyles.semibold).merge(TextStyles.tight), brush = textAurora(heading.fontSize))
            Text("${album.artist} · ${tracks.size} tracks, ${formatDuration(length)}", color = t.mutedForeground.color())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { onPlay(tracks.map { it.id }) }, shape = CircleShape) {
                    Icon(if (playing) Icons.Pause else Icons.Play)
                    Text(if (playing) "Pause" else "Play")
                }
            }
        }
    }
    if (page.atLeast(Breakpoint.Sm)) {
        Row(modifier, horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.Bottom) {
            cover(Modifier)
            text()
        }
    } else {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(24.dp)) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { cover(Modifier) }
            text()
        }
    }
}
