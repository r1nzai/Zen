package dev.rinzai.zen.tooltip

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.HoverPopup
import dev.rinzai.zen.hoverPopupContent
import dev.rinzai.zen.hoverPopupTrigger
import dev.rinzai.zen.rememberHoverPopup
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.PopupSide
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii

/**
 * A short hint, shown while the pointer is over its trigger or the trigger has keyboard focus;
 * Escape hides it. Put Modifier.tooltipTrigger(tip) on the trigger and a TooltipContent beside it.
 * For anything to click or fill in, use a Popover.
 */
class TooltipState internal constructor(internal val hover: HoverPopup)

@Composable
fun rememberTooltipState(): TooltipState {
    val hover = rememberHoverPopup(openDelay = 0, closeDelay = 100)
    return remember(hover) { TooltipState(hover) }
}

/** Shown when the pointer enters (a mouse's, not a finger's) or keyboard focus arrives; hidden 100ms after it leaves. */
@Composable
fun Modifier.tooltipTrigger(tip: TooltipState, description: String? = null): Modifier =
    hoverPopupTrigger(tip.hover).semantics { if (description != null) contentDescription = description }

/**
 * The hint: glass, below the trigger (above it if there's no room), centred on it by default.
 * `side = Beside` puts it after the trigger instead (before it if there's no room), as for the
 * icons of a collapsed sidebar.
 */
@Composable
fun TooltipContent(
    tip: TooltipState,
    modifier: Modifier = Modifier,
    side: PopupSide = PopupSide.Below,
    align: PopupAlign = PopupAlign.Center,
    offset: Dp = 5.dp,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = Zen.radii.xl
    AnchoredPopup(tip.hover.popup, side = side, align = align, offset = offset, atLeastTrigger = side == PopupSide.Below, tooltip = true) {
        Box(
            modifier
                .glass(shape, blur = true)
                .hoverPopupContent(tip.hover),
            content = content,
        )
    }
}
