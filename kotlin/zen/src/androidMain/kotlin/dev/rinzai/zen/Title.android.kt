package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView

// The view's tooltip, which shows where a mouse rests, as the platform's tooltips do.
@Composable
internal actual fun rememberPlatformTitle(): (String?) -> Unit {
    val view = LocalView.current
    return remember(view) { { text -> view.tooltipText = text } }
}
