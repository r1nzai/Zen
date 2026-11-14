package dev.rinzai.zen.liveactivity

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue

/**
 * What a live activity shows: a title and a line under it, how far along it is (0 to 1) with
 * stops along the way (picked up, on the way, delivered), and the short status the system keeps
 * in view (Android's status bar chip, the Dynamic Island's compact view): `chip`'s text, or a
 * countdown to `endsAt` (epoch milliseconds).
 */
data class LiveActivityContent(
    val title: String,
    val text: String? = null,
    val progress: Float? = null,
    val stops: List<Float> = emptyList(),
    val chip: String? = null,
    val endsAt: Long? = null,
)

/** One live activity, started by LiveActivities.start: show new content with update, take it down with end. */
interface LiveActivityHandle {
    fun update(content: LiveActivityContent)
    fun end()
}

/** The system's side: Android's promoted notifications, iOS's ActivityKit through LiveActivityProvider. */
internal interface PlatformLiveActivities {
    val permitted: Boolean
    fun requestPermission(onResult: (Boolean) -> Unit)
    fun start(content: LiveActivityContent): LiveActivityHandle
}

@Composable
internal expect fun rememberPlatformLiveActivities(): PlatformLiveActivities?

/**
 * Live status in the system's own UI while something is under way (a delivery, a ride, a
 * timer), as an app's Live Update on Android 16 (the status bar chip and the lock screen; Live
 * Alerts on ColorOS and OxygenOS) and its Live Activity on iOS (the Dynamic Island and the lock
 * screen). `supported` is false where there's no such thing (desktop, the browser), and start then
 * shows nothing. Showing one needs the user's leave (`permitted`, `requestPermission`).
 *
 * On Android, the app's manifest declares POST_NOTIFICATIONS and POST_PROMOTED_NOTIFICATIONS. On
 * iOS, ActivityKit is Swift's alone: the app's widget extension draws the activity, and the app
 * sets `liveActivityProvider` to its own LiveActivityProvider, which starts and updates it.
 */
@Stable
class LiveActivities internal constructor(private val platform: PlatformLiveActivities?) {
    val supported: Boolean get() = platform != null

    var permitted by mutableStateOf(platform?.permitted ?: false)
        private set

    /** Asks for the user's leave, as the system asks; `permitted` follows the answer. */
    fun requestPermission() {
        val p = platform ?: return
        if (permitted) return
        p.requestPermission { permitted = it }
    }

    fun start(content: LiveActivityContent): LiveActivityHandle = platform?.start(content) ?: Unshown
    private object Unshown : LiveActivityHandle {
        override fun update(content: LiveActivityContent) {}
        override fun end() {}
    }
}

@Composable
fun rememberLiveActivities(): LiveActivities {
    val platform = rememberPlatformLiveActivities()
    return remember(platform) { LiveActivities(platform) }
}

/**
 * A live activity shown while this is composed and `active`, updated as `content` changes and
 * ended when it leaves. For one that outlives the screen, start it with rememberLiveActivities.
 */
@Composable
fun LiveActivity(content: LiveActivityContent, active: Boolean = true) {
    val activities = rememberLiveActivities()
    val latest by rememberUpdatedState(content)
    var handle by remember { mutableStateOf<LiveActivityHandle?>(null) }
    DisposableEffect(activities, active, activities.permitted) {
        if (active && activities.permitted) handle = activities.start(latest)
        onDispose {
            handle?.end()
            handle = null
        }
    }
    LaunchedEffect(content, handle) { handle?.update(content) }
}
