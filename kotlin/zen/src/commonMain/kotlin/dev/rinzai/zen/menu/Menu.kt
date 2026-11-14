package dev.rinzai.zen.menu

import dev.rinzai.zen.popupResize
import dev.rinzai.zen.ScrollArea
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import dev.rinzai.zen.ActiveElement
import dev.rinzai.zen.LocalContentColor
import dev.rinzai.zen.LocalRoving
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.rememberRoving
import dev.rinzai.zen.rovingItem
import dev.rinzai.zen.transition
import kotlinx.coroutines.withTimeoutOrNull
import dev.rinzai.zen.activeElement
import androidx.compose.foundation.layout.PaddingValues

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.PopupSide
import dev.rinzai.zen.PopupState
import dev.rinzai.zen.Portal
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Typeahead
import dev.rinzai.zen.SheetSide
import dev.rinzai.zen.SheetSwipe
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.glass
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.sheetSwipe
import dev.rinzai.zen.rememberSheetMotion
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding

/** How long a submenu stays while the pointer passes from its trigger over the menu (ms). */
private const val PASSING = 250L

/** A menu's items, in order on screen, for the arrow keys and typing to move through. */
@Stable
internal class Items {
    class Entry(val focus: FocusRequester, var label: String, var top: Float = 0f)

    val entries = mutableStateListOf<Entry>()

    /** The item with focus, if one has. */
    var focused: Entry? = null

    /** Its sheet, while a submenu's sheet is open over it. */
    var covered by mutableStateOf(0)

    /** Where the menu is, in the window. */
    var bounds: () -> Rect = { Rect.Zero }
    val typeahead = Typeahead()

    fun ordered() = entries.sortedBy { it.top }
}

/** A menu: open from its trigger (`Modifier.menuTrigger`), closed by choosing, outside presses or Escape. */
@Stable
class MenuState internal constructor(internal val popup: PopupState) {
    val open get() = popup.open
    fun show() = popup.show()
    fun hide() = popup.hide()
    fun toggle() = popup.toggle()

    /** Opened from the keyboard: which item takes focus. */
    internal var edge: Boolean? = null

    /** Opened by a context trigger, at this point in the window (not from a trigger). */
    internal var point by mutableStateOf<Offset?>(null)

    /** What had focus when it was opened at a point, which gets it back as it closes. */
    internal var returnTo: ActiveElement? = null

    /** The Menubar its trigger is in. */
    internal var bar: Bar? = null
}

/** A Menubar's menus, for the arrows to go from one to the next and pointing to switch between them. */
@Stable
internal class Bar {
    val menus = mutableStateListOf<MenuState>()
    var rtl = false

    /** The menu `by` along from `from`, in reading order, open at its first item. */
    fun step(from: MenuState, by: Int) {
        val order = menus.sortedBy { if (rtl) -it.popup.anchor.left else it.popup.anchor.left }
        val next = order.getOrNull((order.indexOf(from) + by + order.size) % order.size) ?: return
        if (next === from) return
        // Focus moves first, so the menu closing doesn't give it back to its own label.
        runCatching { next.popup.trigger.requestFocus() }
        from.hide()
        next.edge = true
        next.show()
    }
}

private val LocalBar = compositionLocalOf<Bar?> { null }

@Composable
fun rememberMenuState(onOpenChange: ((Boolean) -> Unit)? = null): MenuState {
    val popup = rememberPopupState(onOpenChange)
    return remember(popup) { MenuState(popup) }
}

/**
 * What opens `menu`: put it on the Button that toggles it. ArrowDown opens it at its first item,
 * ArrowUp at its last.
 */
fun Modifier.menuTrigger(menu: MenuState): Modifier = this
    .popupAnchor(menu.popup)
    .onKeyEvent { e ->
        if (e.type != KeyEventType.KeyDown || (e.key != Key.DirectionDown && e.key != Key.DirectionUp)) return@onKeyEvent false
        menu.edge = e.key == Key.DirectionDown
        menu.show()
        true
    }

private val LocalClose = compositionLocalOf<() -> Unit> { {} }
private val LocalItems = compositionLocalOf<Items?> { null }
private val LocalSheet = compositionLocalOf { false }

/** Arrow keys, Home and End move through the items (round from end to end); typing jumps to one. */
private fun Modifier.menuKeys(items: Items, menu: MenuState? = null, rtl: Boolean = false): Modifier = onKeyEvent { e ->
    if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
    // In a menubar, the arrows across go to the menu beside this one.
    val bar = menu?.bar
    if (bar != null && (e.key == Key.DirectionLeft || e.key == Key.DirectionRight)) {
        bar.step(menu, if ((e.key == Key.DirectionRight) != rtl) 1 else -1)
        return@onKeyEvent true
    }
    val list = items.ordered()
    if (list.isEmpty()) return@onKeyEvent false
    val i = list.indexOf(items.focused)
    items.typeahead.typed(e)?.let { typed ->
        list.firstOrNull { it.label.trim().lowercase().startsWith(typed) }?.focus?.requestFocus()
        return@onKeyEvent true
    }
    val next = when (e.key) {
        Key.DirectionDown -> i + 1
        Key.DirectionUp -> if (i == -1) list.size - 1 else i - 1
        Key.MoveHome -> 0
        Key.MoveEnd -> list.size - 1
        else -> return@onKeyEvent false
    }
    list[(next + list.size) % list.size].focus.requestFocus()
    true
}

/** Whether a menu shows as a sheet here: asked for, on a narrow window. */
@Composable
private fun sheetHere(sheet: Boolean) = sheet && !LocalPage.current.atLeast(Breakpoint.Md)

/**
 * The menu: glass, below its trigger at its end edge (its start edge in a Menubar) where there's
 * room, at least 176dp wide; opened by a context trigger, at the point it was asked for. Its items
 * take focus from the arrow keys. With `sheet`, on a narrow window it rises from the bottom
 * instead, over a scrim, as phones show menus; swipe it down to close it.
 */
@Composable
fun MenuContent(
    menu: MenuState,
    modifier: Modifier = Modifier,
    align: PopupAlign? = null,
    offset: Dp? = null,
    sheet: Boolean = false,
    label: String? = null,
    /** The shadow under it, in place of glass's own. */
    shadow: Shadow? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val asSheet = sheetHere(sheet)
    val bar = LocalBar.current
    menu.bar = bar
    val point = menu.point
    val align = align ?: if (point != null || bar != null) PopupAlign.Start else PopupAlign.End
    val offset = offset ?: if (point != null) 2.dp else 6.dp
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val page = LocalPage.current
    val items = remember { Items() }
    items.bounds = { menu.popup.bounds }
    val focus = remember { FocusRequester() }
    var inside by remember { mutableStateOf(false) }
    val close = { menu.hide() }
    // Back to the trigger as it closes; opened at a point, back to whatever had focus.
    LaunchedEffect(menu.open) {
        if (menu.open) return@LaunchedEffect
        if (inside) {
            if (menu.point != null) menu.returnTo?.focus() else runCatching { menu.popup.trigger.requestFocus() }
        }
        menu.point = null
        menu.returnTo = null
    }
    val body: @Composable () -> Unit = {
        // Focus on the menu as it opens (an item, opened from the keyboard), once it's there to take it.
        LaunchedEffect(menu.open) {
            if (!menu.open) return@LaunchedEffect
            val edge = menu.edge
            menu.edge = null
            snapshotFlow { items.entries.size }.first { edge == null || it > 0 }
            if (edge == null) focus.requestFocus()
            else items.ordered().let { if (edge) it.first() else it.last() }.focus.requestFocus()
        }
        CompositionLocalProvider(LocalClose provides close, LocalItems provides items, LocalSheet provides asSheet) {
            val list: @Composable (Modifier) -> Unit = { m ->
                Column(
                    m
                        .focusRequester(focus)
                        .onFocusChanged { inside = it.hasFocus }
                        .activeElement()
                        .focusable()
                        .menuKeys(items, menu, rtl)
                        .semantics {
                            paneTitle = label ?: ""
                            if (label != null) contentDescription = label
                        },
                ) {
                    if (asSheet) Grip()
                    content()
                }
            }
            // Taller than a max height given it (max-h-72 overflow-y-auto), it scrolls, its padding (p-1.5) inside; a sheet scrolls itself.
            if (asSheet) list(Modifier) else ScrollArea(vertical = rememberScrollState()) { list(Modifier.padding(6.dp)) }
        }
    }
    if (asSheet) Sheet(menu.popup, modifier, body, under = items.covered > 0) { close() }
    else AnchoredPopup(menu.popup, align = align, offset = offset, atLeastTrigger = true) {
        // As wide as its widest item (max-content), every item that wide.
        Box(modifier.width(IntrinsicSize.Max).widthIn(min = 176.dp).glass(Zen.radii.xl, blur = true, shadow = shadow).popupResize()) { body() }
    }
}

/** An item's padding: px-3 py-2. */
private val ItemPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)

/** The grip at a sheet's top. */
@Composable
private fun Grip() = Box(
    Modifier
        .fillMaxWidth()
        .padding(top = 2.dp, bottom = 8.dp),
    contentAlignment = Alignment.Center,
) { Box(Modifier.width(40.dp).height(4.dp).box(CircleShape, fill = SolidColor(Zen.tokens.tint.color(0.2f)))) }

/**
 * A menu as a phone shows one: edge to edge along the bottom, rising in over a scrim (320ms),
 * swiped down to close. `beside` is a submenu's: it slides in from the side, and the menu under it
 * moves aside and fades.
 */
@Composable
private fun Sheet(
    popup: PopupState,
    modifier: Modifier,
    body: @Composable () -> Unit,
    beside: Boolean = false,
    under: Boolean = false,
    onClose: () -> Unit,
) {
    val page = LocalPage.current
    val t = Zen.tokens
    val reduced = reducedMotion()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val haptics = LocalHapticFeedback.current
    val motion = rememberSheetMotion(popup.open)
    val swipe = motion.swipe
    val aside = remember { Animatable(0f) }
    // Under an open submenu: moved aside and faded.
    LaunchedEffect(under) {
        val to = if (under) 1f else 0f
        if (reduced) aside.snapTo(to) else aside.animateTo(to, tween(320, easing = Ease.Sheet))
    }
    if (!motion.mounted) return
    val scroll = rememberScrollState()
    Portal(page.top) {
        if (!beside) {
            // The scrim: a submenu's sheet lies over the menu's, so only the menu has one.
            Box(
                Modifier
                    .matchParentSize()
                    .graphicsLayer { alpha = motion.shown.value * (1f - swipe.progress) }
                    .box(androidx.compose.ui.graphics.RectangleShape, fill = SolidColor(t.backdropScrim))
                    .pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent().changes.forEach { it.consume() } } },
            )
        }
        val shape = RoundedCornerShape(16.dp, 16.dp, 0.dp, 0.dp)
        Box(
            modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .heightIn(max = page.viewport.height * 0.85f)
                .onGloballyPositioned { popup.bounds = it.boundsInRoot() }
                .graphicsLayer {
                    val side = if (rtl) -1f else 1f
                    if (beside) {
                        translationX = motion.slide.value * size.width * side
                        translationY = swipe.offset
                    } else translationY = motion.offset(size.height)
                    translationX += -0.3f * size.width * aside.value * side
                    alpha = (if (beside) 1f else motion.shown.value) * (1f - aside.value)
                }
                .sheetSwipe(swipe, SheetSide.Bottom, rtl, scroll, haptics, { it.animateTo(0f, tween(320, easing = Ease.Sheet)) }, onClose)
                .glass(shape, blur = true, sides = Sides(top = 1.dp), background = t.card.color(0.9f))
                .verticalScroll(scroll)
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom))
                .padding(start = 8.dp, end = 8.dp, top = 8.dp, bottom = 12.dp),
        ) { body() }
    }
}

/**
 * A choice in a menu: an optional `icon`, its text, chosen by a press, Enter or Space, which
 * closes the menu. `negative` for a destructive one (Delete), drawn in red. `padding` and
 * `spacing` (between its parts) replace px-3 py-2 and gap-3.
 */
@Composable
fun MenuItem(
    onSelect: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    negative: Boolean = false,
    enabled: Boolean = true,
    label: String? = null,
    padding: PaddingValues = ItemPadding,
    spacing: Dp = 12.dp,
    content: @Composable RowScope.() -> Unit,
) {
    val close = LocalClose.current
    ItemRow(modifier, enabled, label, padding = padding, spacing = spacing, onClick = {
        close()
        onSelect()
    }) {
        if (icon != null) Icon(icon, color = if (negative) Zen.tokens.destructive.color() else Zen.tokens.mutedForeground.color())
        if (negative) ProvideText(color = Zen.tokens.destructive.color()) { content() } else content()
    }
}

/** An item's row: hovered or focused, it's lit; it's one of its menu's items for the keys. */
@Composable
private fun ItemRow(
    modifier: Modifier,
    enabled: Boolean,
    label: String?,
    role: Role = Role.Button,
    checked: Boolean? = null,
    lit: Boolean = false,
    keys: Modifier = Modifier,
    onHover: ((Boolean, Offset) -> Unit)? = null,
    padding: PaddingValues = ItemPadding,
    spacing: Dp = 12.dp,
    onClick: () -> Unit,
    content: @Composable RowScope.() -> Unit,
) {
    val items = LocalItems.current
    val sheet = LocalSheet.current
    val state = rememberControlState()
    val focused by state.source.collectIsFocusedAsState()
    val entry = remember { Items.Entry(FocusRequester(), label ?: "") }
    if (label != null) entry.label = label
    if (items != null && enabled) DisposableEffect(items, entry) {
        items.entries.add(entry)
        onDispose { items.entries.remove(entry) }
    }
    if (items != null) {
        if (focused) items.focused = entry else if (items.focused === entry) items.focused = null
    }
    Row(
        modifier
            .fillMaxWidth()
            .heightIn(min = if (sheet) 48.dp else 0.dp)
            .graphicsLayer { alpha = if (enabled) 1f else 0.5f }
            .onGloballyPositioned { entry.top = it.boundsInRoot().top }
            .box(Zen.radii.lg, fill = SolidColor(Zen.tokens.tint.color(if (state.hovered || focused || lit) 0.07f else 0f)))
            .focusRequester(entry.focus)
            .then(keys)
            .then(
                if (onHover == null) Modifier else Modifier.pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) {
                            val e = awaitPointerEvent()
                            val c = e.changes.firstOrNull() ?: continue
                            if (c.type == PointerType.Touch) continue
                            when (e.type) {
                                PointerEventType.Enter -> onHover(true, c.position)
                                PointerEventType.Exit -> onHover(false, c.position)
                            }
                        }
                    }
                },
            )
            .control(state, enabled, role = role, label = label, notAllowed = true, onClick = onClick)
            .semantics {
                this.role = role
                if (checked != null) toggleableState = ToggleableState(checked)
            }
            .padding(padding),
        horizontalArrangement = Arrangement.spacedBy(spacing),
        verticalAlignment = Alignment.CenterVertically,
    ) { ProvideText(style = TextStyles.sm) { content() } }
}

/** What isn't a choice at the menu's top, e.g. who's signed in: a row, px-3 py-2.5 gap-3. */
@Composable
fun MenuHeader(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) = Row(
    modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
    horizontalArrangement = Arrangement.spacedBy(12.dp),
    verticalAlignment = Alignment.CenterVertically,
) { ProvideText(style = TextStyles.sm) { content() } }

/** The mark before a checkbox or radio item's text: a tick, a dot, or room for one. */
@Composable
private fun Mark(content: @Composable () -> Unit) = Box(Modifier.size(16.dp), contentAlignment = Alignment.Center) { content() }

/**
 * A choice that's on or off, e.g. a column to show: choosing it flips `checked` and leaves the menu
 * open, so several can be set at once. A tick shows it's on.
 */
@Composable
fun MenuCheckboxItem(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    content: @Composable RowScope.() -> Unit,
) = ItemRow(modifier, enabled, label, role = Role.Checkbox, checked = checked, onClick = { onCheckedChange(!checked) }) {
    Mark { if (checked) Icon(Icons.CheckMicro, size = 14.dp, color = LocalContentColor.current) }
    content()
}

private class RadioGroup(val value: Any?, val select: (Any?) -> Unit)

private val LocalRadio = compositionLocalOf<RadioGroup?> { null }

/** One choice out of several, e.g. how to sort: MenuRadioItems inside. Choosing one leaves the menu open. */
@Composable
fun <T> MenuRadioGroup(
    value: T,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    @Suppress("UNCHECKED_CAST")
    val group = RadioGroup(value) { onValueChange(it as T) }
    Column(modifier.semantics { if (label != null) contentDescription = label }) {
        CompositionLocalProvider(LocalRadio provides group) { content() }
    }
}

/** One of a MenuRadioGroup's choices; a dot shows it's the one chosen. */
@Composable
fun <T> MenuRadioItem(
    value: T,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val group = LocalRadio.current ?: error("MenuRadioItem must be inside MenuRadioGroup")
    val chosen = group.value == value
    ItemRow(modifier, enabled, label, role = Role.RadioButton, checked = chosen, onClick = { group.select(value) }) {
        Mark { if (chosen) Box(Modifier.size(6.dp).box(CircleShape, fill = SolidColor(LocalContentColor.current))) }
        content()
    }
}

/**
 * A row of menus, as at the top of an app: MenubarTriggers, each with its MenuContent. Tab reaches
 * it once: ←→ move between the menus and ↓ opens one; with one open, ←→ go to the next, and
 * pointing at another label switches to it.
 */
@Composable
fun Menubar(modifier: Modifier = Modifier, label: String? = null, content: @Composable RowScope.() -> Unit) {
    val roving = rememberRoving(Orientation.Horizontal)
    val bar = remember { Bar() }
    bar.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val t = Zen.tokens
    val shape = Zen.radii.xl
    Row(
        modifier
            .glowEdge(shape)
            .box(shape, fill = SolidColor(t.tint.color(0.03f)), border = SolidColor(t.tint.color(0.1f)))
            .padding(4.dp)
            .semantics { if (label != null) contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalRoving provides roving, LocalBar provides bar) { content() }
    }
}

/** A menu's label in a Menubar, which opens it. */
@Composable
fun MenubarTrigger(menu: MenuState, modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) {
    val bar = LocalBar.current ?: error("MenubarTrigger must be inside Menubar")
    val t = Zen.tokens
    val state = rememberControlState(popupOpen = menu.open)
    DisposableEffect(bar, menu) {
        bar.menus += menu
        onDispose { bar.menus -= menu }
    }
    // Pointing at it while another of the bar's menus is open switches to it.
    LaunchedEffect(state.hovered) {
        if (state.hovered && !menu.open && bar.menus.any { it !== menu && it.open }) {
            runCatching { menu.popup.trigger.requestFocus() }
            menu.show()
        }
    }
    val lit = menu.open
    val ink by animateColorAsState(if (state.hovered || lit) t.foreground.color() else t.mutedForeground.color(), transition(150))
    Row(
        modifier
            .height(32.dp)
            .box(Zen.radii.lg, fill = SolidColor(t.tint.color(if (lit) 0.07f else 0f)), shadows = focusRing(state.focusVisible))
            .rovingItem()
            .menuTrigger(menu)
            .control(state) { menu.toggle() }
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) { ProvideText(ink, TextStyles.sm) { content() } }
}

private const val LONG_PRESS = 500L
private const val SLOP = 8f

/**
 * Opens `menu` as a context menu, where it's asked for: a right click (at the pointer), a long
 * press of a finger (where it pressed; the press isn't then a tap on what's under it), or the
 * keyboard's menu key or Shift+F10 (at the bottom of this). Its MenuContent needs no trigger. Goes before the focus target of what it's on (e.g. focusable()), so focus comes back to it as the menu closes.
 */
@Composable
fun Modifier.menuContextTrigger(menu: MenuState, enabled: Boolean = true): Modifier {
    if (!enabled) return this
    val haptics = LocalHapticFeedback.current
    val page = LocalPage.current
    val coordinates = remember { arrayOfNulls<LayoutCoordinates>(1) }
    fun openAt(at: Offset) {
        if (menu.open) return
        menu.returnTo = page.activeElement
        menu.point = at
        menu.popup.anchor = Rect(at, at)
        menu.show()
    }
    return this
        // Focused (before its focus target), it's what gets focus back as the menu closes.
        .activeElement()
        .onGloballyPositioned { coordinates[0] = it }
        .onKeyEvent { e ->
            val asked = e.type == KeyEventType.KeyDown && (e.key == Key.Menu || (e.key == Key.F10 && e.isShiftPressed))
            if (asked) coordinates[0]?.boundsInRoot()?.let { openAt(it.bottomLeft) }
            asked
        }
        .pointerInput(menu) {
            awaitPointerEventScope {
                while (true) {
                    val e = awaitPointerEvent(PointerEventPass.Initial)
                    if (e.type != PointerEventType.Press) continue
                    val press = e.changes.first()
                    val at = coordinates[0]?.localToRoot(press.position) ?: continue
                    if (e.buttons.isSecondaryPressed) {
                        press.consume()
                        openAt(at)
                    } else if (press.type == PointerType.Touch) {
                        val slop = SLOP.dp.toPx()
                        val held = withTimeoutOrNull(LONG_PRESS) {
                            while (true) {
                                val c = awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull { it.id == press.id } ?: break
                                if (!c.pressed || (c.position - press.position).getDistance() > slop) break
                            }
                        }
                        if (held != null) continue
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        openAt(at)
                        // Until the finger lifts, what's under it isn't pressed.
                        do {
                            val c = awaitPointerEvent(PointerEventPass.Initial)
                            c.changes.forEach { it.consume() }
                        } while (c.changes.any { it.pressed })
                    }
                }
            }
        }
}

/** A line between groups of items. */
@Composable
fun MenuSeparator(modifier: Modifier = Modifier) = Box(
    modifier
        .fillMaxWidth()
        .padding(horizontal = 8.dp, vertical = 4.dp)
        .height(1.dp)
        .box(androidx.compose.ui.graphics.RectangleShape, fill = SolidColor(Zen.tokens.tint.color(0.07f))),
)

/** A submenu's state, shared by its trigger and content. */
@Stable
internal class Sub(val popup: PopupState) {
    var label by mutableStateOf("")
    var focusFirst = false
    var timer: Job? = null

    fun hideSoon(scope: kotlinx.coroutines.CoroutineScope) {
        timer?.cancel()
        timer = scope.launch {
            delay(PASSING)
            popup.hide()
        }
    }
}

private val LocalSub = compositionLocalOf<Sub?> { null }

/** A submenu: a MenuSubTrigger, and the MenuSubContent it opens beside it. */
@Composable
fun MenuSub(content: @Composable () -> Unit) {
    val popup = rememberPopupState()
    val sub = remember(popup) { Sub(popup) }
    CompositionLocalProvider(LocalSub provides sub, content = content)
}

/**
 * The item opening a submenu, with a chevron: pointed at (a mouse), clicked or ArrowRight. It stays
 * open while the pointer passes over the menu to it.
 */
@Composable
fun MenuSubTrigger(
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    label: String,
    content: @Composable RowScope.() -> Unit = { Text(label) },
) {
    val sub = LocalSub.current ?: error("MenuSubTrigger must be inside MenuSub")
    val sheet = LocalSheet.current
    val scope = rememberCoroutineScope()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val t = Zen.tokens
    sub.label = label
    fun show(first: Boolean) {
        sub.timer?.cancel()
        sub.focusFirst = first
        sub.popup.show()
    }
    val menu = LocalItems.current
    ItemRow(
        modifier.popupAnchor(sub.popup),
        enabled = true,
        label = label,
        lit = sub.popup.open,
        keys = Modifier.onPreviewKeyEvent { e ->
            val forward = if (rtl) Key.DirectionLeft else Key.DirectionRight
            if (e.type == KeyEventType.KeyDown && (e.key == forward || e.key == Key.Enter || e.key == Key.Spacebar || e.key == Key.NumPadEnter)) {
                show(true)
                true
            } else false
        },
        onHover = { entered, at ->
            if (sheet) return@ItemRow
            // Off over the menu, it goes unless the pointer reaches it soon; off the menu, it stays.
            val over = sub.popup.anchor.topLeft + at
            if (entered) show(false)
            else if (menu != null && over in menu.bounds()) sub.hideSoon(scope)
        },
        onClick = { show(false) },
    ) {
        if (icon != null) Icon(icon, color = t.mutedForeground.color())
        Row(Modifier.weight(1f)) { content() }
        Icon(Icons.ChevronRightMicro, Modifier.graphicsLayer { if (rtl) scaleX = -1f }, color = t.mutedForeground.color())
    }
}

/**
 * A submenu's items, beside its trigger, its first item level with it. ArrowLeft (or Escape) goes
 * back to the trigger. In a sheet, it slides in over the menu, with a way back at its top.
 */
@Composable
fun MenuSubContent(
    modifier: Modifier = Modifier,
    offset: Dp = 8.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    val sub = LocalSub.current ?: error("MenuSubContent must be inside MenuSub")
    val sheet = LocalSheet.current
    val close = LocalClose.current
    val m = LocalMessages.current
    val items = remember { Items() }
    items.bounds = { sub.popup.bounds }
    val parent = LocalItems.current
    val scope = rememberCoroutineScope()
    val focus = remember { FocusRequester() }
    var inside by remember { mutableStateOf(false) }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val over = sheet && sub.popup.open
    DisposableEffect(parent, over) {
        if (over && parent != null) parent.covered++
        onDispose { if (over && parent != null) parent.covered-- }
    }
    fun back() {
        sub.popup.hide()
        runCatching { sub.popup.trigger.requestFocus() }
    }
    LaunchedEffect(sub.popup.open) {
        if (!sub.popup.open && inside) runCatching { sub.popup.trigger.requestFocus() }
    }
    val body: @Composable () -> Unit = {
        LaunchedEffect(sub.popup.open) {
            if (!sub.popup.open) return@LaunchedEffect
            snapshotFlow { items.entries.size }.first { it > 0 }
            if (sub.focusFirst) items.ordered().first().focus.requestFocus() else focus.requestFocus()
        }
        CompositionLocalProvider(LocalClose provides close, LocalItems provides items, LocalSheet provides sheet) {
            Column(
                Modifier
                    .focusRequester(focus)
                    .onFocusChanged { inside = it.hasFocus }
                    .activeElement()
                    .focusable()
                    .onKeyEvent { e ->
                        val backKey = if (rtl) Key.DirectionRight else Key.DirectionLeft
                        if (e.type == KeyEventType.KeyDown && e.key == backKey) { back(); true } else false
                    }
                    .menuKeys(items)
                    .pointerInput(sub) {
                        awaitPointerEventScope {
                            while (true) {
                                val e = awaitPointerEvent()
                                val c = e.changes.firstOrNull() ?: continue
                                if (c.type == PointerType.Touch || sheet) continue
                                if (e.type == PointerEventType.Enter) sub.timer?.cancel()
                                // Back over the menu (not its trigger): it goes unless the pointer returns.
                                if (e.type == PointerEventType.Exit) {
                                    val at = sub.popup.bounds.topLeft + c.position
                                    if (parent != null && at in parent.bounds() && at !in sub.popup.anchor) sub.hideSoon(scope)
                                }
                            }
                        }
                    },
            ) {
                if (sheet) {
                    Grip()
                    ItemRow(Modifier, enabled = true, label = m.back, onClick = ::back) {
                        Icon(Icons.ChevronRightMicro, Modifier.graphicsLayer { scaleX = if (rtl) 1f else -1f }, color = Zen.tokens.mutedForeground.color())
                        Text(sub.label, style = TextStyles.medium, color = Zen.tokens.mutedForeground.color())
                    }
                    MenuSeparator()
                }
                content()
            }
        }
    }
    if (sheet) Sheet(sub.popup, modifier, body, beside = true) { close() }
    else AnchoredPopup(sub.popup, side = PopupSide.Beside, align = PopupAlign.Start, offset = offset, margin = (-6).dp) {
        // As wide as its widest item (max-content), every item that wide.
        Box(modifier.width(IntrinsicSize.Max).widthIn(min = 176.dp).glass(Zen.radii.xl, blur = true).popupResize().padding(6.dp)) { body() }
    }
}
