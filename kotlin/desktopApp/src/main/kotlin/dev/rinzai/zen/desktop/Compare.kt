package dev.rinzai.zen.desktop

import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Compares the web's capture with the Kotlin one: `web.png kotlin.png out-prefix [x y w h zoom]`.
 * Writes the difference as a heat map (out-diff.png) and, given a region, both crops side by side
 * and enlarged (out-crop.png); prints the share of pixels that differ visibly.
 */
fun main(args: Array<String>) {
    val web = ImageIO.read(File(args[0]))
    val kt = ImageIO.read(File(args[1]))
    val out = args[2]
    val w = min(web.width, kt.width)
    val h = min(web.height, kt.height)
    val diff = BufferedImage(w, h, BufferedImage.TYPE_INT_RGB)
    var visible = 0
    for (y in 0 until h) for (x in 0 until w) {
        val a = web.getRGB(x, y)
        val b = kt.getRGB(x, y)
        val d = max(max(abs((a shr 16 and 255) - (b shr 16 and 255)), abs((a shr 8 and 255) - (b shr 8 and 255))), abs((a and 255) - (b and 255)))
        if (d > 8) visible++
        val g = (b shr 16 and 255) / 4
        diff.setRGB(x, y, if (d > 8) (min(255, 64 + d * 3) shl 16) or (g shl 8) or g else (g shl 16) or (g shl 8) or g)
    }
    ImageIO.write(diff, "png", File("$out-diff.png"))
    println("visibly different: %.2f%% of %dx%d".format(100.0 * visible / (w * h), w, h))
    if (args.size >= 7) {
        val (cx, cy, cw, ch, zoom) = args.drop(3).map { it.toInt() }
        val crop = BufferedImage(cw * zoom * 2 + zoom, ch * zoom, BufferedImage.TYPE_INT_RGB)
        for (y in 0 until ch * zoom) for (x in 0 until cw * zoom) {
            val sx = (cx + x / zoom).coerceIn(0, w - 1)
            val sy = (cy + y / zoom).coerceIn(0, h - 1)
            crop.setRGB(x, y, web.getRGB(sx, sy))
            crop.setRGB(x + cw * zoom + zoom, y, kt.getRGB(sx, sy))
        }
        ImageIO.write(crop, "png", File("$out-crop.png"))
    }
}
