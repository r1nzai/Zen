package dev.rinzai.zen

import androidx.compose.runtime.Composable

// iOS has no hover titles (Safari shows none).
@Composable
internal actual fun rememberPlatformTitle(): (String?) -> Unit = {}
