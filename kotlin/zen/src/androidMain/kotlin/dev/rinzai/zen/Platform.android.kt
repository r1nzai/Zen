package dev.rinzai.zen

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.provider.Settings
import android.view.View
import android.view.WindowInsetsController
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView

internal actual val coarsePointer = true

/** Android's "Remove animations" sets the animator scale to 0. */
@Composable
internal actual fun systemReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return remember { Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }
}

// Android lays text out with unhinted, fractional advances already.
internal actual val platformText: androidx.compose.ui.text.PlatformTextStyle? = null

// BlurMaskFilter takes a radius, from which Android takes the sigma as 0.57735 r + 0.5.
internal actual fun androidx.compose.ui.graphics.Paint.blur(sigma: Float) {
    asFrameworkPaint().maskFilter =
        if (sigma > 0.5f) android.graphics.BlurMaskFilter((sigma - 0.5f) / 0.57735f, android.graphics.BlurMaskFilter.Blur.NORMAL) else null
}

// Runtime shaders (AGSL, Skia's shading language) arrived in Android 13.
internal actual fun runtimeShader(source: String): RuntimeShader? {
    if (Build.VERSION.SDK_INT < 33) return null
    val shader = runCatching { android.graphics.RuntimeShader(source) }.getOrNull() ?: return null
    return RuntimeShader { uniforms ->
        for ((name, v) in uniforms) shader.setFloatUniform(name, v)
        shader
    }
}

@Composable
internal actual fun ColorScheme(appearance: Appearance) {
    val view = LocalView.current
    val light = appearance == Appearance.Light
    SideEffect {
        val window = view.context.activity()?.window ?: return@SideEffect
        if (Build.VERSION.SDK_INT >= 30) {
            val bars = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            window.insetsController?.setSystemBarsAppearance(if (light) bars else 0, bars)
        } else {
            @Suppress("DEPRECATION")
            val bars = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            val decor = window.decorView
            @Suppress("DEPRECATION")
            decor.systemUiVisibility = if (light) decor.systemUiVisibility or bars else decor.systemUiVisibility and bars.inv()
        }
    }
}

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}

internal actual val platformHaptics: androidx.compose.ui.hapticfeedback.HapticFeedback? = null

internal actual fun grabCursor(grabbing: Boolean) =
    androidx.compose.ui.input.pointer.PointerIcon(if (grabbing) android.view.PointerIcon.TYPE_GRABBING else android.view.PointerIcon.TYPE_GRAB)

// As Chrome on Android maps CSS cursors to the system's.
internal actual fun cssCursor(cursor: CssCursor) = androidx.compose.ui.input.pointer.PointerIcon(
    when (cursor) {
        CssCursor.Move -> android.view.PointerIcon.TYPE_ALL_SCROLL
        CssCursor.NsResize -> android.view.PointerIcon.TYPE_VERTICAL_DOUBLE_ARROW
        CssCursor.EwResize -> android.view.PointerIcon.TYPE_HORIZONTAL_DOUBLE_ARROW
        CssCursor.NwseResize -> android.view.PointerIcon.TYPE_TOP_LEFT_DIAGONAL_DOUBLE_ARROW
        CssCursor.NeswResize -> android.view.PointerIcon.TYPE_TOP_RIGHT_DIAGONAL_DOUBLE_ARROW
        CssCursor.NotAllowed -> android.view.PointerIcon.TYPE_NO_DROP
    },
)

internal actual val monospace: androidx.compose.ui.text.font.FontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
