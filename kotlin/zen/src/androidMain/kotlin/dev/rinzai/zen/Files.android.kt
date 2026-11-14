package dev.rinzai.zen

import android.app.Activity
import android.content.ClipDescription
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.draganddrop.DragAndDropEvent
import androidx.compose.ui.draganddrop.toAndroidDragEvent
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalContext
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}

private fun Context.picked(uri: Uri): PickedFile {
    var name = uri.lastPathSegment ?: ""
    var size = 0L
    contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { c ->
        if (c.moveToFirst()) {
            c.getString(0)?.let { name = it }
            if (!c.isNull(1)) size = c.getLong(1)
        }
    }
    val type = contentResolver.getType(uri) ?: MimeTypeMap.getSingleton().getMimeTypeFromExtension(name.substringAfterLast('.', "").lowercase()) ?: ""
    return PickedFile(name, size, type) { withContext(Dispatchers.IO) { contentResolver.openInputStream(uri)!!.use { it.readBytes() } } }
}

/** The media types the system picker filters by: an extension's own, a type or wildcard as written. */
private fun mimeTypes(accept: String?): Array<String> =
    accept?.split(',')?.map { it.trim().lowercase() }?.map { r ->
        if (r.startsWith(".")) MimeTypeMap.getSingleton().getMimeTypeFromExtension(r.drop(1)) ?: "*/*" else r
    }?.distinct()?.toTypedArray() ?: arrayOf("*/*")

@Composable
actual fun rememberFilePicker(accept: String?, multiple: Boolean, onFiles: (List<PickedFile>) -> Unit): () -> Unit {
    val context = LocalContext.current
    val take by rememberUpdatedState(onFiles)
    val registry = (context.activity() as? ActivityResultRegistryOwner)?.activityResultRegistry
    val key = remember { "zen-file-picker-" + System.identityHashCode(Any()) }
    val launcher = remember(registry, multiple) {
        fun deliver(uris: List<Uri>) {
            val files = uris.map(context::picked).filter { accepts(it, accept) }.let { if (multiple) it else it.take(1) }
            if (files.isNotEmpty()) take(files)
        }
        if (multiple) registry?.register(key, ActivityResultContracts.OpenMultipleDocuments()) { deliver(it) }
        else registry?.register(key, ActivityResultContracts.OpenDocument()) { deliver(listOfNotNull(it)) }
    }
    DisposableEffect(launcher) { onDispose { launcher?.unregister() } }
    return remember(launcher, accept) { { launcher?.launch(mimeTypes(accept)) } }
}

// What a drag of text, a link or an app's own content says it is; anything else is a file.
private val NotFiles = setOf(ClipDescription.MIMETYPE_TEXT_PLAIN, ClipDescription.MIMETYPE_TEXT_HTML, ClipDescription.MIMETYPE_TEXT_INTENT, ClipDescription.MIMETYPE_TEXT_URILIST)

internal actual fun DragAndDropEvent.hasFiles(): Boolean {
    val description = toAndroidDragEvent().clipDescription ?: return false
    return (0 until description.mimeTypeCount).any { description.getMimeType(it) !in NotFiles }
}

@Composable
internal actual fun rememberDrop(): (DragAndDropEvent) -> (suspend () -> List<PickedFile>) {
    val context = LocalContext.current
    return remember(context) {
        { e ->
            val event = e.toAndroidDragEvent()
            // Another app's files are read with the permission the drop grants, asked for as it drops.
            context.activity()?.requestDragAndDropPermissions(event)
            val clip = event.clipData
            val uris = if (clip == null) emptyList() else (0 until clip.itemCount).mapNotNull { clip.getItemAt(it).uri }
            suspend { withContext(Dispatchers.IO) { uris.map(context::picked) } }
        }
    }
}

internal actual fun encodeWebp(image: ImageBitmap, quality: Float): ByteArray = ByteArrayOutputStream().also {
    @Suppress("DEPRECATION")
    val format = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP
    image.asAndroidBitmap().compress(format, (quality * 100).toInt(), it)
}.toByteArray()
