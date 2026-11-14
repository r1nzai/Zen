package dev.rinzai.zen.media

import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import platform.AVFAudio.AVAudioPlayer
import platform.AVFAudio.AVAudioPlayerDelegateProtocol
import platform.AVFAudio.AVAudioSession
import platform.AVFAudio.AVAudioSessionCategoryPlayback
import platform.AVFAudio.setActive
import platform.darwin.NSObject
import platform.Foundation.NSData
import platform.Foundation.create

internal actual fun createAudioEngine(): AudioEngine = AppleEngine()

/** AVAudioPlayer, playing the file from memory. */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
private class AppleEngine : AudioEngine {
    private var player: AVAudioPlayer? = null
    private var volume = 1.0
    private var done = false
    private val delegate = Finished { done = true }

    override suspend fun load(bytes: ByteArray) {
        val data = bytes.usePinned { NSData.create(bytes = it.addressOf(0), length = bytes.size.toULong()) }
        player = AVAudioPlayer(data, null).apply {
            delegate = this@AppleEngine.delegate
            prepareToPlay()
        }
        done = false
        setVolume(volume)
    }

    override fun play() {
        done = false
        // Media, as Safari plays an <audio>: through the silent switch, and the app's on the lock screen's now playing.
        AVAudioSession.sharedInstance().run {
            setCategory(AVAudioSessionCategoryPlayback, null)
            setActive(true, null)
        }
        player?.play()
    }

    override fun pause() {
        player?.pause()
    }

    override fun seek(seconds: Double) {
        done = false
        player?.currentTime = seconds
    }

    override fun setVolume(volume: Double) {
        this.volume = volume
        player?.volume = volume.toFloat()
    }

    override val position get() = player?.currentTime ?: 0.0
    override val duration get() = player?.duration ?: 0.0
    override val finished get() = done

    override fun release() {
        player?.stop()
        player = null
    }
}

private class Finished(private val onFinish: () -> Unit) : NSObject(), AVAudioPlayerDelegateProtocol {
    override fun audioPlayerDidFinishPlaying(player: AVAudioPlayer, successfully: Boolean) = onFinish()
}
