package dev.rinzai.zen.media

import java.io.ByteArrayInputStream
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.Clip
import javax.sound.sampled.FloatControl
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min

internal actual fun createAudioEngine(): AudioEngine = ClipEngine()

/**
 * javax.sound's Clip: the whole file decoded into memory, played by the system mixer. With no
 * output device the time still runs, silently, as a browser plays to no sink.
 */
private class ClipEngine : AudioEngine {
    private var clip: Clip? = null
    private var volume = 1.0
    private var length = 0.0

    // The silent clock, when there's no clip.
    private var from = 0.0
    private var since: Long? = null

    override suspend fun load(bytes: ByteArray) {
        release()
        val stream = AudioSystem.getAudioInputStream(ByteArrayInputStream(bytes))
        length = stream.frameLength / stream.format.frameRate.toDouble()
        from = 0.0
        since = null
        clip = runCatching { AudioSystem.getClip().apply { open(stream) } }.getOrNull()
        setVolume(volume)
    }

    override fun play() {
        val c = clip
        if (c != null) c.start() else if (since == null) since = System.nanoTime()
    }

    override fun pause() {
        val c = clip
        if (c != null) c.stop() else {
            from = position
            since = null
        }
    }

    override fun seek(seconds: Double) {
        val c = clip
        if (c != null) c.microsecondPosition = (seconds * 1e6).toLong() else {
            from = seconds
            if (since != null) since = System.nanoTime()
        }
    }

    override fun setVolume(volume: Double) {
        this.volume = volume
        val gain = clip?.takeIf { it.isControlSupported(FloatControl.Type.MASTER_GAIN) }?.getControl(FloatControl.Type.MASTER_GAIN) as? FloatControl ?: return
        // An <audio> element's volume is linear amplitude; the mixer's gain is in decibels.
        gain.value = if (volume <= 0.0) gain.minimum else max(gain.minimum.toDouble(), 20 * log10(volume)).toFloat()
    }

    override val position: Double
        get() = clip?.let { it.microsecondPosition / 1e6 } ?: min(length, from + (since?.let { (System.nanoTime() - it) / 1e9 } ?: 0.0))
    override val duration get() = length
    override val finished get() = clip?.let { !it.isRunning && it.framePosition >= it.frameLength } ?: (since != null && position >= length)

    override fun release() {
        clip?.close()
        clip = null
    }
}
