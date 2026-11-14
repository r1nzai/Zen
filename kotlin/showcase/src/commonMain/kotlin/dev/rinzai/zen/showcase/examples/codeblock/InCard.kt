package dev.rinzai.zen.showcase.examples.codeblock

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.codeblock.CodeBlock
import dev.rinzai.zen.codeblock.CodeBlockVariant

/** Inside a card or panel that already has a surface, `variant = Plain` drops the block's own. */
@Composable
fun InCard() {
    Card(Modifier.widthIn(max = 576.dp).fillMaxWidth(), padding = PaddingValues(0.dp)) {
        CardHeader(Modifier.padding(start = 20.dp, end = 20.dp, top = 20.dp), space = 0.dp) { CardTitle("Install") }
        CodeBlock("pnpm add @rinzai/zen", language = "shell", variant = CodeBlockVariant.Plain)
    }
}
