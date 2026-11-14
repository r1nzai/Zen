package dev.rinzai.zen.desktop

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Density
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles

/** Where each text style's glyphs land, to set against Chrome's (scratchpad web-base.mjs). */
fun main() {
    for ((name, style) in listOf("lg" to TextStyles.lg.merge(TextStyles.semibold), "sm" to TextStyles.sm, "xs" to TextStyles.xs, "base" to TextStyles.md, "xl2" to TextStyles.xl2.merge(TextStyles.semibold))) {
        val scene = ImageComposeScene(300, 60, Density(1f)) {
            ProvideText(style = TextStyles.base, color = Color.White) {
                Box(Modifier.fillMaxSize().background(Color.Black)) { Text("ZZZZ", style = style) }
            }
        }
        var image = scene.render(0)
        repeat(40) { image = scene.render(it * 16_000_000L); Thread.sleep(16) }
        val px = org.jetbrains.skia.Bitmap.makeFromImage(image)
        val rows = (0 until 60).map { y -> (0 until 300).maxOf { x -> px.getColor(x, y) and 255 } }
        println("$name rows " + rows.withIndex().filter { it.value > 0 }.joinToString { "${it.index}:${it.value}" })
        scene.close()
    }
}
