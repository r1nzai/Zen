package dev.rinzai.zen.media

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import kotlinx.coroutines.CancellationException

/**
 * Plays audio and keeps its state for the UI: playing, time, duration, buffered, volume. Give it
 * a source with Audio (as the web library's player plays through an <audio> element); pair it
 * with SeekBar.
 */
@Stable
class MediaPlayer internal constructor() {
    /** Playing, or about to (not paused). */
    var playing by mutableStateOf(false)
        private set

    /** Playing but stalled, waiting for data. */
    var waiting by mutableStateOf(false)
        private set

    var ended by mutableStateOf(false)
        private set

    /** Seconds in. */
    var currentTime by mutableStateOf(0.0)
        private set

    /** Seconds long; 0 until known. */
    var duration by mutableStateOf(0.0)
        private set

    /** Seconds loaded from the start: how far it can play without waiting. */
    var buffered by mutableStateOf(0.0)
        private set

    private var _volume by mutableStateOf(1.0)
    private var _muted by mutableStateOf(false)

    /** 0 to 1. */
    var volume: Double
        get() = _volume
        set(value) {
            _volume = value.coerceIn(0.0, 1.0)
            engine?.setVolume(output)
        }

    var muted: Boolean
        get() = _muted
        set(value) {
            _muted = value
            engine?.setVolume(output)
        }

    private val output get() = if (_muted) 0.0 else _volume

    var playbackRate by mutableStateOf(1.0)
        private set

    /** Why the source can't play, if it can't. */
    var error by mutableStateOf<String?>(null)
        private set

    internal var engine: AudioEngine? = null
        set(value) {
            field = value
            value?.setVolume(output)
        }

    /** How many times it's jumped: where the time doesn't follow on from where it was. */
    internal var seeks by mutableIntStateOf(0)
        private set

    fun play() {
        val e = engine ?: return
        if (ended) seek(0.0)
        e.play()
        playing = true
        ended = false
    }

    fun pause() {
        engine?.pause()
        playing = false
    }

    fun toggle() = if (playing) pause() else play()

    /** Jump to a time, in seconds. */
    fun seek(time: Double) {
        val e = engine ?: return
        val to = time.coerceIn(0.0, if (duration > 0) duration else Double.MAX_VALUE)
        e.seek(to)
        currentTime = to
        seeks++
        if (ended && to < duration) ended = false
    }

    internal fun loaded(e: AudioEngine) {
        duration = e.duration
        buffered = e.duration
        currentTime = 0.0
        ended = false
        error = null
    }

    internal fun failed(message: String) {
        error = message
        playing = false
    }

    /** Polled each frame while playing, as `timeupdate` fires. Returns true when it just ended. */
    internal fun tick(e: AudioEngine, loop: Boolean): Boolean {
        val time = e.position
        if (e.finished) {
            if (loop) {
                e.seek(0.0)
                e.play()
                currentTime = 0.0
                return false
            }
            currentTime = duration
            playing = false
            ended = true
            return true
        }
        currentTime = time
        return false
    }
}

@Composable
fun rememberMediaPlayer(): MediaPlayer = remember { MediaPlayer() }

/** What to play: a whole file's bytes (WAV everywhere; what the platform decodes beyond that). */
class MediaSource(val bytes: ByteArray)

/**
 * The player's source, as an <audio> element is: loads `source` (null: nothing), plays it as soon
 * as it's loaded with `autoPlay`, goes round again with `loop`, and calls `onEnded` at the end.
 */
@Composable
fun Audio(player: MediaPlayer, source: MediaSource?, autoPlay: Boolean = false, loop: Boolean = false, onEnded: () -> Unit = {}) {
    val ended by rememberUpdatedState(onEnded)
    val looping by rememberUpdatedState(loop)
    val engine = remember { createAudioEngine() }
    DisposableEffect(engine) {
        player.engine = engine
        onDispose {
            engine.release()
            if (player.engine === engine) player.engine = null
        }
    }
    LaunchedEffect(source) {
        player.pause()
        if (source == null) return@LaunchedEffect
        try {
            engine.load(source.bytes)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            player.failed(e.message ?: "Can't play this source")
            return@LaunchedEffect
        }
        player.loaded(engine)
        if (autoPlay) player.play()
    }
    LaunchedEffect(player.playing) {
        while (player.playing) {
            withFrameMillis { }
            if (player.tick(engine, looping)) ended()
        }
    }
}

/** The platform's audio output for one source at a time. */
internal interface AudioEngine {
    /** Decodes a whole file; throws when it can't. */
    suspend fun load(bytes: ByteArray)
    fun play()
    fun pause()
    fun seek(seconds: Double)
    fun setVolume(volume: Double)
    val position: Double
    val duration: Double
    val finished: Boolean
    fun release()
}

internal expect fun createAudioEngine(): AudioEngine
