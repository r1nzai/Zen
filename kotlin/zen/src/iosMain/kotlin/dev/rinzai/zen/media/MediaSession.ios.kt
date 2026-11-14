package dev.rinzai.zen.media

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asSkiaBitmap
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import org.jetbrains.skia.EncodedImageFormat
import org.jetbrains.skia.Image
import platform.CoreGraphics.CGSizeMake
import platform.Foundation.NSData
import platform.Foundation.NSNumber
import platform.Foundation.create
import platform.MediaPlayer.MPChangePlaybackPositionCommandEvent
import platform.MediaPlayer.MPMediaItemArtwork
import platform.MediaPlayer.MPMediaItemPropertyAlbumTitle
import platform.MediaPlayer.MPMediaItemPropertyArtist
import platform.MediaPlayer.MPMediaItemPropertyArtwork
import platform.MediaPlayer.MPMediaItemPropertyPlaybackDuration
import platform.MediaPlayer.MPMediaItemPropertyTitle
import platform.MediaPlayer.MPNowPlayingInfoCenter
import platform.MediaPlayer.MPNowPlayingInfoPropertyElapsedPlaybackTime
import platform.MediaPlayer.MPNowPlayingInfoPropertyPlaybackRate
import platform.MediaPlayer.MPRemoteCommand
import platform.MediaPlayer.MPRemoteCommandCenter
import platform.MediaPlayer.MPRemoteCommandEvent
import platform.MediaPlayer.MPRemoteCommandHandlerStatus
import platform.MediaPlayer.MPRemoteCommandHandlerStatusCommandFailed
import platform.MediaPlayer.MPRemoteCommandHandlerStatusSuccess
import platform.UIKit.UIImage

@Composable
internal actual fun rememberPlatformMediaSession(): PlatformMediaSession? {
    val session = remember { AppleMediaSession() }
    DisposableEffect(session) { onDispose { session.release() } }
    return session
}

/** The lock screen's and Control Centre's now playing, and the remote commands (headphones, the controls there). */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
private class AppleMediaSession : PlatformMediaSession {
    private val center = MPNowPlayingInfoCenter.defaultCenter()
    private val commands = MPRemoteCommandCenter.sharedCommandCenter()
    private var info = mapOf<Any?, Any?>()
    private var targets = listOf<Pair<MPRemoteCommand, Any>>()

    override fun metadata(title: String?, artist: String?, album: String?, artwork: ImageBitmap?, duration: Double) {
        val image = artwork?.let(::uiImage)
        info = info - listOf(MPMediaItemPropertyTitle, MPMediaItemPropertyArtist, MPMediaItemPropertyAlbumTitle, MPMediaItemPropertyArtwork, MPMediaItemPropertyPlaybackDuration) + listOfNotNull(
            title?.let { MPMediaItemPropertyTitle to it },
            artist?.let { MPMediaItemPropertyArtist to it },
            album?.let { MPMediaItemPropertyAlbumTitle to it },
            image?.let { MPMediaItemPropertyArtwork to MPMediaItemArtwork(boundsSize = CGSizeMake(512.0, 512.0)) { _ -> it } },
            if (duration > 0) MPMediaItemPropertyPlaybackDuration to NSNumber(double = duration) else null,
        )
        center.nowPlayingInfo = info
    }

    override fun state(playing: Boolean, position: Double, rate: Double) {
        info = info + mapOf(
            MPNowPlayingInfoPropertyElapsedPlaybackTime to NSNumber(double = position),
            MPNowPlayingInfoPropertyPlaybackRate to NSNumber(double = if (playing) rate else 0.0),
        )
        center.nowPlayingInfo = info
    }

    override fun actions(actions: MediaActions) {
        clear()
        fun on(command: MPRemoteCommand, run: (MPRemoteCommandEvent?) -> Boolean) {
            command.enabled = true
            targets += command to command.addTargetWithHandler { e -> status(run(e)) }
        }
        on(commands.playCommand) { actions.play(); true }
        on(commands.pauseCommand) { actions.pause(); true }
        on(commands.changePlaybackPositionCommand) { e ->
            (e as? MPChangePlaybackPositionCommandEvent)?.let { actions.seekTo(it.positionTime) } != null
        }
        on(commands.skipBackwardCommand) { actions.seekBy(false); true }
        on(commands.skipForwardCommand) { actions.seekBy(true); true }
        actions.previous?.let { p -> on(commands.previousTrackCommand) { p(); true } }
        actions.next?.let { n -> on(commands.nextTrackCommand) { n(); true } }
        commands.previousTrackCommand.enabled = actions.previous != null
        commands.nextTrackCommand.enabled = actions.next != null
    }

    private fun status(ok: Boolean): MPRemoteCommandHandlerStatus =
        if (ok) MPRemoteCommandHandlerStatusSuccess else MPRemoteCommandHandlerStatusCommandFailed

    private fun clear() {
        for ((command, target) in targets) command.removeTarget(target)
        targets = emptyList()
    }

    fun release() {
        clear()
        center.nowPlayingInfo = null
    }
}

@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
private fun uiImage(bitmap: ImageBitmap): UIImage? {
    val png = Image.makeFromBitmap(bitmap.asSkiaBitmap()).encodeToData(EncodedImageFormat.PNG)?.bytes ?: return null
    val data = png.usePinned { NSData.create(bytes = it.addressOf(0), length = png.size.toULong()) }
    return UIImage.imageWithData(data)
}
