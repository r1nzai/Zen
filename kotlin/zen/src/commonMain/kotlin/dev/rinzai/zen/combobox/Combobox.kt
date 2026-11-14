package dev.rinzai.zen.combobox

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupResize
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.PopupState
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.scrollIntoView
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.collapse.Collapse
import dev.rinzai.zen.control
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.glass
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.transition

/** A Combobox's state, which its parts read: the items, the search, what's chosen and what the keyboard is on. */
@Stable
class ComboboxState<T> internal constructor(internal val popup: PopupState) {
    internal var multiple = false
    internal var keyOf: (T) -> String = { it.toString() }
    internal var textOf: (T) -> String = { it.toString() }
    internal var items: List<T> = emptyList()
    internal var selectedItems: List<T> = emptyList()
    internal var filter: (T, String) -> Boolean = { _, _ -> true }
    internal var choose: (String) -> Unit = {}

    /** Chosen keys, in the order they were chosen. */
    var chosen: List<String> by mutableStateOf(emptyList())
        internal set

    /** What's typed in the search. */
    var query by mutableStateOf("")
        internal set

    /** The item the keyboard (or pointer) is on. */
    var active by mutableStateOf<String?>(null)
        internal set

    internal var create: ((String) -> Unit)? by mutableStateOf(null)
    internal var itemHeight: Dp = 35.dp
    internal var inside = false

    /** The items matching the search. */
    val matches: List<T> get() = if (query.isEmpty()) items else items.filter { filter(it, query) }

    /** Adds what was typed, through ComboboxCreate (if there is one). */
    internal fun add() {
        val create = create ?: return
        create(query)
        query = ""
    }

    internal fun toggle(key: String) {
        choose(key)
        if (!multiple) popup.hide()
    }
}

private val LocalCombobox = compositionLocalOf<ComboboxState<*>?> { null }

@Suppress("UNCHECKED_CAST")
@Composable
private fun <T> combobox(): ComboboxState<T> =
    (LocalCombobox.current ?: error("Combobox parts must be inside a Combobox")) as ComboboxState<T>

/**
 * Pick an item from a list you can search: a field that opens a panel with a
 * search box and the matching items. Compose it from ComboboxTrigger,
 * ComboboxPopup, ComboboxSearch, ComboboxList (lazy, for long lists),
 * ComboboxItem, ComboboxEmpty and ComboboxCreate. Keyboard: Enter, Space or ↓
 * on the field opens it, typing searches, ↑↓ move, Enter chooses, Escape
 * closes. Items can be any shape: say how to read a key and text from one with
 * `itemKey` and `itemText` (both the item as text by default).
 */
@Composable
fun <T> Combobox(
    items: List<T>,
    value: String?,
    onValueChange: (String) -> Unit,
    itemText: (T) -> String = { it.toString() },
    itemKey: (T) -> String = itemText,
    /** Whether an item matches the search (default: its text contains it, any case). */
    filter: (T, String) -> Boolean = { item, query -> itemText(item).contains(query, ignoreCase = true) },
    /** Chosen items that aren't in `items` (e.g. just created), so the field can still show them. */
    selectedItems: List<T> = emptyList(),
    content: @Composable () -> Unit,
) {
    val change by rememberUpdatedState(onValueChange)
    ComboboxRoot(items, listOfNotNull(value), false, { change(it) }, itemText, itemKey, filter, selectedItems, content)
}

/** Combobox for several items at once: they show as removable chips in the field, and choosing one keeps it open. */
@Composable
fun <T> Combobox(
    items: List<T>,
    value: List<String>,
    onValueChange: (List<String>) -> Unit,
    itemText: (T) -> String = { it.toString() },
    itemKey: (T) -> String = itemText,
    filter: (T, String) -> Boolean = { item, query -> itemText(item).contains(query, ignoreCase = true) },
    selectedItems: List<T> = emptyList(),
    content: @Composable () -> Unit,
) {
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    ComboboxRoot(items, value, true, { key -> change(if (key in current) current - key else current + key) }, itemText, itemKey, filter, selectedItems, content)
}

@Composable
private fun <T> ComboboxRoot(
    items: List<T>,
    chosen: List<String>,
    multiple: Boolean,
    choose: (String) -> Unit,
    itemText: (T) -> String,
    itemKey: (T) -> String,
    filter: (T, String) -> Boolean,
    selectedItems: List<T>,
    content: @Composable () -> Unit,
) {
    lateinit var box: ComboboxState<T>
    val popup = rememberPopupState { open ->
        if (open) return@rememberPopupState
        // Each opening starts fresh: the whole list, nothing highlighted.
        box.active = null
        box.query = ""
        // Closed while focus was inside (Escape, choosing): back to the field.
        if (box.inside) runCatching { box.popup.trigger.requestFocus() }
    }
    box = remember { ComboboxState(popup) }
    box.multiple = multiple
    box.items = items
    box.selectedItems = selectedItems
    box.keyOf = itemKey
    box.textOf = itemText
    box.filter = filter
    box.choose = choose
    box.chosen = chosen
    CompositionLocalProvider(LocalCombobox provides box, content = content)
}

/**
 * The field: shows the choice (text, or chips for several) or the placeholder, and opens the
 * panel. `content` shows the value your own way. 224dp wide unless the modifier sets a width.
 */
@Composable
fun ComboboxTrigger(
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    label: String? = null,
    content: (@Composable RowScope.() -> Unit)? = null,
) {
    val t = Zen.tokens
    val box = combobox<Any?>()
    val popup = box.popup
    val state = rememberControlState(popupOpen = popup.open)
    Row(
        // The default width inside the caller's, so a width they set wins.
        modifier
            .width(224.dp)
            .alpha(if (enabled) 1f else 0.5f)
            .popupAnchor(popup)
            .onKeyEvent { e ->
                if (!enabled || e.type != KeyEventType.KeyDown || e.key !in listOf(Key.Enter, Key.NumPadEnter, Key.Spacebar, Key.DirectionDown)) return@onKeyEvent false
                popup.show()
                true
            }
            .control(state, enabled, Role.DropdownList, notAllowed = true) { popup.toggle() }
            .fieldControl(label)
            .fieldBox(size, state.hovered && !coarsePointer && enabled, state.focusVisible || popup.open),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Takes all the space beside the chevron, whatever its content.
        Row(
            Modifier.weight(1f).clipToBounds(),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProvideText(color = if (enabled) t.foreground.color() else t.mutedForeground.color(), style = TextStyles.sm) {
                if (content != null) content() else ComboboxValue(placeholder ?: LocalMessages.current.selectPlaceholder)
            }
        }
        Chevron(if (popup.open) 180f else 0f, color = t.mutedForeground.color())
    }
}

private class Chip(val key: String, val text: String)

/** The value as it shows by default: the chosen item's text, or removable chips for several. */
@Composable
private fun ComboboxValue(placeholder: String) {
    val box = combobox<Any?>()
    val m = LocalMessages.current
    val byKey = (box.selectedItems + box.items).associateBy(box.keyOf)
    // Chosen items with text to show (an item without text, e.g. an empty "nothing chosen" item, shows the placeholder).
    val chosen = box.chosen.mapNotNull { key -> byKey[key]?.let(box.textOf)?.takeIf { it.isNotEmpty() }?.let { Chip(key, it) } }
    if (chosen.isEmpty()) return Text(placeholder, color = Zen.tokens.placeholder, maxLines = 1, softWrap = false)
    if (!box.multiple) return Text(chosen[0].text, maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis)
    Collapse(chosen, Modifier.fillMaxWidth(), gap = 4.dp, badgeModifier = Modifier.height(24.dp)) { chip, _ ->
        Badge(Modifier.height(24.dp), BadgeVariant.Secondary, contentPadding = PaddingValues(start = 6.dp, end = 4.dp, top = 2.dp, bottom = 2.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(chip.text, softWrap = false)
                RemoveChip(m.remove(chip.text)) { box.toggle(chip.key) }
            }
        }
    }
}

/** A chip's ×: it turns a quarter while pointed at, and removing doesn't open the list. */
@Composable
private fun RemoveChip(label: String, onClick: () -> Unit) {
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val turn by animateFloatAsState(if (hovered) 90f else 0f, transition(300))
    Button(
        onClick,
        // Up 1px: capitals sit above their line box's centre, so this centres the × on them.
        Modifier.offset(y = (-1).dp),
        variant = ButtonVariant.Ghost,
        size = ButtonSize.IconSm,
        shape = Zen.radii.sm,
        side = 16.dp,
        label = label,
        source = source,
    ) {
        Icon(Icons.XMark, Modifier.rotate(turn), size = 12.dp)
    }
}

/** The panel under the field, as wide as it: put ComboboxSearch and ComboboxList in it, a line between each part. */
@Composable
fun ComboboxPopup(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val box = combobox<Any?>()
    val line = Zen.tokens.tint.color(0.1f)
    AnchoredPopup(box.popup, align = PopupAlign.Start, offset = 5.dp, matchTrigger = true) {
        Box(
            modifier
                .fillMaxWidth()
                .glass(Zen.radii.xl, blur = true)
                .popupResize()
                .onFocusChanged { box.inside = it.hasFocus },
        ) {
            // divide-y: a 1px line above each part but the first, in the room left for it.
            val lines = remember { mutableListOf<Int>() }
            Layout(
                content,
                Modifier.fillMaxWidth().drawWithContent {
                    drawContent()
                    for (y in lines) drawRect(line, Offset(0f, y.toFloat()), Size(size.width, 1.dp.toPx()))
                },
            ) { measurables, constraints ->
                val gap = 1.dp.roundToPx()
                val placeables = measurables.map { it.measure(constraints.copy(minHeight = 0)) }
                val height = placeables.sumOf { it.height } + gap * (placeables.size - 1).coerceAtLeast(0)
                lines.clear()
                layout(constraints.maxWidth, height) {
                    var y = 0
                    placeables.forEachIndexed { i, p ->
                        if (i > 0) {
                            lines += y
                            y += gap
                        }
                        p.place(0, y)
                        y += p.height
                    }
                }
            }
        }
    }
}

/** The search box: focused when the panel opens; ↑↓ move through the matches and Enter chooses. */
@Composable
fun ComboboxSearch(placeholder: String? = null, label: String? = null) {
    val box = combobox<Any?>()
    val m = LocalMessages.current
    val focus = remember { FocusRequester() }
    LaunchedEffect(box.popup.open) { if (box.popup.open) runCatching { focus.requestFocus() } }
    // InputGroup's parts, without the field shell (the panel is the surface).
    Row(
        Modifier.fillMaxWidth().height(40.dp).padding(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        InputGroupAddon { Icon(Icons.Search, size = 16.dp) }
        ProvideText(color = Zen.tokens.foreground.color(), style = TextStyles.sm) {
            InputGroupInput(
                box.query,
                {
                    box.query = it
                    box.active = null
                },
                Modifier
                    .focusRequester(focus)
                    .onPreviewKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                        val keys = box.matches.map(box.keyOf)
                        val i = box.active?.let { keys.indexOf(it) } ?: -1
                        fun go(to: Int) {
                            if (keys.isNotEmpty()) box.active = keys[to.mod(keys.size)]
                        }
                        when (e.key) {
                            Key.DirectionDown -> go(i + 1)
                            Key.DirectionUp -> go(if (i == -1) keys.size - 1 else i - 1)
                            Key.Enter, Key.NumPadEnter -> {
                                val active = box.active
                                if (active != null) box.toggle(active)
                                else if (keys.isEmpty() && box.query.isNotEmpty()) box.add()
                            }
                            else -> return@onPreviewKeyEvent false
                        }
                        true
                    },
                placeholder = placeholder ?: m.search,
                label = label ?: m.searchOptions,
            )
        }
    }
}

private object ContentKey

/**
 * The matching items, composed only while in view (so thousands stay fast), each `itemHeight`
 * tall; `renderItem` draws each (default: a ComboboxItem). Put ComboboxEmpty or ComboboxCreate in
 * `content`, for no matches.
 */
@Composable
fun <T> ComboboxList(
    itemHeight: Dp = 35.dp,
    renderItem: (@Composable (T) -> Unit)? = null,
    content: @Composable () -> Unit = {},
) {
    val box = combobox<T>()
    box.itemHeight = itemHeight
    val list = rememberLazyListState()
    val matches = box.matches
    // New search, new results: show them from the top.
    LaunchedEffect(box.query) { list.scrollToItem(0) }
    // The active item scrolled just into view, as the web list's scrollTop is set.
    LaunchedEffect(box.active) {
        val key = box.active ?: return@LaunchedEffect
        val index = matches.indexOfFirst { box.keyOf(it) == key }.takeIf { it >= 0 } ?: return@LaunchedEffect
        list.scrollIntoView(index)
    }
    LazyColumn(
        Modifier.fillMaxWidth().heightIn(max = 288.dp),
        state = list,
        contentPadding = PaddingValues(vertical = 4.dp),
    ) {
        items(matches, key = { box.keyOf(it) }) { item -> renderItem?.invoke(item) ?: ComboboxItem(item) }
        // Its own key: by index, it would be recreated as the matches change.
        item(key = ContentKey) { content() }
    }
}

/** One item in a ComboboxList: a check when chosen, then its text (or your own content). */
@Composable
fun <T> ComboboxItem(item: T, modifier: Modifier = Modifier, content: (@Composable () -> Unit)? = null) {
    val t = Zen.tokens
    val box = combobox<T>()
    val key = box.keyOf(item)
    val chosen = key in box.chosen
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    Row(
        modifier
            .fillMaxWidth()
            .height(box.itemHeight)
            .box(RectangleShape, fill = if (box.active == key || hovered) SolidColor(t.muted.color()) else null)
            .hoverable(source)
            .pointerHoverIcon(PointerIcon.Hand)
            .pointerInput(key) {
                awaitPointerEventScope {
                    while (true) if (awaitPointerEvent().type == PointerEventType.Move && box.active != key) box.active = key
                }
            }
            .pointerInput(key) { detectTapGestures { box.toggle(key) } }
            .semantics {
                selected = chosen
                onClick { box.toggle(key); true }
            }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(16.dp), contentAlignment = Alignment.CenterStart) {
            if (chosen) Icon(Icons.CheckMicro, size = 14.dp, color = t.primary.color())
        }
        Box(Modifier.weight(1f)) {
            ProvideText(color = t.foreground.color(), style = TextStyles.sm) {
                content?.invoke() ?: Text(box.textOf(item), maxLines = 1, overflow = TextOverflow.Ellipsis, softWrap = false)
            }
        }
    }
}

/** Shown when the search matches nothing. */
@Composable
fun ComboboxEmpty(content: (@Composable () -> Unit)? = null) {
    val box = combobox<Any?>()
    if (box.query.isEmpty() || box.matches.isNotEmpty()) return
    ProvideText(color = Zen.tokens.mutedForeground.color(), style = TextStyles.sm) {
        Box(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)) {
            content?.invoke() ?: Text(LocalMessages.current.noResults)
        }
    }
}

/**
 * Offered when the search matches nothing: adds what was typed (Enter works too). `content`
 * renders the row from the text (default "Add …").
 */
@Composable
fun ComboboxCreate(onCreate: (String) -> Unit, content: (@Composable (String) -> Unit)? = null) {
    val box = combobox<Any?>()
    val create by rememberUpdatedState(onCreate)
    DisposableEffect(box) {
        val mine: (String) -> Unit = { create(it) }
        box.create = mine
        onDispose { if (box.create === mine) box.create = null }
    }
    if (box.query.isEmpty() || box.matches.isNotEmpty()) return
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    Box(
        Modifier
            .fillMaxWidth()
            .box(RectangleShape, fill = if (hovered) SolidColor(Zen.tokens.muted.color()) else null)
            .hoverable(source)
            .pointerHoverIcon(PointerIcon.Hand)
            .pointerInput(Unit) { detectTapGestures { box.add() } }
            .semantics { onClick { box.add(); true } }
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        ProvideText(color = Zen.tokens.foreground.color(), style = TextStyles.sm) {
            content?.invoke(box.query) ?: Text(LocalMessages.current.add(box.query))
        }
    }
}
