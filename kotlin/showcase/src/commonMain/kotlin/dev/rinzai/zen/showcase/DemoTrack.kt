package dev.rinzai.zen.showcase

import androidx.compose.runtime.Immutable
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin

// The showcase's tracks: chords and an arpeggio, synthesized on the device so the app needs no
// audio files. Your player takes any source instead.

private const val RATE = 22050

/** MIDI notes, three to a chord; `rounds` times through the chords. */
@Immutable
data class DemoTrack(val chords: List<List<Int>>, val chordSeconds: Double, val rounds: Int) {
    val seconds: Double get() = chordSeconds * chords.size * rounds
}

val GLASS_AURORA = DemoTrack(
    listOf(
        listOf(57, 60, 64), // A minor
        listOf(53, 57, 60), // F
        listOf(48, 52, 55), // C
        listOf(55, 59, 62), // G
    ),
    2.5,
    2,
)

private fun hz(note: Int) = 440.0 * 2.0.pow((note - 69) / 12.0)

private fun synthesize(track: DemoTrack): FloatArray {
    val chordSeconds = track.chordSeconds
    val length = (RATE * track.seconds).roundToInt()
    val samples = FloatArray(length)
    val chordLength = RATE * chordSeconds
    val beat = chordSeconds / 8
    for (i in 0 until length) {
        val chord = track.chords[floor(i / chordLength).toInt() % track.chords.size]
        val t = i.toDouble() / RATE
        val inChord = (i % chordLength) / RATE
        // A soft pad, swelling in and out with each chord.
        val swell = min(inChord / 0.4, 1.0) * min((chordSeconds - inChord) / 0.6, 1.0)
        var pad = 0.0
        for (note in chord) pad += sin(2 * PI * hz(note) * t) + 0.5 * sin(2 * PI * hz(note) * 1.003 * t)
        // An arpeggio over it, an octave up: eighth notes that ring and fade.
        val step = floor(inChord / beat).toInt()
        val sinceStep = inChord - step * beat
        val pluck = sin(2 * PI * hz(chord[step % 3] + 12) * t) * exp(-sinceStep * 6)
        samples[i] = (0.09 * swell * pad + 0.2 * pluck).toFloat()
    }
    return samples
}

/** 16-bit mono PCM WAV. */
private fun wav(samples: FloatArray): ByteArray {
    val out = ByteArray(44 + samples.size * 2)
    fun text(at: Int, s: String) = s.forEachIndexed { i, c -> out[at + i] = c.code.toByte() }
    fun u32(at: Int, v: Int) = repeat(4) { out[at + it] = (v ushr (8 * it)).toByte() }
    fun u16(at: Int, v: Int) = repeat(2) { out[at + it] = (v ushr (8 * it)).toByte() }
    text(0, "RIFF")
    u32(4, 36 + samples.size * 2)
    text(8, "WAVEfmt ")
    u32(16, 16)
    u16(20, 1) // PCM
    u16(22, 1) // mono
    u32(24, RATE)
    u32(28, RATE * 2)
    u16(32, 2)
    u16(34, 16)
    text(36, "data")
    u32(40, samples.size * 2)
    samples.forEachIndexed { i, s -> u16(44 + i * 2, (s.coerceIn(-1f, 1f) * 0x7fff).toInt()) }
    return out
}

private val made = mutableMapOf<DemoTrack, ByteArray>()

/** The track as a WAV file, made once. */
fun demoTrackWav(track: DemoTrack): ByteArray = made.getOrPut(track) { wav(synthesize(track)) }
