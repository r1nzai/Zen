package dev.rinzai.zen.showcase.examples.tableofcontents

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.tableofcontents.TableOfContents
import dev.rinzai.zen.tableofcontents.TableOfContentsItem

/** Point items at sections (Modifier.section); the link for the section being read lights up as you scroll. */
@Composable
fun Default() {
    TableOfContents(
        listOf(
            TableOfContentsItem("installation", "Installation"),
            TableOfContentsItem("usage", "Usage"),
            TableOfContentsItem("theming", "Theming"),
            TableOfContentsItem("tokens", "Tokens", depth = 2),
        ),
        Modifier.width(192.dp),
    )
}
