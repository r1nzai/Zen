package dev.rinzai.zen

import kotlin.math.floor
import kotlin.math.max

/** Seconds as a clock reads them: 3:07, or 1:02:07 past an hour. */
fun formatDuration(seconds: Double): String {
    val total = floor(max(seconds, 0.0)).toLong()
    val h = total / 3600
    val m = (total % 3600) / 60
    val s = (total % 60).toString().padStart(2, '0')
    return if (h > 0) "$h:${m.toString().padStart(2, '0')}:$s" else "$m:$s"
}
