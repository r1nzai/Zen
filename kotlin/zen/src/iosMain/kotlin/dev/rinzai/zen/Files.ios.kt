@file:OptIn(ExperimentalForeignApi::class, ExperimentalComposeUiApi::class)

package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.draganddrop.DragAndDropEvent
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.suspendCancellableCoroutine
import platform.Foundation.NSData
import platform.Foundation.NSFileManager
import platform.Foundation.NSFileSize
import platform.Foundation.NSURL
import platform.Foundation.dataWithContentsOfURL
import platform.UIKit.UIApplication
import platform.UIKit.UIDocumentPickerDelegateProtocol
import platform.UIKit.UIDocumentPickerViewController
import platform.UIKit.UIDragItem
import platform.UIKit.UIViewController
import platform.UniformTypeIdentifiers.UTType
import platform.UniformTypeIdentifiers.UTTypeAudio
import platform.UniformTypeIdentifiers.UTTypeData
import platform.UniformTypeIdentifiers.UTTypeImage
import platform.UniformTypeIdentifiers.UTTypeItem
import platform.UniformTypeIdentifiers.UTTypeMovie
import platform.UniformTypeIdentifiers.UTTypePlainText
import platform.UniformTypeIdentifiers.UTTypeText
import platform.UniformTypeIdentifiers.UTTypeURL
import platform.darwin.NSObject
import platform.posix.memcpy

private fun NSData.toByteArray(): ByteArray = ByteArray(length.toInt()).also { out ->
    if (out.isNotEmpty()) out.usePinned { memcpy(it.addressOf(0), bytes, length) }
}

private fun mimeOf(name: String) = UTType.typeWithFilenameExtension(name.substringAfterLast('.', ""))?.preferredMIMEType ?: ""

private fun NSURL.picked(): PickedFile {
    val name = lastPathComponent ?: ""
    val size = path?.let { (NSFileManager.defaultManager.attributesOfItemAtPath(it, null)?.get(NSFileSize) as? Number)?.toLong() } ?: 0L
    return PickedFile(name, size, mimeOf(name)) { NSData.dataWithContentsOfURL(this)?.toByteArray() ?: ByteArray(0) }
}

/** The types the system picker offers: an extension's own, a media type's, a wildcard's family. */
private fun contentTypes(accept: String?): List<UTType> =
    accept?.split(',')?.map { it.trim().lowercase() }?.mapNotNull { r ->
        when {
            r.startsWith(".") -> UTType.typeWithFilenameExtension(r.drop(1))
            r == "image/*" -> UTTypeImage
            r == "audio/*" -> UTTypeAudio
            r == "video/*" -> UTTypeMovie
            r == "text/*" -> UTTypeText
            r.endsWith("/*") -> UTTypeData
            else -> UTType.typeWithMIMEType(r)
        }
    }?.ifEmpty { null } ?: listOf(UTTypeItem)

private class PickerDelegate : NSObject(), UIDocumentPickerDelegateProtocol {
    var onPick: (List<NSURL>) -> Unit = {}

    override fun documentPicker(controller: UIDocumentPickerViewController, didPickDocumentsAtURLs: List<*>) {
        onPick(didPickDocumentsAtURLs.filterIsInstance<NSURL>())
    }
}

private fun topController(): UIViewController? {
    var top = UIApplication.sharedApplication.keyWindow?.rootViewController
    while (top?.presentedViewController != null) top = top.presentedViewController
    return top
}

@Composable
actual fun rememberFilePicker(accept: String?, multiple: Boolean, onFiles: (List<PickedFile>) -> Unit): () -> Unit {
    val take by rememberUpdatedState(onFiles)
    val delegate = remember { PickerDelegate() }
    delegate.onPick = { urls ->
        val files = urls.map { it.picked() }.filter { accepts(it, accept) }.let { if (multiple) it else it.take(1) }
        if (files.isNotEmpty()) take(files)
    }
    return remember(accept, multiple) {
        {
            // A copy of each, in the app's own space, so it reads without asking again.
            val picker = UIDocumentPickerViewController(forOpeningContentTypes = contentTypes(accept), asCopy = true)
            picker.allowsMultipleSelection = multiple
            picker.delegate = delegate
            topController()?.presentViewController(picker, animated = true, completion = null)
        }
    }
}

// What a drag of text or a link says it is; anything else is a file.
private val UIDragItem.isFile get() = itemProvider.registeredTypeIdentifiers.none { it == UTTypePlainText.identifier || it == UTTypeURL.identifier || it == UTTypeText.identifier }

internal actual fun DragAndDropEvent.hasFiles(): Boolean = items.any { it.isFile }

@Composable
internal actual fun rememberDrop(): (DragAndDropEvent) -> (suspend () -> List<PickedFile>) = remember {
    { event ->
        val providers = event.items.filter { it.isFile }.map { it.itemProvider }
        suspend {
            providers.mapNotNull { provider ->
                val type = provider.registeredTypeIdentifiers.firstOrNull() as? String ?: return@mapNotNull null
                // The file is only there while the callback runs: it's read then.
                val data = suspendCancellableCoroutine<ByteArray?> { done ->
                    provider.loadFileRepresentationForTypeIdentifier(type) { url, _ -> done.resumeWith(Result.success(url?.let { NSData.dataWithContentsOfURL(it)?.toByteArray() })) }
                } ?: return@mapNotNull null
                val name = provider.suggestedName?.let { n -> if ('.' in n) n else UTType.typeWithIdentifier(type)?.preferredFilenameExtension?.let { "$n.$it" } ?: n } ?: "file"
                PickedFile(name, data.size.toLong(), UTType.typeWithIdentifier(type)?.preferredMIMEType ?: mimeOf(name)) { data }
            }
        }
    }
}
