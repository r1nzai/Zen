package dev.rinzai.zen.showcase.examples.taginput

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.taginput.TagInput

/** An entry's labels. Type one and press Enter or a comma; paste a list to add each. */
@Composable
fun Default() {
    var tags by remember { mutableStateOf(listOf("groceries", "weekly")) }
    Field("Labels", Modifier.widthIn(max = 384.dp).fillMaxWidth(), hint = "Press Enter or a comma after each.") {
        TagInput(tags, { tags = it }, placeholder = "Add a label")
    }
}
