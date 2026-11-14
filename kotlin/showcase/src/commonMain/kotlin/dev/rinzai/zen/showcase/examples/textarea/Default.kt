package dev.rinzai.zen.showcase.examples.textarea

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.textarea.Textarea

@Composable
fun Default() {
    var note by remember { mutableStateOf("") }
    // A textarea is an inline box: its bottom edge sits on its line's baseline, the line's descent under it.
    Row {
        Text("", Modifier.alignByBaseline())
        Textarea(note, { note = it }, Modifier.width(320.dp).alignBy { it.measuredHeight }, placeholder = "Add a note…")
    }
}

@Composable
fun Primary() {
    var text by remember { mutableStateOf("Text Component") }
    Row {
        Text("", Modifier.alignByBaseline())
        Textarea(text, { text = it }, Modifier.alignBy { it.measuredHeight })
    }
}
