package dev.rinzai.zen.media

import androidx.compose.runtime.Composable

// The JVM reaches none of the desktop's media controls (Windows' SMTC, MPRIS, macOS's Now Playing) without native code.
@Composable
internal actual fun rememberPlatformMediaSession(): PlatformMediaSession? = null
