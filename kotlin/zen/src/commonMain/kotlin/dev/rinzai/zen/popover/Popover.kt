package dev.rinzai.zen.popover

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupResize
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.PopupState
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii

/**
 * A panel that opens from a button: a small form, a profile card, settings. Open it from its
 * trigger (`Button(onClick = state::toggle, Modifier.popupAnchor(state), popupOpen = state.open)`);
 * presses outside and Escape close it, and focus returns to the button. Glass, below the trigger
 * (above it if there's no room), centred on it by default, as wide as its content and at least as
 * wide as the trigger. Name it with `label` when it holds a form. For a hint on hover or focus,
 * use Tooltip; for a list of actions, Menu.
 */
@Composable
fun PopoverContent(
    state: PopupState,
    modifier: Modifier = Modifier,
    align: PopupAlign = PopupAlign.Center,
    offset: Dp = 5.dp,
    label: String? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = Zen.radii.xl
    AnchoredPopup(state, align = align, offset = offset, atLeastTrigger = true) {
        Box(
            modifier
                .glass(shape, blur = true)
                .popupResize()
                .semantics {
                    paneTitle = label ?: ""
                    if (label != null) contentDescription = label
                },
            content = content,
        )
    }
}
