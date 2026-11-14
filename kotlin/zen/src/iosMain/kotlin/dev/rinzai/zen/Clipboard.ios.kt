package dev.rinzai.zen

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.platform.ClipEntry

@OptIn(ExperimentalComposeUiApi::class)
internal actual fun plainText(text: String) = ClipEntry.withPlainText(text)
