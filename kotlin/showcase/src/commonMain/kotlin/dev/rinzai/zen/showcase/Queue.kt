package dev.rinzai.zen.showcase

import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class Repeat { Off, All, One }

/** What's playing, and what's next: a list of tracks, in order or shuffled. */
@Stable
class Queue {
    private var source by mutableStateOf(TRACKS.map { it.id })
    private var queue by mutableStateOf(source)
    private var at by mutableIntStateOf(0)

    var shuffle by mutableStateOf(false)
        private set
    var repeat by mutableStateOf(Repeat.Off)
        private set

    /** Off until the first tap: then each new track plays as it loads. */
    var started by mutableStateOf(false)
        private set

    val track get() = byId(queue[at])
    val upNext get() = queue.drop(at + 1).map(::byId)
    val hasNext get() = at < queue.size - 1 || repeat == Repeat.All

    fun playList(ids: List<String>, start: String = ids.first()) {
        val order = if (shuffle) listOf(start) + ids.filter { it != start }.shuffled() else ids
        source = ids
        queue = order
        at = order.indexOf(start)
        started = true
    }

    private fun go(to: Int) {
        at = (to + queue.size) % queue.size
        started = true
    }

    fun toggleShuffle() {
        val current = queue[at]
        val order = if (shuffle) source else listOf(current) + source.filter { it != current }.shuffled()
        shuffle = !shuffle
        queue = order
        at = order.indexOf(current)
    }

    /** Puts the tracks after this one in a new order. */
    fun reorder(upNext: List<String>) {
        queue = queue.take(at + 1) + upNext
    }

    /** Moves a track (from wherever it is in the queue) to play after this one. */
    fun playNext(id: String) {
        if (id == queue[at]) return
        val rest = queue.filter { it != id }
        val now = rest.indexOf(queue[at])
        queue = rest.take(now + 1) + id + rest.drop(now + 1)
        at = now
    }

    fun next() = go(at + 1)
    fun previous() = go(at - 1)

    fun cycleRepeat() {
        repeat = when (repeat) {
            Repeat.Off -> Repeat.All
            Repeat.All -> Repeat.One
            Repeat.One -> Repeat.Off
        }
    }

    /** At the end of a track: on to the next, round again with repeat all, or stop. */
    fun ended() = if (at < queue.size - 1 || repeat == Repeat.All) go(at + 1) else started = false
}
