package dev.rinzai.zen

import androidx.compose.ui.platform.ClipEntry

internal actual fun plainText(text: String) = ClipEntry.withPlainText(text)
