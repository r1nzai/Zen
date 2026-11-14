package dev.rinzai.zen.liveactivity

import androidx.compose.runtime.Composable

// The browser has no live activities.
@Composable
internal actual fun rememberPlatformLiveActivities(): PlatformLiveActivities? = null
