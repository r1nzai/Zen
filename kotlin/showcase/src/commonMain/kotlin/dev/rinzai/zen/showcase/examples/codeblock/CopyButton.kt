package dev.rinzai.zen.showcase.examples.codeblock

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.rememberCopyToClipboard
import kotlinx.coroutines.launch

private const val LINK = "https://zen.rinzai.dev/components/code-block/"

/** A copy button of your own, with the helper CodeBlock copies with: `copy` returns false when the platform won't copy. */
@Composable
fun CopyButton() {
    val clip = rememberCopyToClipboard()
    val scope = rememberCoroutineScope()
    InputGroup(Modifier.widthIn(max = 384.dp).fillMaxWidth(), contentPadding = PaddingValues(horizontal = 4.dp)) {
        InputGroupInput(LINK, {}, Modifier.padding(start = 8.dp), label = "Link")
        InputGroupAddon {
            Button({ scope.launch { clip.copy(LINK) } }, Modifier.height(28.dp), variant = ButtonVariant.Ghost, size = ButtonSize.Sm) {
                Text(if (clip.copied) "Copied" else "Copy")
            }
        }
    }
}
