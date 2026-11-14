package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.uikit.LocalUIViewController
import platform.UIKit.UIAccessibilityIsReduceMotionEnabled
import platform.UIKit.UIUserInterfaceStyle

internal actual val coarsePointer = true

@Composable
internal actual fun systemReducedMotion(): Boolean = remember { UIAccessibilityIsReduceMotionEnabled() }

// The status bar's default style follows the view controller's interface style.
@Composable
internal actual fun ColorScheme(appearance: Appearance) {
    val controller = LocalUIViewController.current
    SideEffect {
        controller.overrideUserInterfaceStyle =
            if (appearance == Appearance.Light) UIUserInterfaceStyle.UIUserInterfaceStyleLight else UIUserInterfaceStyle.UIUserInterfaceStyleDark
    }
}

// UIKit's pointer has no hand shapes to give.
internal actual val platformHaptics: androidx.compose.ui.hapticfeedback.HapticFeedback? = null

internal actual fun grabCursor(grabbing: Boolean) = androidx.compose.ui.input.pointer.PointerIcon.Default

internal actual fun cssCursor(cursor: CssCursor) = androidx.compose.ui.input.pointer.PointerIcon.Default

// ui-monospace is SF Mono, which CoreText names .AppleSystemUIFontMonospaced.
@OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)
internal actual val monospace: androidx.compose.ui.text.font.FontFamily by lazy {
    val stack = listOf(".AppleSystemUIFontMonospaced", "SF Mono", "Menlo", "Courier New", "monospace")
    stack.firstOrNull { org.jetbrains.skia.FontMgr.default.matchFamily(it).count() > 0 }
        ?.let { androidx.compose.ui.text.font.FontFamily(androidx.compose.ui.text.platform.SystemFont(it)) }
        ?: androidx.compose.ui.text.font.FontFamily.Monospace
}
