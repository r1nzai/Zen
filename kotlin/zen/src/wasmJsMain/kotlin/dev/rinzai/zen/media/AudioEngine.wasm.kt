package dev.rinzai.zen.media

import kotlinx.coroutines.suspendCancellableCoroutine
import org.khronos.webgl.toInt8Array
import org.w3c.dom.HTMLAudioElement
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

internal actual fun createAudioEngine(): AudioEngine = ElementEngine()

private fun audioOf(bytes: org.khronos.webgl.Int8Array): HTMLAudioElement =
    js("new Audio(URL.createObjectURL(new Blob([bytes])))")

private fun whenLoaded(audio: HTMLAudioElement, done: (Boolean) -> Unit): Unit = js(
    """{
    audio.addEventListener('loadedmetadata', () => done(true), { once: true });
    audio.addEventListener('error', () => done(false), { once: true });
}""",
)

private fun play(audio: HTMLAudioElement): Unit = js("audio.play().catch(() => {})")

private fun release(audio: HTMLAudioElement): Unit = js(
    """{
    audio.pause();
    URL.revokeObjectURL(audio.src);
    audio.removeAttribute('src');
    audio.load();
}""",
)

/** An <audio> element, as the web library's player plays through: the browser decodes and plays the file. */
private class ElementEngine : AudioEngine {
    private var audio: HTMLAudioElement? = null
    private var volume = 1.0

    override suspend fun load(bytes: ByteArray) {
        release()
        val a = audioOf(bytes.toInt8Array())
        a.preload = "auto"
        a.volume = volume
        audio = a
        suspendCancellableCoroutine { going ->
            whenLoaded(a) { ok -> if (ok) going.resume(Unit) else going.resumeWithException(IllegalStateException("Can't play this source")) }
        }
    }

    override fun play() {
        audio?.let(::play)
    }

    override fun pause() {
        audio?.pause()
    }

    override fun seek(seconds: Double) {
        audio?.currentTime = seconds
    }

    override fun setVolume(volume: Double) {
        this.volume = volume
        audio?.volume = volume
    }

    override val position get() = audio?.currentTime ?: 0.0
    override val duration get() = audio?.duration?.takeIf { it.isFinite() } ?: 0.0
    override val finished get() = audio?.ended == true

    override fun release() {
        audio?.let(::release)
        audio = null
    }
}
