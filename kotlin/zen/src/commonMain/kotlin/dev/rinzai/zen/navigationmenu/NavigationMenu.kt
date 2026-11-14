package dev.rinzai.zen.navigationmenu

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.popupResize
import dev.rinzai.zen.LocalPopupEntrance
import androidx.compose.ui.graphics.graphicsLayer
import dev.rinzai.zen.Ease
import dev.rinzai.zen.SWAP_MS
import dev.rinzai.zen.SWAP_OUT_MS
import dev.rinzai.zen.SWAP_IN_AT
import dev.rinzai.zen.SWAP_SHIFT
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.focus.focusProperties
import kotlin.math.sign
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.PopupState
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.transition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.yield

private class Menu(val openDelay: Long, val closeDelay: Long) {
    val items = mutableStateListOf<Item>()
}

@Stable
private class Item(val menu: Menu, val popup: PopupState, private val scope: CoroutineScope) {
    /** Opened by the pointer resting on it: a click then keeps it, and leaving closes it. */
    var byHover = false
    private var timer: Job? = null
    var triggerFocused = false
    var contentFocused = false

    /** Its panel's contents and their modifier, for the panel taking over from it to show as they go. */
    var panel: (@Composable () -> Unit)? = null
    var panelModifier: Modifier = Modifier

    /** The item whose panel this one's took over from, until its contents have shown going. */
    var cameFrom: Item? = null

    /** Opens it, in place of the panel that's open: the menu has one panel, moving from label to label. */
    private fun open(byHover: Boolean) {
        this.byHover = byHover
        menu.items.firstOrNull { it !== this && it.popup.open }?.let { other ->
            popup.handOff = other.popup
            cameFrom = other
            other.popup.givingWay = true
            other.popup.hide()
        }
        popup.show()
    }

    /** Opens it after the hover delay, or at once when another of the menu's panels is already open. */
    fun pointIn() {
        timer?.cancel()
        if (popup.open) return
        if (menu.items.any { it !== this && it.popup.open }) open(true)
        else timer = scope.launch {
            delay(menu.openDelay)
            open(true)
        }
    }

    fun pointOut() {
        timer?.cancel()
        if (popup.open && byHover) timer = scope.launch {
            delay(menu.closeDelay)
            popup.hide()
        }
    }

    /** A click: opens or closes it, but keeps one the pointer just opened. */
    fun toggle() {
        val keep = popup.open && byHover
        byHover = false
        if (keep) return
        if (popup.open) popup.hide() else open(false)
    }

    /** Tab moving on past the panel closes it. */
    fun focusMoved() = scope.launch {
        yield()
        if (popup.open && !triggerFocused && !contentFocused) popup.hide()
    }

    fun cancel() = timer?.cancel()
}

private val LocalMenu = compositionLocalOf<Menu?> { null }
private val LocalItem = compositionLocalOf<Item?> { null }

/** Inside a panel, a link is a row; at the top, it's one of the bar's labels. */
private val LocalInPanel = compositionLocalOf { false }

/** A mouse pointing at it, or leaving it. */
private fun Modifier.pointing(item: Item) = pointerInput(item) {
    awaitPointerEventScope {
        while (true) {
            val e = awaitPointerEvent()
            if (e.changes.firstOrNull()?.type != PointerType.Mouse) continue
            when (e.type) {
                PointerEventType.Enter -> item.pointIn()
                PointerEventType.Exit -> item.pointOut()
            }
        }
    }
}

/**
 * A site's navigation: links, and labels that open panels of links below them, on hover (after
 * `openDelay`; at once while another is open) or with a click or Enter. It has one panel at a time:
 * moving to another label, the panel moves on to it, easing to its place and size as its links
 * change. Escape, a press outside or
 * Tab moving on closes it. Fill it with NavigationMenuItems, each a NavigationMenuLink, or a
 * NavigationMenuTrigger and a NavigationMenuContent. Name it with `label` when there's more than
 * one on the page.
 */
@Composable
fun NavigationMenu(
    modifier: Modifier = Modifier,
    openDelay: Long = 150,
    closeDelay: Long = 200,
    label: String? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val menu = remember(openDelay, closeDelay) { Menu(openDelay, closeDelay) }
    CompositionLocalProvider(LocalMenu provides menu) {
        Row(
            modifier.semantics { if (label != null) contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

/** One place in the menu: a link, or a label with its panel. */
@Composable
fun NavigationMenuItem(content: @Composable () -> Unit) {
    val menu = LocalMenu.current ?: error("NavigationMenuItem must be inside NavigationMenu")
    val popup = rememberPopupState()
    val scope = rememberCoroutineScope()
    val item = remember(menu, popup) { Item(menu, popup, scope) }
    popup.onOpenChange = { if (!it) item.byHover = false }
    DisposableEffect(item) {
        menu.items += item
        onDispose {
            item.cancel()
            menu.items -= item
        }
    }
    CompositionLocalProvider(LocalItem provides item, content = content)
}

/** A bar label's look: muted, brighter on hover, lit while its panel is open or it's the page you're on. */
@Composable
private fun Modifier.label(open: Boolean, focusVisible: Boolean): Modifier {
    val t = Zen.tokens
    val fill by animateColorAsState(if (open) t.tint.color(0.07f) else t.tint.color(0f), transition(150))
    return this
        .height(36.dp)
        .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(focusVisible))
        .padding(horizontal = 12.dp)
}

@Composable
private fun labelColor(open: Boolean, active: Boolean, hovered: Boolean): Color {
    val t = Zen.tokens
    val color by animateColorAsState(if (open || active || hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
    return color
}

/** The label that opens its item's panel; a chevron after it turns over while it's open. */
@Composable
fun NavigationMenuTrigger(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) {
    val item = LocalItem.current ?: error("NavigationMenuTrigger must be inside NavigationMenuItem")
    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    val open = item.popup.open
    val color = labelColor(open, false, state.hovered)
    Row(
        modifier
            .popupAnchor(item.popup)
            .pointing(item)
            .onFocusChanged {
                val had = item.triggerFocused
                item.triggerFocused = it.hasFocus
                if (had && !it.hasFocus) item.focusMoved()
            }
            .label(open, state.focusVisible)
            .control(state) { item.toggle() },
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = color, style = TextStyles.sm) { content() }
        Chevron(if (open) 180f else 0f, color = Zen.tokens.mutedForeground.color())
    }
}

/**
 * The panel: glass, below its label (above it if there's no room), lined up with its start.
 * Lay out its links as you like; `modifier` sizes it (e.g. a width).
 */
@Composable
fun NavigationMenuContent(
    modifier: Modifier = Modifier,
    align: PopupAlign = PopupAlign.Start,
    offset: Dp = 8.dp,
    label: String? = null,
    content: @Composable () -> Unit,
) {
    val item = LocalItem.current ?: error("NavigationMenuContent must be inside NavigationMenuItem")
    item.panel = content
    item.panelModifier = modifier
    AnchoredPopup(item.popup, align = align, offset = offset) {
        CompositionLocalProvider(LocalInPanel provides true) {
            Box(
                Modifier
                    .pointing(item)
                    .onFocusChanged {
                        // Only focus leaving: it also reports "unfocused" as it first appears.
                        val had = item.contentFocused
                        item.contentFocused = it.hasFocus
                        if (had && !it.hasFocus) item.focusMoved()
                    }
                    .semantics { if (label != null) paneTitle = label }
                    .glass(Zen.radii.xl, blur = true)
                    .popupResize(),
            ) {
                val entrance = LocalPopupEntrance.current
                // Moved on from another label's panel: its links go as this one's come, both sliding the way it went.
                val gone = remember(entrance) { item.cameFrom.takeIf { entrance?.from != null }.also { item.cameFrom = null } }
                val swap = entrance?.swap
                if (gone != null && swap != null && swap.value < 1f) {
                    val dir = sign(item.popup.anchor.center.x - gone.popup.anchor.center.x)
                    Box(
                        Modifier
                            // Laid out at its own size, taking none: the panel eases to the new contents.
                            .layout { m, _ ->
                                val p = m.measure(Constraints())
                                layout(0, 0) { p.place(0, 0) }
                            }
                            .clearAndSetSemantics {}
                            .focusProperties { canFocus = false }
                            .graphicsLayer {
                                val t = swap.value * SWAP_MS
                                alpha = 1f - Ease.OutSoft.transform((t / SWAP_OUT_MS).coerceAtMost(1f))
                                translationX = -dir * SWAP_SHIFT.toPx() * Ease.OutSoft.transform(swap.value)
                            }
                            .then(gone.panelModifier)
                            .padding(8.dp),
                    ) { gone.panel?.invoke() }
                }
                Box(
                    // Inside the eased size: what it sizes is the panel's contents, which the glass eases to fit.
                    modifier
                        .padding(8.dp)
                        .graphicsLayer {
                            if (gone == null || swap == null) return@graphicsLayer
                            val t = swap.value * SWAP_MS
                            alpha = Ease.OutSoft.transform(((t - SWAP_IN_AT) / (SWAP_MS - SWAP_IN_AT)).coerceIn(0f, 1f))
                            val dir = sign(item.popup.anchor.center.x - gone.popup.anchor.center.x)
                            translationX = dir * SWAP_SHIFT.toPx() * (1f - Ease.OutSoft.transform(swap.value))
                        },
                ) { content() }
            }
        }
    }
}

/**
 * A link: one of the bar's labels at the top, or a row in a panel (with an optional
 * `description` under its text). `active` marks the page you're on; `onClick` goes there (your
 * router's navigation).
 */
@Composable
fun NavigationMenuLink(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    active: Boolean = false,
    description: String? = null,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val inPanel = LocalInPanel.current
    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    if (!inPanel) {
        val color = labelColor(false, active, state.hovered)
        Row(
            modifier
                .semantics { selected = active }
                .label(false, state.focusVisible)
                .control(state, role = Role.Button, onClick = onClick),
            verticalAlignment = Alignment.CenterVertically,
        ) { ProvideText(color = color, style = TextStyles.sm) { content() } }
        return
    }
    val fill by animateColorAsState(
        when {
            active -> t.primary.color(0.1f)
            state.hovered -> t.tint.color(0.06f)
            else -> t.tint.color(0f)
        },
        transition(150),
    )
    Column(
        modifier
            .semantics { selected = active }
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .control(state, role = Role.Button, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        if (description == null) ProvideText(style = TextStyles.sm) { content() }
        else {
            ProvideText(style = TextStyles.sm.merge(TextStyles.medium)) { content() }
            Text(description, style = TextStyles.xs.copy(lineHeight = 1.375.em), color = t.mutedForeground.color())
        }
    }
}
