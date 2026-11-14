package dev.rinzai.zen.media

import android.media.AudioAttributes
import android.media.MediaDataSource
import android.media.MediaPlayer as AndroidPlayer

internal actual fun createAudioEngine(): AudioEngine = AndroidEngine()

/** android.media.MediaPlayer, reading the file from memory. */
private class AndroidEngine : AudioEngine {
    private var player: AndroidPlayer? = null
    private var done = false
    private var volume = 1.0

    override suspend fun load(bytes: ByteArray) {
        release()
        done = false
        player = AndroidPlayer().apply {
            setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            setDataSource(BytesSource(bytes))
            setOnCompletionListener { done = true }
            prepare()
        }
        setVolume(volume)
    }

    override fun play() {
        done = false
        player?.start()
    }

    override fun pause() {
        player?.takeIf { it.isPlaying }?.pause()
    }

    override fun seek(seconds: Double) {
        done = false
        player?.seekTo((seconds * 1000).toLong(), AndroidPlayer.SEEK_CLOSEST)
    }

    override fun setVolume(volume: Double) {
        this.volume = volume
        player?.setVolume(volume.toFloat(), volume.toFloat())
    }

    override val position get() = (player?.currentPosition ?: 0) / 1000.0
    override val duration get() = (player?.duration ?: 0) / 1000.0
    override val finished get() = done

    override fun release() {
        player?.release()
        player = null
    }
}

private class BytesSource(private val bytes: ByteArray) : MediaDataSource() {
    override fun readAt(position: Long, buffer: ByteArray, offset: Int, size: Int): Int {
        if (position >= bytes.size) return -1
        val n = minOf(size, bytes.size - position.toInt())
        System.arraycopy(bytes, position.toInt(), buffer, offset, n)
        return n
    }

    override fun getSize() = bytes.size.toLong()
    override fun close() {}
}
