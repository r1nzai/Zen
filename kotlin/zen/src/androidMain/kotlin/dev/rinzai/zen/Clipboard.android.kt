package dev.rinzai.zen

import android.content.ClipData
import androidx.compose.ui.platform.ClipEntry
import androidx.compose.ui.platform.toClipEntry

internal actual fun plainText(text: String): ClipEntry = ClipData.newPlainText(null, text).toClipEntry()
