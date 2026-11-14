package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.draganddrop.DragAndDropEvent
import java.awt.FileDialog
import java.awt.Frame
import java.awt.KeyboardFocusManager
import java.awt.datatransfer.DataFlavor
import java.awt.datatransfer.Transferable
import java.awt.dnd.DropTargetDragEvent
import java.awt.dnd.DropTargetDropEvent
import java.io.File
import java.net.URLConnection
import java.nio.file.Files
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private fun File.picked() = PickedFile(
    name,
    length(),
    runCatching { Files.probeContentType(toPath()) }.getOrNull() ?: URLConnection.guessContentTypeFromName(name) ?: "",
) { withContext(Dispatchers.IO) { readBytes() } }

@Composable
actual fun rememberFilePicker(accept: String?, multiple: Boolean, onFiles: (List<PickedFile>) -> Unit): () -> Unit {
    val take by rememberUpdatedState(onFiles)
    return remember(accept, multiple) {
        {
            val owner = KeyboardFocusManager.getCurrentKeyboardFocusManager().activeWindow as? Frame
            val dialog = FileDialog(owner, null, FileDialog.LOAD).apply {
                isMultipleMode = multiple
                // Where the system's dialog honours it (macOS, Linux): what can't be chosen is greyed out.
                setFilenameFilter { dir, name -> accept == null || File(dir, name).let { it.isDirectory || accepts(it.picked(), accept) } }
                isVisible = true
            }
            val files = dialog.files.map { it.picked() }.filter { accepts(it, accept) }.let { if (multiple) it else it.take(1) }
            if (files.isNotEmpty()) take(files)
        }
    }
}

@OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class)
private val DragAndDropEvent.transferable: Transferable?
    get() = when (val e = nativeEvent) {
        is DropTargetDragEvent -> e.transferable
        is DropTargetDropEvent -> e.transferable
        else -> null
    }

internal actual fun DragAndDropEvent.hasFiles(): Boolean = transferable?.isDataFlavorSupported(DataFlavor.javaFileListFlavor) == true

@Composable
internal actual fun rememberDrop(): (DragAndDropEvent) -> (suspend () -> List<PickedFile>) = remember {
    { event ->
        val files = (event.transferable?.getTransferData(DataFlavor.javaFileListFlavor) as? List<*>).orEmpty().filterIsInstance<File>().filter { it.isFile }.map { it.picked() }
        suspend { files }
    }
}
