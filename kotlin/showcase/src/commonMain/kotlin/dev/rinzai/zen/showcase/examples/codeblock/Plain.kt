package dev.rinzai.zen.showcase.examples.codeblock

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.codeblock.CodeBlock

/** Without a highlighter, the code shows as plain text. */
@Composable
fun Plain() {
    CodeBlock("pnpm add @rinzai/zen", Modifier.widthIn(max = 576.dp).fillMaxWidth(), language = "shell")
}
