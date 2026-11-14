package dev.rinzai.zen.showcase.examples.header

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.header.Header
import dev.rinzai.zen.pills.Pill
import dev.rinzai.zen.pills.Pills
import dev.rinzai.zen.radii
import dev.rinzai.zen.themetoggle.ThemeToggle

@Composable
fun Default() {
    var page by remember { mutableStateOf("docs") }
    Box(Modifier.fillMaxWidth().clip(Zen.radii.xl)) {
        Header(sticky = false) {
            Text("Zen", style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight))
            Pills(Modifier.semantics { contentDescription = "Main" }) {
                Pill({ page = "docs" }, active = page == "docs") { Text("Docs") }
                Pill({ page = "components" }, active = page == "components") { Text("Components") }
            }
            ThemeToggle()
        }
    }
}
