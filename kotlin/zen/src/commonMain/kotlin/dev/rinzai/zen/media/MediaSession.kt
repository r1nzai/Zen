package dev.rinzai.zen.media

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.graphics.ImageBitmap

/**
 * Puts what's playing on the lock screen, the notification shade and the OS media controls (title,
 * artist, cover, position), and makes play, pause, seek, previous, next and the media keys control
 * `player`. `onPrevious` and `onNext` show those buttons; the skip buttons move `seekOffset`
 * seconds. Does nothing where the platform gives an app no way in (the desktop, for now).
 */
@Composable
fun MediaSession(
    player: MediaPlayer,
    title: String? = null,
    artist: String? = null,
    album: String? = null,
    artwork: ImageBitmap? = null,
    onPrevious: (() -> Unit)? = null,
    onNext: (() -> Unit)? = null,
    seekOffset: Double = 10.0,
) {
    val session = rememberPlatformMediaSession() ?: return
    val previous by rememberUpdatedState(onPrevious)
    val next by rememberUpdatedState(onNext)
    val offset by rememberUpdatedState(seekOffset)
    LaunchedEffect(session, title, artist, album, artwork, player.duration) {
        session.metadata(title, artist, album, artwork, player.duration)
    }
    // Where it is only when that jumps: the OS carries the time on from there at the rate.
    LaunchedEffect(session, player.playing, player.duration, player.playbackRate, player.seeks) {
        session.state(player.playing, player.currentTime, player.playbackRate)
    }
    val hasPrevious = onPrevious != null
    val hasNext = onNext != null
    val actions = remember(player, hasPrevious, hasNext) {
        MediaActions(
            play = player::play,
            pause = player::pause,
            seekTo = player::seek,
            seekBy = { forward -> player.seek(player.currentTime + if (forward) offset else -offset) },
            previous = if (hasPrevious) ({ previous?.invoke() }) else null,
            next = if (hasNext) ({ next?.invoke() }) else null,
        )
    }
    LaunchedEffect(session, actions) { session.actions(actions) }
}

/** What the OS's controls do to the player. */
internal class MediaActions(
    val play: () -> Unit,
    val pause: () -> Unit,
    val seekTo: (Double) -> Unit,
    val seekBy: (forward: Boolean) -> Unit,
    val previous: (() -> Unit)?,
    val next: (() -> Unit)?,
)

/** The OS's now-playing session, for as long as it's composed. */
internal interface PlatformMediaSession {
    fun metadata(title: String?, artist: String?, album: String?, artwork: ImageBitmap?, duration: Double)
    fun state(playing: Boolean, position: Double, rate: Double)
    fun actions(actions: MediaActions)
}

/** The platform's session, released when it leaves the composition; null where there's none. */
@Composable
internal expect fun rememberPlatformMediaSession(): PlatformMediaSession?
