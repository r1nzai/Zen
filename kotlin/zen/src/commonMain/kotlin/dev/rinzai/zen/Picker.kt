package dev.rinzai.zen

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

/** A picker's previous or next arrow (Calendar, MonthPicker), mirrored right to left. */
@Composable
internal fun PickerNav(label: String, icon: ImageVector, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val fill by animateColorAsState(t.tint.color(if (state.hovered) 0.07f else 0f), transition(150))
    val color by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
    Box(
        Modifier
            .size(32.dp)
            .box(Zen.radii.md, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .control(state, label = label, onClick = onClick)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        val mirror = if (LocalLayoutDirection.current == LayoutDirection.Rtl) -1f else 1f
        Icon(icon, Modifier.scale(mirror, 1f), size = 16.dp, color = color)
    }
}

/** A month in a picker's month grid (Calendar, MonthPicker), filled with the primary colour when it's the chosen one. */
@Composable
internal fun PickerMonth(name: String, label: String, selected: Boolean, enabled: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val fill by animateColorAsState(
        when {
            selected -> t.primary.color()
            state.hovered && enabled -> t.tint.color(0.07f)
            else -> t.tint.color(0f)
        },
        transition(150),
    )
    val color by animateColorAsState(if (selected) t.primaryForeground.color() else t.foreground.color(), transition(150))
    Text(
        name,
        modifier
            .alpha(if (enabled) 1f else 0.35f)
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .control(state, enabled, label = label, onClick = onClick)
            .then(if (enabled) Modifier else Modifier.pointerHoverIcon(PointerIcon.Default))
            .semantics {
                contentDescription = label
                toggleableState = ToggleableState(selected)
                if (!enabled) disabled()
            }
            .padding(vertical = 8.dp),
        style = TextStyles.sm,
        color = color,
        align = TextAlign.Center,
    )
}

/**
 * A picker's field and its popup (MonthPicker, DatePicker): the field shows `shown` (or the
 * placeholder) with `icon`, and glows while the popup is open; the popup holds `content`, and
 * `clearLabel` under it when there's `onClear`. `content` is composed while it's open only, so
 * each opening starts afresh.
 */
@Composable
internal fun PickerField(
    popup: PopupState,
    shown: String?,
    placeholder: String,
    popupLabel: String,
    modifier: Modifier,
    enabled: Boolean,
    size: FieldSize,
    label: String?,
    onClear: (() -> Unit)?,
    clearLabel: String,
    icon: @Composable (open: Boolean) -> Unit,
    leading: (@Composable () -> Unit)? = null,
    textStyle: TextStyle = TextStyles.sm,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val state = rememberControlState(popupOpen = popup.open)
    Row(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .fillMaxWidth()
            .popupAnchor(popup)
            .control(state, enabled, Role.Button) { popup.toggle() }
            .fieldControl(label)
            .pointerHoverIcon(if (enabled) PointerIcon.Hand else PointerIcon.Default)
            .fieldBox(size, state.hovered && !coarsePointer && enabled, state.focusVisible || popup.open),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            leading?.invoke()
            Text(
                shown ?: placeholder,
                style = textStyle,
                color = if (shown == null) t.placeholder else t.foreground.color(),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                softWrap = false,
            )
        }
        icon(popup.open)
    }
    AnchoredPopup(popup, align = PopupAlign.Start) {
        // As wide as what it holds (max-content), the clear option across it.
        Column(
            Modifier
                .width(IntrinsicSize.Max)
                .glass(Zen.radii.xl, blur = true)
                .popupResize()
                .semantics {
                    paneTitle = popupLabel
                    contentDescription = popupLabel
                }
                .padding(12.dp),
        ) {
            content()
            if (onClear != null) PickerClear(clearLabel) {
                onClear()
                popup.hide()
            }
        }
    }
}

/** The option under a picker's popup that empties it ("Clear", "No end"). */
@Composable
private fun PickerClear(label: String, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val color by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
    Text(
        label,
        Modifier
            .popupRow()
            .padding(top = 8.dp)
            .fillMaxWidth()
            .box(Zen.radii.lg, border = SolidColor(t.tint.color(0.06f)), sides = Sides.Top, shadows = focusRing(state.focusVisible))
            .control(state, onClick = onClick)
            .padding(start = 8.dp, end = 8.dp, top = 10.dp, bottom = 6.dp),
        style = TextStyles.sm,
        color = color,
        align = TextAlign.Center,
    )
}
