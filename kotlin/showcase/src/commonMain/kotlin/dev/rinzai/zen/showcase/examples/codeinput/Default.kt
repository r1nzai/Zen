package dev.rinzai.zen.showcase.examples.codeinput

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.codeinput.CodeInput
import dev.rinzai.zen.field.Field

/** A six-digit sign-in code, checked as soon as it's complete. */
@Composable
fun Default() {
    var code by remember { mutableStateOf("") }
    var checked by remember { mutableStateOf<String?>(null) }
    Field("Sign-in code", hint = checked?.let { "Checking $it…" } ?: "We sent it to your phone.") {
        CodeInput(code, { code = it; checked = null }, onComplete = { checked = it })
    }
}
