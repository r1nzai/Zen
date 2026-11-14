package dev.rinzai.zen.media

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asSkiaBitmap
import org.jetbrains.skia.EncodedImageFormat
import org.jetbrains.skia.Image
import org.khronos.webgl.Int8Array
import org.khronos.webgl.toInt8Array

private fun supported(): Boolean = js("'mediaSession' in navigator")

private fun setMetadata(title: String?, artist: String?, album: String?, art: Int8Array?): Unit = js(
    """{
    const old = navigator.mediaSession.metadata?.artwork?.[0]?.src;
    if (old) URL.revokeObjectURL(old);
    const artwork = art ? [{ src: URL.createObjectURL(new Blob([art], { type: 'image/png' })), type: 'image/png' }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({ title: title ?? '', artist: artist ?? '', album: album ?? '', artwork });
}""",
)

private fun clearMetadata(): Unit = js(
    """{
    const old = navigator.mediaSession.metadata?.artwork?.[0]?.src;
    if (old) URL.revokeObjectURL(old);
    navigator.mediaSession.metadata = null;
}""",
)

// Browsers that can't show a position throw.
private fun setState(playing: Boolean, duration: Double, position: Double, rate: Double): Unit = js(
    """{
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    try {
        if (duration > 0) navigator.mediaSession.setPositionState({ duration, position: Math.min(position, duration), playbackRate: rate || 1 });
        else navigator.mediaSession.setPositionState();
    } catch {}
}""",
)

// An action this browser doesn't know throws.
private fun setHandler(action: String, handler: ((Double) -> Unit)?): Unit = js(
    """{
    try {
        navigator.mediaSession.setActionHandler(action, handler ? (d) => handler(d.seekTime ?? NaN) : null);
    } catch {}
}""",
)

private val ACTIONS = listOf("play", "pause", "seekto", "seekbackward", "seekforward", "previoustrack", "nexttrack")

/** navigator.mediaSession, as the web library's useMediaSession sets it. */
private class WebMediaSession : PlatformMediaSession {
    private var duration = 0.0

    override fun metadata(title: String?, artist: String?, album: String?, artwork: ImageBitmap?, duration: Double) {
        this.duration = duration
        val png = artwork?.let { Image.makeFromBitmap(it.asSkiaBitmap()).encodeToData(EncodedImageFormat.PNG)?.bytes?.toInt8Array() }
        setMetadata(title, artist, album, png)
    }

    override fun state(playing: Boolean, position: Double, rate: Double) = setState(playing, duration, position, rate)

    override fun actions(actions: MediaActions) {
        setHandler("play") { actions.play() }
        setHandler("pause") { actions.pause() }
        setHandler("seekto") { if (!it.isNaN()) actions.seekTo(it) }
        setHandler("seekbackward") { actions.seekBy(false) }
        setHandler("seekforward") { actions.seekBy(true) }
        setHandler("previoustrack", actions.previous?.let { p -> { _: Double -> p() } })
        setHandler("nexttrack", actions.next?.let { n -> { _: Double -> n() } })
    }

    fun release() {
        for (action in ACTIONS) setHandler(action, null)
        clearMetadata()
    }
}

@Composable
internal actual fun rememberPlatformMediaSession(): PlatformMediaSession? {
    if (!remember { supported() }) return null
    val session = remember { WebMediaSession() }
    DisposableEffect(session) { onDispose { session.release() } }
    return session
}
