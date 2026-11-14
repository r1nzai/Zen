package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.draganddrop.DragAndDropEvent
import androidx.compose.ui.draganddrop.domDataTransferOrNull
import kotlinx.coroutines.await
import org.khronos.webgl.ArrayBuffer
import org.khronos.webgl.Int8Array
import org.khronos.webgl.toByteArray
import org.w3c.files.File
import org.w3c.files.FileList
import org.w3c.files.get
import kotlin.js.Promise

private fun bytesOf(file: File): Promise<ArrayBuffer> = js("file.arrayBuffer()")

private fun File.picked() = PickedFile(name, size.toDouble().toLong(), type) { Int8Array(bytesOf(this).await<ArrayBuffer>()).toByteArray() }

private fun FileList.picked() = List(length) { this[it]!!.picked() }

// An <input type="file">, as the web library opens: the browser's own picker, its accept and multiple honoured.
private fun choose(accept: String?, multiple: Boolean, onFiles: (FileList) -> Unit): Unit = js(
    """{
    const input = document.createElement('input');
    input.type = 'file';
    if (accept != null) input.accept = accept;
    input.multiple = multiple;
    input.addEventListener('change', () => { if (input.files.length) onFiles(input.files); });
    input.click();
}""",
)

@Composable
actual fun rememberFilePicker(accept: String?, multiple: Boolean, onFiles: (List<PickedFile>) -> Unit): () -> Unit {
    val take by rememberUpdatedState(onFiles)
    return remember(accept, multiple) {
        {
            choose(accept, multiple) { list ->
                val files = list.picked().filter { accepts(it, accept) }.let { if (multiple) it else it.take(1) }
                if (files.isNotEmpty()) take(files)
            }
        }
    }
}

private fun hasFileType(types: JsAny): Boolean = js("Array.from(types).includes('Files')")

@OptIn(ExperimentalComposeUiApi::class)
internal actual fun DragAndDropEvent.hasFiles(): Boolean =
    transferData?.domDataTransferOrNull?.let { hasFileType(it.types) } == true

// The files are taken while it drops: the browser empties the transfer once the event is over.
@OptIn(ExperimentalComposeUiApi::class)
@Composable
internal actual fun rememberDrop(): (DragAndDropEvent) -> (suspend () -> List<PickedFile>) = remember {
    { event ->
        val files = event.transferData?.domDataTransferOrNull?.files?.picked().orEmpty()
        suspend { files }
    }
}
