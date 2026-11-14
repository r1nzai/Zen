package dev.rinzai.zen.select

import dev.rinzai.zen.popupResize
import dev.rinzai.zen.ScrollArea
import dev.rinzai.zen.activeElement
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.first
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Typeahead
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState

/** One choice, as its SelectItem reports it: its text, whether it can be chosen, where it is in the list. */
private class Option(var label: String, var enabled: Boolean) {
    var top by mutableStateOf(Float.NaN)
    val bring = BringIntoViewRequester()
}

@Stable
private class SelectList(val choose: (String) -> Unit) {
    val options = mutableStateMapOf<String, Option>()
    var value: String? by mutableStateOf(null)
    var active: String? by mutableStateOf(null)

    /** The options as laid out in the list, in order (groups and your own wrappers included). */
    fun ordered() = options.entries.filter { !it.value.top.isNaN() }.sortedBy { it.value.top }

    /** The next option that can be chosen from `from` in direction `step`, round from end to end. */
    fun move(from: String?, step: Int): String? {
        val list = ordered()
        if (list.isEmpty()) return from
        val start = if (from == null) (if (step == 1) -1 else list.size) else list.indexOfFirst { it.key == from }
        for (n in 1..list.size) {
            val i = ((start + step * n) % list.size + list.size) % list.size
            if (list[i].value.enabled) return list[i].key
        }
        return from
    }
}

private val LocalSelect = staticCompositionLocalOf<SelectList?> { null }

/** Composed only to hear each item's label (the list itself shows only while open). */
private val LocalListing = staticCompositionLocalOf { false }

/**
 * Pick one value from a short list: a field-styled button that opens a list below it. Keyboard:
 * arrows, Home/End, type to jump, Enter to choose, Escape to close. Fill it with SelectItem,
 * organised with SelectGroup and SelectSeparator. For long or searchable lists, use Combobox.
 * `label` names it where nothing on screen does (a Field's label otherwise).
 */
@Composable
fun Select(
    value: String?,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    label: String? = null,
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    listModifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val popup = rememberPopupState()
    val state = rememberControlState(popupOpen = popup.open)
    val change by rememberUpdatedState(onValueChange)
    val select = remember { SelectList { v -> change(v); popup.hide() } }
    select.value = value
    val listFocus = remember { FocusRequester() }
    var inside by remember { mutableStateOf(false) }
    val typeahead = remember { Typeahead() }

    // Open, it starts on the chosen option or the first that can be chosen, and takes focus so the
    // keys work; shut from inside, focus goes back to the trigger.
    LaunchedEffect(popup.open) {
        if (popup.open) {
            snapshotFlow { select.ordered().size }.first { it > 0 }
            select.active = value?.takeIf { it in select.options } ?: select.move(null, 1)
            runCatching { listFocus.requestFocus() }
        } else if (inside) runCatching { popup.trigger.requestFocus() }
    }
    LaunchedEffect(select.active) { select.active?.let { select.options[it]?.bring?.bringIntoView() } }

    val chosen = value?.let { select.options[it]?.label }
    // One node: the trigger, and its items, composed but never shown, so the chosen one's text is
    // known while it's shut (a node of their own would take a gap in the parent's arrangement).
    Layout(
        {
            CompositionLocalProvider(LocalSelect provides select, LocalListing provides true, content = content)
            Row(
                Modifier
                    .alpha(if (enabled) 1f else 0.5f)
                    .fillMaxWidth()
                    .popupAnchor(popup)
                    .onKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown || popup.open || (e.key != Key.DirectionDown && e.key != Key.DirectionUp)) return@onKeyEvent false
                        popup.show()
                        true
                    }
                    .control(state, enabled, Role.DropdownList) { popup.toggle() }
                    .fieldControl(label)
                    .pointerHoverIcon(if (enabled) PointerIcon.Hand else PointerIcon.Default)
                    .fieldBox(size, state.hovered && !coarsePointer && enabled, state.focusVisible || popup.open),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    chosen ?: placeholder ?: LocalMessages.current.selectPlaceholder,
                    Modifier.weight(1f),
                    style = TextStyles.sm,
                    color = if (chosen == null) t.placeholder else t.foreground.color(),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    softWrap = false,
                )
                Chevron(if (popup.open) 180f else 0f, color = t.mutedForeground.color())
            }
        },
        modifier,
    ) { measurables, constraints ->
        val trigger = measurables.last().measure(constraints)
        layout(trigger.width, trigger.height) { trigger.place(0, 0) }
    }

    AnchoredPopup(popup, align = dev.rinzai.zen.PopupAlign.Start, atLeastTrigger = true) {
        // As wide as its widest item (max-content), and at least the trigger's width.
        Box(listModifier.width(IntrinsicSize.Max).glass(Zen.radii.xl, blur = true).popupResize().padding(vertical = 4.dp)) {
            ScrollArea(Modifier.heightIn(max = 288.dp), vertical = rememberScrollState()) { Column(
                Modifier
                    .focusRequester(listFocus)
                    .onFocusChanged { inside = it.hasFocus }
                    .activeElement()
                    .focusable()
                    .onKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                        when (e.key) {
                            Key.DirectionDown -> select.active = select.move(select.active, 1)
                            Key.DirectionUp -> select.active = select.move(select.active, -1)
                            Key.MoveHome -> select.active = select.move(null, 1)
                            Key.MoveEnd -> select.active = select.move(null, -1)
                            Key.Enter, Key.NumPadEnter, Key.Spacebar -> select.active?.let { a ->
                                if (select.options[a]?.enabled == true) select.choose(a)
                            }
                            Key.Tab -> {
                                popup.hide()
                                return@onKeyEvent false
                            }
                            else -> {
                                val typed = typeahead.typed(e) ?: return@onKeyEvent false
                                select.ordered()
                                    .firstOrNull { it.value.enabled && it.value.label.lowercase().startsWith(typed) }
                                    ?.let { select.active = it.key }
                            }
                        }
                        true
                    },
            ) {
                CompositionLocalProvider(LocalSelect provides select, LocalListing provides false) {
                    ProvideText(color = t.foreground.color(), style = TextStyles.sm) { content() }
                }
            } }
        }
    }
}

/**
 * One choice in a Select. `label` shows in the field once it's chosen and is matched when typing
 * to jump; `content` shows it in the list (the label, by default).
 */
@Composable
fun SelectItem(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: (@Composable () -> Unit)? = null,
) {
    val select = LocalSelect.current ?: error("SelectItem must be inside a Select")
    val option = remember(select, value) { select.options[value] ?: Option(label, enabled) }
    option.label = label
    option.enabled = enabled
    if (LocalListing.current) {
        DisposableEffect(select, value) {
            select.options[value] = option
            onDispose { if (select.options[value] === option) select.options.remove(value) }
        }
        return
    }
    DisposableEffect(option) { onDispose { option.top = Float.NaN } }
    val t = Zen.tokens
    val chosen = select.value == value
    Row(
        modifier
            .fillMaxWidth()
            .bringIntoViewRequester(option.bring)
            .onGloballyPositioned { option.top = it.positionInRoot().y }
            .box(RectangleShape, fill = if (select.active == value) SolidColor(t.muted.color()) else null)
            .pointerHoverIcon(if (enabled) PointerIcon.Hand else PointerIcon.Default)
            .pointerInput(value, enabled) {
                awaitPointerEventScope {
                    while (true) {
                        if (awaitPointerEvent().type == PointerEventType.Move && enabled) select.active = value
                    }
                }
            }
            .pointerInput(value, enabled) { detectTapGestures { if (enabled) select.choose(value) } }
            .semantics { selected = chosen }
            .alpha(if (enabled) 1f else 0.5f)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(16.dp), contentAlignment = Alignment.CenterStart) {
            if (chosen) Icon(Icons.CheckMicro, size = 14.dp, color = t.primary.color())
        }
        Box(Modifier.weight(1f)) { content?.invoke() ?: Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) }
    }
}

/** A labelled group of SelectItems. */
@Composable
fun SelectGroup(label: String, content: @Composable () -> Unit) {
    if (LocalListing.current) return content()
    Column(Modifier.fillMaxWidth()) {
        Text(
            label,
            Modifier.padding(start = 12.dp, end = 12.dp, top = 8.dp, bottom = 4.dp),
            style = TextStyles.xs.merge(TextStyles.medium),
            color = Zen.tokens.mutedForeground.color(),
        )
        content()
    }
}

/** A hairline between items or groups. */
@Composable
fun SelectSeparator() {
    if (LocalListing.current) return
    Box(Modifier.padding(horizontal = 8.dp, vertical = 4.dp).fillMaxWidth().height(1.dp).box(RectangleShape, fill = SolidColor(Zen.tokens.tint.color(0.07f))))
}
