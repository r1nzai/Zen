package dev.rinzai.zen.tableofcontents

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.TextTransform
import dev.rinzai.zen.Zen
import dev.rinzai.zen.browserFocusRing
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.followSection
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition
import kotlinx.coroutines.launch

/** A link in a TableOfContents: the `id` of a Modifier.section, its label, and 1 (default) or 2 for a nested entry. */
data class TableOfContentsItem(val id: String, val label: String, val depth: Int = 1)

/**
 * "On this page": links to the page's sections (Modifier.section), lighting up the one being read
 * (the first in the top third of the window). `title` is shown above the list and names it;
 * empty, no heading is shown (e.g. under a trigger that says it).
 */
@Composable
fun TableOfContents(items: List<TableOfContentsItem>, modifier: Modifier = Modifier, title: String? = null) {
    if (items.isEmpty()) return
    val t = Zen.tokens
    val page = Zen.page
    val m = LocalMessages.current
    val heading = title ?: m.onThisPage
    var active by remember { mutableStateOf<String?>(null) }
    // A section counts as current while it's in the top part of the window.
    val density = LocalDensity.current
    LaunchedEffect(items, page) {
        snapshotFlow { page.scroll.value to page.viewport }.collect {
            val band = with(density) { page.viewport.height.toPx() } * 0.35f
            val first = items.firstOrNull { item ->
                val at = page.sections[item.id]?.coordinates?.takeIf { it.isAttached } ?: return@firstOrNull false
                val box = at.boundsInWindow()
                !box.isEmpty && box.top < band
            }
            if (first != null) active = first.id
        }
    }
    val scope = rememberCoroutineScope()
    val reduced = reducedMotion()
    val line = t.tint.color(0.07f)
    Column(modifier.semantics { contentDescription = heading }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (heading.isNotEmpty()) {
            ProvideText(transform = TextTransform.Uppercase) {
                Text(heading, style = TextStyles.xs2.copy(letterSpacing = 0.1.em), color = t.mutedForeground.color())
            }
        }
        val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
        Column(
            Modifier.drawBehind { drawRect(line, Offset(if (rtl) size.width - 1.dp.toPx() else 0f, 0f), Size(1.dp.toPx(), size.height)) }.padding(start = 1.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            ProvideText(style = TextStyles.sm) {
                for (item in items) {
                    Link(item, item.id == active) { scope.launch { page.followSection(item.id, reduced) } }
                }
            }
        }
    }
}

@Composable
private fun Link(item: TableOfContentsItem, current: Boolean, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val ink by animateColorAsState(if (current || state.hovered) t.foreground.color() else t.mutedForeground.color(), transition<Color>(150))
    val mark by animateColorAsState(if (current) t.primary.color() else t.primary.color(0f), transition<Color>(150))
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    // -ms-px: its border lies over the list's line.
    Box(Modifier.offset(x = (-1).dp).padding(start = if (item.depth == 2) 12.dp else 0.dp).fillMaxWidth()) {
        Box(
            Modifier
                .fillMaxWidth()
                .browserFocusRing(state.focusVisible)
                .control(state, role = Role.Button) { onClick() }
                .semantics { selected = current }
                .drawBehind { drawRect(mark, Offset(if (rtl) size.width - 1.dp.toPx() else 0f, 0f), Size(1.dp.toPx(), size.height)) }
                .padding(start = 13.dp, top = if (coarsePointer) 6.dp else 0.dp, bottom = if (coarsePointer) 6.dp else 0.dp),
        ) { Text(item.label, color = ink) }
    }
}

