package dev.rinzai.zen.desktop

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Fixed
import dev.rinzai.zen.Frame
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.ScrollArea
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.ZenTheme
import dev.rinzai.zen.radii
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.codeblock.CodeBlock
import dev.rinzai.zen.codeblock.CodeBlockVariant
import dev.rinzai.zen.pageheader.PageHeader
import dev.rinzai.zen.separator.Separator
import dev.rinzai.zen.showcase.Stories
import dev.rinzai.zen.showcase.Topo
import dev.rinzai.zen.sidenav.SideNav
import dev.rinzai.zen.sidenav.SideNavGroup
import dev.rinzai.zen.sidenav.SideNavLink
import dev.rinzai.zen.tabs.Tab
import dev.rinzai.zen.tabs.TabList
import dev.rinzai.zen.tabs.TabListVariant
import dev.rinzai.zen.tabs.TabPanel
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.tabs.rememberTabsState
import dev.rinzai.zen.toast.ToastProvider

internal class DocPage(val title: String, val lead: String, val examples: List<DocExample>)

internal class DocExample(val title: String, val description: String?, val source: String, val story: String?)

// The site's docs layout: max-w-7xl px-6, a w-56 sidebar, gap-10, the page py-14.
private val MaxWidth = 1280.dp
private val Gutter = 24.dp
private val SidebarWidth = 224.dp
private val Gap = 40.dp

/** The docs site's Kotlin component pages, natively: the sidebar, and each page's examples running in it. */
@Composable
internal fun Docs(page: Int, onPage: (Int) -> Unit) {
    ZenTheme {
        Backdrop(Topo)
        ToastProvider {
            val zen = LocalPage.current
            LaunchedEffect(page) { zen.scroll.scrollTo(0) }
            // Where the centred layout's sidebar column starts.
            val start = maxOf(Gutter, (zen.viewport.width - MaxWidth) / 2 + Gutter)
            Fixed {
                ScrollArea(Modifier.padding(start = start).width(SidebarWidth).fillMaxHeight(), vertical = rememberScrollState()) {
                    SideNav(Modifier.padding(vertical = 40.dp), label = "Components") {
                        SideNavGroup(title = "Components") {
                            DocPages.forEachIndexed { i, p -> SideNavLink({ onPage(i) }, active = i == page) { Text(p.title) } }
                        }
                    }
                }
            }
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.TopCenter) {
                Column(
                    Modifier
                        .widthIn(max = MaxWidth)
                        .fillMaxWidth()
                        .padding(start = Gutter + SidebarWidth + Gap, end = Gutter, top = 56.dp, bottom = 56.dp),
                ) {
                    key(page) { Page(DocPages[page]) }
                }
            }
        }
    }
}

@Composable
private fun Page(doc: DocPage) {
    PageHeader(doc.title, Modifier.padding(bottom = 48.dp), eyebrow = "Components", lead = doc.lead)
    Column(verticalArrangement = Arrangement.spacedBy(40.dp)) {
        doc.examples.forEachIndexed { i, e -> Example(e, heading = i > 0) }
    }
}

/** As the site's ExampleBlock: a heading and the web example's words, then the live example and its code in a glass card. */
@Composable
private fun Example(example: DocExample, heading: Boolean) {
    val muted = Zen.tokens.mutedForeground.color()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (heading) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(example.title, style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight))
                example.description?.let { DocText(it) }
            }
        }
        // overflow-hidden: the preview is clipped to the card's corners.
        Card(Modifier.fillMaxWidth().clip(Zen.radii.xl), padding = PaddingValues()) {
            Tabs(rememberTabsState(if (example.story != null) "preview" else "code"), Modifier.fillMaxWidth(), gap = 0.dp) {
                Column {
                    Box(Modifier.padding(12.dp)) {
                        TabList(variant = TabListVariant.Pills) {
                            if (example.story != null) Tab("preview") { Text("Preview") }
                            Tab("code") { Text("Code") }
                        }
                    }
                    Separator()
                }
                example.story?.let { story ->
                    TabPanel("preview") {
                        // The example's own fixed parts (a backdrop, a bar) are placed in its preview, as the site's frame keeps them.
                        // A Frame is as big as it's made: as tall as the example (p-10, min-h-56).
                        var height by remember { mutableStateOf(224.dp) }
                        val density = LocalDensity.current
                        Frame(Modifier.fillMaxWidth().height(height)) {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .wrapContentHeight(Alignment.Top, unbounded = true)
                                    .onSizeChanged { height = with(density) { it.height.toDp() } }
                                    .heightIn(min = 224.dp)
                                    .padding(40.dp),
                                contentAlignment = Alignment.Center,
                            ) { Stories.getValue(story)() }
                        }
                    }
                }
                TabPanel("code") {
                    CodeBlock(example.source, Modifier.heightIn(max = 512.dp), language = "kotlin", variant = CodeBlockVariant.Plain)
                }
            }
        }
    }
}

/** JSDoc text as the site's DocText shows it: paragraphs split by blank lines, a single break just a wrap, and `code` spans. */
@Composable
private fun DocText(text: String) {
    val muted = Zen.tokens.mutedForeground.color()
    val code = SpanStyle(color = Zen.tokens.foreground.color(), fontFamily = TextStyles.mono.fontFamily, fontSize = 0.9.em)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        for (paragraph in text.split(Regex("\n\\s*\n"))) {
            val line = paragraph.replace(Regex("\\s*\n\\s*"), " ").trim()
            Text(
                buildAnnotatedString {
                    // Between backticks, every other piece.
                    line.split('`').forEachIndexed { i, part -> if (i % 2 == 1) withStyle(code) { append(part) } else append(part) }
                },
                style = TextStyles.sm,
                color = muted,
            )
        }
    }
}
