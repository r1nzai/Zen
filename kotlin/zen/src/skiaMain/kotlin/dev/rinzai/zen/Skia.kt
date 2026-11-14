package dev.rinzai.zen

import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asComposeShader
import androidx.compose.ui.graphics.asSkiaBitmap
import androidx.compose.ui.graphics.skiaPaint
import org.jetbrains.skia.EncodedImageFormat
import org.jetbrains.skia.Image

// Glyphs placed at fractions of a pixel, as browsers place them: without it skia rounds each
// advance where the platform doesn't position subpixels (Linux), and text runs wider.
@OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)
internal actual val platformText: androidx.compose.ui.text.PlatformTextStyle? =
    androidx.compose.ui.text.PlatformTextStyle(
        null,
        androidx.compose.ui.text.PlatformParagraphStyle(
            androidx.compose.ui.text.FontRasterizationSettings(
                androidx.compose.ui.text.FontRasterizationSettings.PlatformDefault.smoothing,
                androidx.compose.ui.text.FontHinting.None,
                subpixelPositioning = true,
                autoHintingForced = false,
            ),
        ),
    )

internal actual fun androidx.compose.ui.graphics.Paint.blur(sigma: Float) {
    skiaPaint.maskFilter = if (sigma > 0f) org.jetbrains.skia.MaskFilter.makeBlur(org.jetbrains.skia.FilterBlurMode.NORMAL, sigma) else null
}

internal actual fun runtimeShader(source: String): RuntimeShader? {
    val effect = runCatching { org.jetbrains.skia.RuntimeEffect.makeForShader(source) }.getOrNull() ?: return null
    return RuntimeShader { uniforms ->
        val builder = org.jetbrains.skia.RuntimeShaderBuilder(effect)
        for ((name, v) in uniforms) when (v.size) {
            1 -> builder.uniform(name, v[0])
            2 -> builder.uniform(name, v[0], v[1])
            3 -> builder.uniform(name, v[0], v[1], v[2])
            else -> builder.uniform(name, v)
        }
        builder.makeShader().asComposeShader()
    }
}

internal actual fun encodeWebp(image: ImageBitmap, quality: Float): ByteArray =
    Image.makeFromBitmap(image.asSkiaBitmap()).encodeToData(EncodedImageFormat.WEBP, (quality * 100).toInt())!!.bytes
