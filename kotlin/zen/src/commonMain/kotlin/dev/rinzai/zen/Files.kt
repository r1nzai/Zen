package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.ui.draganddrop.DragAndDropEvent
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import org.jetbrains.compose.resources.decodeToImageBitmap

/** A file someone chose or dropped: its name, size in bytes and media type ("text/csv", "" when unknown), and its bytes. */
class PickedFile internal constructor(val name: String, val size: Long, val type: String, private val bytes: suspend () -> ByteArray) {
    suspend fun read(): ByteArray = bytes()
}

/** Whether `file` is one an `accept` value allows, as an <input accept>'s: extensions (.csv), types (text/csv) and wildcards (image/\*). */
fun accepts(file: PickedFile, accept: String?): Boolean {
    if (accept == null) return true
    val name = file.name.lowercase()
    val type = file.type.lowercase()
    return accept.split(',').any { rule ->
        val r = rule.trim().lowercase()
        when {
            r.startsWith(".") -> name.endsWith(r)
            r.endsWith("/*") -> type.startsWith(r.dropLast(1))
            else -> type == r
        }
    }
}

/** The platform's own picker for files `accept` allows (all, without it), one unless `multiple`: call what this gives to open it. */
@Composable
expect fun rememberFilePicker(accept: String? = null, multiple: Boolean = false, onFiles: (List<PickedFile>) -> Unit): () -> Unit

/** Whether a drag carries files (not text or a link). */
internal expect fun DragAndDropEvent.hasFiles(): Boolean

/** Takes a drop's files: called while it drops (what it needs is taken then), what it gives loads them. */
@Composable
internal expect fun rememberDrop(): (DragAndDropEvent) -> (suspend () -> List<PickedFile>)

/** `reason` says what went wrong, so you can say it in your own words; `message` says it in English. */
class ImageCropError(val reason: Reason, message: String) : Exception(message) {
    enum class Reason { NotAnImage, TooLarge, Unreadable }
}

/**
 * Crops an image file to a centred square and resizes it (to `size` px), returning it small, as
 * WebP: handy for profile pictures you store yourself. Show it with decodeToImageBitmap.
 */
suspend fun cropImageToSquare(file: PickedFile, size: Int = 160, quality: Float = 0.85f): ByteArray {
    if (!file.type.startsWith("image/")) throw ImageCropError(ImageCropError.Reason.NotAnImage, "Choose an image file.")
    if (file.size > 20L * 1024 * 1024) throw ImageCropError(ImageCropError.Reason.TooLarge, "That image is too large (over 20 MB).")
    val image = try {
        file.read().decodeToImageBitmap()
    } catch (_: Exception) {
        throw ImageCropError(ImageCropError.Reason.Unreadable, "That image couldn't be read.")
    }
    val side = minOf(image.width, image.height)
    val out = ImageBitmap(size, size)
    Canvas(out).drawImageRect(
        image,
        IntOffset((image.width - side) / 2, (image.height - side) / 2),
        IntSize(side, side),
        IntOffset.Zero,
        IntSize(size, size),
        Paint().apply { filterQuality = FilterQuality.High },
    )
    return encodeWebp(out, quality)
}

internal expect fun encodeWebp(image: ImageBitmap, quality: Float): ByteArray
