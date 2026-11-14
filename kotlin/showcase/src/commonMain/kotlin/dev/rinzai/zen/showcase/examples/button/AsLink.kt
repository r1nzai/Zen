package dev.rinzai.zen.showcase.examples.button

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant

/** A button that goes somewhere opens it with the platform's UriHandler: the browser, or the app the link is for. */
@Composable
fun AsLink() {
    val uri = LocalUriHandler.current
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Button({ uri.openUri("https://zen.rinzai.dev/kotlin/") }) { Text("Get started") }
        Button({ uri.openUri("https://zen.rinzai.dev/kotlin/api/") }, variant = ButtonVariant.Outline) { Text("Read the docs") }
    }
}
