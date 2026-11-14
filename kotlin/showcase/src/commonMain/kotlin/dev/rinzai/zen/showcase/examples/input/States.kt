package dev.rinzai.zen.showcase.examples.input

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.input.Input

@Composable
fun States() {
    var empty by remember { mutableStateOf("") }
    var filled by remember { mutableStateOf("With a value") }
    Column(Modifier.width(288.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Input(empty, { empty = it }, label = "Empty", placeholder = "Placeholder")
        Input(filled, { filled = it }, label = "Filled")
        Input("Disabled", {}, label = "Disabled", enabled = false)
    }
}
