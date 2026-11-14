package dev.rinzai.zen.liveactivity

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

/**
 * The app's own ActivityKit code, which Kotlin can't reach (ActivityKit is Swift's alone): start an
 * Activity of the widget extension's attributes from the content, update and end it by the id
 * start returned. `enabled` is ActivityAuthorizationInfo().areActivitiesEnabled.
 */
interface LiveActivityProvider {
    val enabled: Boolean
    fun start(content: LiveActivityContent): String
    fun update(id: String, content: LiveActivityContent)
    fun end(id: String)
}

/** Set from Swift at launch to the app's LiveActivityProvider; until then, live activities aren't supported. */
var liveActivityProvider: LiveActivityProvider? = null

@Composable
internal actual fun rememberPlatformLiveActivities(): PlatformLiveActivities? {
    val provider = liveActivityProvider ?: return null
    return remember(provider) { AppleLiveActivities(provider) }
}

private class AppleLiveActivities(private val provider: LiveActivityProvider) : PlatformLiveActivities {
    override val permitted get() = provider.enabled

    // There's no asking: Live Activities are on unless the user turned them off in Settings.
    override fun requestPermission(onResult: (Boolean) -> Unit) = onResult(provider.enabled)

    override fun start(content: LiveActivityContent): LiveActivityHandle {
        val id = provider.start(content)
        return object : LiveActivityHandle {
            override fun update(content: LiveActivityContent) = provider.update(id, content)
            override fun end() = provider.end(id)
        }
    }
}
