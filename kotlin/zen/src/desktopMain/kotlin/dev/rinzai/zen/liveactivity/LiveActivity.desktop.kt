package dev.rinzai.zen.liveactivity

import androidx.compose.runtime.Composable

// A desktop has no live activities.
@Composable
internal actual fun rememberPlatformLiveActivities(): PlatformLiveActivities? = null
