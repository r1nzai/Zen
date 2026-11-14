package dev.rinzai.zen

import kotlinx.coroutines.runBlocking
import org.jetbrains.compose.resources.decodeToImageBitmap
import org.jetbrains.skia.Bitmap
import org.jetbrains.skia.EncodedImageFormat
import org.jetbrains.skia.Image
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class FilesTest {
    private fun file(name: String, type: String = "", bytes: ByteArray = ByteArray(0)) = PickedFile(name, bytes.size.toLong(), type) { bytes }

    @Test
    fun matchesExtensionsTypesAndWildcards() {
        assertEquals(true, accepts(file("a.CSV"), ".csv,.xlsx"))
        assertEquals(true, accepts(file("a.png", "image/png"), "image/*"))
        assertEquals(false, accepts(file("a.txt", "text/plain"), "text/csv"))
        assertEquals(true, accepts(file("a.txt"), null))
    }

    @Test
    fun cropsToACentredSquare() = runBlocking {
        val png = Image.makeFromBitmap(Bitmap().apply { allocN32Pixels(300, 200) }).encodeToData(EncodedImageFormat.PNG)!!.bytes
        val out = cropImageToSquare(file("me.png", "image/png", png), 160).decodeToImageBitmap()
        assertEquals(160 to 160, out.width to out.height)
        assertEquals(ImageCropError.Reason.NotAnImage, assertFailsWith<ImageCropError> { cropImageToSquare(file("a.txt", "text/plain")) }.reason)
        assertEquals(ImageCropError.Reason.Unreadable, assertFailsWith<ImageCropError> { cropImageToSquare(file("a.png", "image/png", byteArrayOf(1, 2, 3))) }.reason)
    }
}
