package dev.rinzai.zen.showcase.examples.input

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.input.Input

@Composable
fun Primary() {
    var value by remember { mutableStateOf("Text Component") }
    Input(value, { value = it })
}
