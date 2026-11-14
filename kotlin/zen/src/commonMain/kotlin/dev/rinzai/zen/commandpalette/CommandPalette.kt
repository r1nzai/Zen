package dev.rinzai.zen.commandpalette

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.dialog
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.dialog.ModalScrim
import dev.rinzai.zen.dialog.ModalToasts
import dev.rinzai.zen.dialog.modalSurface
import dev.rinzai.zen.dialog.rememberModal
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.radii
import dev.rinzai.zen.scrollIntoView
import dev.rinzai.zen.selection

/** Something a CommandPalette finds and runs: a page, a command, a record. */
class CommandItem(
    val label: String,
    val onSelect: () -> Unit,
    /** Unique among the items; the label by default. */
    val id: String = label,
    /** Items with the same group are listed together, under it. */
    val group: String? = null,
    /** More words it's found by. */
    val keywords: List<String> = emptyList(),
    /** Before the label, at 16dp. */
    val icon: (@Composable () -> Unit)? = null,
    /** At the end, e.g. a shortcut or where it goes. */
    val hint: (@Composable () -> Unit)? = null,
)

/** The items matching `query`: each of its words is in the label, keywords or group. Labels starting with it come first. */
fun search(items: List<CommandItem>, query: String): List<CommandItem> {
    val words = query.lowercase().split(Regex("\\s+")).filter { it.isNotEmpty() }
    if (words.isEmpty()) return items
    val q = query.trim().lowercase()
    return items
        .filter { item ->
            val text = (listOf(item.label) + item.keywords + (item.group ?: "")).joinToString(" ").lowercase()
            words.all { it in text }
        }
        .sortedBy { if (it.label.lowercase().startsWith(q)) 0 else 1 }
}

/** Calls `open` on ⌘K or Ctrl+K, anywhere on the page, while this is in the composition. */
@Composable
fun CommandPaletteShortcut(open: () -> Unit, key: Key = Key.K) {
    val page = LocalPage.current
    val latest by rememberUpdatedState(open)
    DisposableEffect(page, key) {
        val handler: (KeyEvent) -> Boolean = { e ->
            if (e.type == KeyEventType.KeyDown && e.key == key && (e.isMetaPressed || e.isCtrlPressed) && !e.isAltPressed && !e.isShiftPressed) {
                latest()
                true
            } else false
        }
        page.keys += handler
        onDispose { page.keys -= handler }
    }
}

/** A row of the list: a group's heading or an item (with its place among the matches). */
private sealed interface Row {
    data class Heading(val group: String, val first: Boolean) : Row
    data class Entry(val item: CommandItem, val index: Int, val firstInGroup: Boolean) : Row
}

/**
 * Search everything and act on it (pages, commands, records): a field over a list that narrows as
 * you type, in a modal panel near the top of the window. Arrow keys move, Enter runs the item and
 * closes. Open it from a button, or anywhere with ⌘K / Ctrl+K (CommandPaletteShortcut).
 */
@Composable
fun CommandPalette(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    items: List<CommandItem>,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    /** Shown when nothing matches. */
    empty: (@Composable () -> Unit)? = null,
    /** Names the palette and its list, for screen readers. */
    label: String? = null,
) {
    val page = LocalPage.current
    val t = Zen.tokens
    val m = LocalMessages.current
    val name = label ?: m.commands
    val close by rememberUpdatedState { onOpenChange(false) }
    val state = rememberModal(open, { close() })
    var query by remember { mutableStateOf("") }
    var active by remember { mutableIntStateOf(0) }
    // Each time it opens, it starts afresh.
    LaunchedEffect(open) {
        if (open) {
            query = ""
            active = 0
        }
    }
    if (!state.mounted) return

    val shown = remember(items, query) { search(items, query) }
    val rows = remember(shown) {
        buildList {
            shown.withIndex().groupBy { it.value.group ?: "" }.entries.forEachIndexed { g, (group, entries) ->
                if (group.isNotEmpty()) add(Row.Heading(group, g == 0))
                entries.forEachIndexed { i, (index, item) -> add(Row.Entry(item, index, g > 0 && i == 0 && group.isEmpty())) }
            }
        }
    }
    val current = minOf(active, shown.size - 1)
    val list = rememberLazyListState()
    LaunchedEffect(current, rows) {
        val row = rows.indexOfFirst { it is Row.Entry && it.index == current }
        if (row >= 0) list.scrollIntoView(row)
    }
    fun run(item: CommandItem?) {
        if (item == null) return
        close()
        item.onSelect()
    }
    val input = remember { FocusRequester() }
    val shape = Zen.radii.xl
    val window = page.viewport

    Portal(page.top) {
        ModalScrim({ state.scrim.value }) { close() }
        Column(
            Modifier
                .align(Alignment.TopCenter)
                .padding(top = window.height * 0.12f)
                .then(modifier)
                .width(minOf(576.dp, window.width - 32.dp))
                .modalSurface(state)
                .glowEdge(shape)
                .glass(shape, blur = true, sides = Sides.All, background = t.card.color(0.9f))
                .semantics {
                    dialog()
                    paneTitle = name
                },
        ) {
            if (open) LaunchedEffect(Unit) {
                withFrameNanos {}
                runCatching { input.requestFocus() }
            }
            val style = TextStyles.base.copy(color = t.foreground.color())
            CompositionLocalProvider(LocalTextSelectionColors provides t.selection) {
                BasicTextField(
                    query,
                    {
                        query = it
                        active = 0
                    },
                    Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .box(RectangleShape, border = SolidColor(t.tint.color(0.07f)), sides = Sides.Bottom)
                        .focusRequester(input)
                        .onPreviewKeyEvent { e ->
                            if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                            val count = shown.size
                            val to = when {
                                e.key == Key.DirectionDown -> (current + 1).mod(count.coerceAtLeast(1))
                                e.key == Key.DirectionUp -> (current - 1).mod(count.coerceAtLeast(1))
                                e.key == Key.MoveHome && e.isCtrlPressed -> 0
                                e.key == Key.MoveEnd && e.isCtrlPressed -> count - 1
                                else -> null
                            }
                            when {
                                to != null && count > 0 -> active = to
                                e.key == Key.Enter || e.key == Key.NumPadEnter -> run(shown.getOrNull(current))
                                else -> return@onPreviewKeyEvent false
                            }
                            true
                        }
                        .semantics {
                            contentDescription = name
                            shown.getOrNull(current)?.let { stateDescription = it.label }
                        },
                    singleLine = true,
                    textStyle = style,
                    cursorBrush = SolidColor(t.foreground.color()),
                    decorationBox = { inner ->
                        // The padding is the field's, as an <input>'s is: a press there places the caret too. The
                        // line is centred in its height; the text spans its width, for textAlign.
                        Box(Modifier.padding(horizontal = 20.dp), contentAlignment = Alignment.CenterStart) {
                            Box(Modifier.fillMaxWidth(), propagateMinConstraints = true) {
                                if (query.isEmpty()) Text(placeholder ?: m.search, Modifier.fillMaxWidth(), style = style.copy(color = t.placeholder), maxLines = 1)
                                inner()
                            }
                        }
                    },
                )
            }
            if (shown.isEmpty()) {
                ProvideText(color = t.mutedForeground.color(), style = TextStyles.sm) {
                    Box(Modifier.fillMaxWidth().padding(8.dp).padding(horizontal = 12.dp, vertical = 32.dp), contentAlignment = Alignment.Center) {
                        empty?.invoke() ?: Text(m.noResults)
                    }
                }
            } else LazyColumn(
                Modifier
                    .fillMaxWidth()
                    .heightIn(max = minOf(384.dp, window.height * 0.6f))
                    .semantics { contentDescription = name },
                state = list,
                contentPadding = PaddingValues(8.dp),
            ) {
                items(rows.size, key = { i -> rows[i].let { if (it is Row.Entry) "item:" + it.item.id else "group:" + (it as Row.Heading).group } }) { i ->
                    when (val row = rows[i]) {
                        is Row.Heading -> Text(
                            row.group.uppercase(),
                            Modifier
                                .padding(top = if (row.first) 0.dp else 8.dp)
                                .padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 4.dp)
                                .semantics { hideFromAccessibility() },
                            style = TextStyles.xs2.copy(letterSpacing = 0.1.em),
                            color = t.mutedForeground.color(),
                        )
                        is Row.Entry -> Item(row.item, row.index == current, Modifier.padding(top = if (row.firstInGroup) 8.dp else 0.dp), { if (row.index != current) active = row.index }) { run(row.item) }
                    }
                }
            }
        }
        ModalToasts(state)
    }
}

@Composable
private fun Item(item: CommandItem, on: Boolean, modifier: Modifier, point: () -> Unit, choose: () -> Unit) {
    val t = Zen.tokens
    val pointed by rememberUpdatedState(point)
    val chosen by rememberUpdatedState(choose)
    Row(
        modifier
            .fillMaxWidth()
            .box(
                Zen.radii.lg,
                fill = if (on) SolidColor(t.primary.color(0.15f)) else null,
                shadows = if (on) listOf(Shadow(spread = 1f, color = t.primary.color(0.25f), inset = true)) else emptyList(),
            )
            .pointerHoverIcon(PointerIcon.Hand)
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val e = awaitPointerEvent()
                        when (e.type) {
                            PointerEventType.Move -> pointed()
                            PointerEventType.Release -> if (e.changes.any { it.previousPressed && !it.pressed }) chosen()
                        }
                    }
                }
            }
            .semantics {
                selected = on
                onClick { chosen(); true }
            }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val ink = if (on) t.foreground.color() else t.mutedForeground.color()
        if (item.icon != null) ProvideText(color = ink) { Box(Modifier.size(16.dp), contentAlignment = Alignment.Center) { item.icon.invoke() } }
        Text(item.label, Modifier.weight(1f), style = TextStyles.sm, color = ink, maxLines = 1, overflow = TextOverflow.Ellipsis, softWrap = false)
        if (item.hint != null) ProvideText(color = t.mutedForeground.color(), style = TextStyles.xs) { item.hint.invoke() }
    }
}
