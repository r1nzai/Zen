package dev.rinzai.zen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import kotlin.test.Test
import kotlin.test.assertTrue

/** filter: drop-shadow as Chrome draws it: its blur is the Gaussian's standard deviation. */
class DropShadowTest {
    @Test
    fun blurIsTheStandardDeviation() {
        val scene = ImageComposeScene(200, 200, Density(1f)) {
            Box(Modifier.size(200.dp).background(Color.Black)) {
                Box(Modifier.offset(40.dp, 40.dp).size(60.dp, 100.dp).filterDropShadow(Shadow(blur = 10f, color = Color.White)).background(Color.White))
            }
        }
        val img = scene.render()
        val bmp = org.jetbrains.skia.Bitmap.makeFromImage(img)
        // Chrome's, beside a white 60×100 box with drop-shadow(0 0 10px white) on black.
        val chrome = listOf(122, 112, 102, 93, 83, 74, 65, 57, 49, 42, 36, 30, 25, 21, 17, 14, 11, 8, 6, 4, 3, 2, 1, 1, 0)
        val ours = (100 until 125).map { bmp.getColor(it, 90) shr 16 and 0xFF }
        assertTrue(ours.zip(chrome).all { (a, b) -> kotlin.math.abs(a - b) <= 2 }, "$ours")
        scene.close()
    }
}
