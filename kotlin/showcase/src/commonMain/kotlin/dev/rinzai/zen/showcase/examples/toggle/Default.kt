package dev.rinzai.zen.showcase.examples.toggle

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.toggle.Toggle

@Composable
fun Default() {
    var on by remember { mutableStateOf(true) }
    Row(Modifier.width(256.dp), horizontalArrangement = spaceBetween(0.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("Repeats every month")
        Toggle(on, { on = it }, label = "Repeats every month")
    }
}

@Composable
fun Primary() {
    var on by remember { mutableStateOf(false) }
    Toggle(on, { on = it })
}
