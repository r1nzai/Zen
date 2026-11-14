package dev.rinzai.zen.showcase.examples.filedrop

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.PickedFile
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.filedrop.FileDrop

/** A bank statement to import: CSV or Excel, one at a time. */
@Composable
fun Default() {
    var file by remember { mutableStateOf<PickedFile?>(null) }
    FileDrop({ file = it.first() }, Modifier.widthIn(max = 448.dp).fillMaxWidth(), accept = ".csv,.xlsx") {
        Text(file?.name ?: "Drop a statement here", color = Zen.tokens.foreground.color(), style = TextStyles.medium)
        Text(file?.let { "${(it.size + 1023) / 1024} KB · choose another" } ?: "CSV or Excel, or click to choose", style = TextStyles.xs)
    }
}
