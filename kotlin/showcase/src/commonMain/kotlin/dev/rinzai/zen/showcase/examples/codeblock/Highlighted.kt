package dev.rinzai.zen.showcase.examples.codeblock

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.codeblock.CodeBlock
import dev.rinzai.zen.codeblock.syntaxColors

private const val CODE = """import { Button } from '@rinzai/zen';

export default function Save() {
    return <Button loading>Saving…</Button>;
}"""

/** Colours come from any highlighter that turns code into styled text; here a small JSX one. Hover to copy. */
@Composable
fun Highlighted() {
    val colors = syntaxColors()
    CodeBlock(CODE, Modifier.widthIn(max = 576.dp).fillMaxWidth(), language = "typescript", highlight = { code, _ -> highlightJsx(code, colors) })
}
