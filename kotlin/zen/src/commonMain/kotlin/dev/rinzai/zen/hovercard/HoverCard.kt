package dev.rinzai.zen.hovercard

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupResize
import dev.rinzai.zen.AnchoredPopup
import dev.rinzai.zen.BodyText
import dev.rinzai.zen.HoverPopup
import dev.rinzai.zen.Text
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.hoverPopupContent
import dev.rinzai.zen.hoverPopupTrigger
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberHoverPopup

/**
 * A preview of what a link points to, e.g. a person or an account: a glass card shown after the
 * pointer rests on the link (`openDelay`, in ms), or while it has keyboard focus, and kept while
 * the pointer or focus is on the card; it goes `closeDelay` after the pointer leaves. Escape hides
 * it. What it shows is extra: everything in it should be reachable by following the link too.
 */
@Stable
class HoverCardState internal constructor(internal val hover: HoverPopup)

@Composable
fun rememberHoverCardState(openDelay: Long = 500, closeDelay: Long = 200): HoverCardState {
    val hover = rememberHoverPopup(openDelay, closeDelay)
    return remember(hover) { HoverCardState(hover) }
}

/** Your own trigger for the card (a router's link, say): put this on it. */
@Composable
fun Modifier.hoverCardTrigger(card: HoverCardState): Modifier = hoverPopupTrigger(card.hover)

/** What the card previews, as a link: accent text, underlined while pointed at; `onClick` follows it. */
@Composable
fun HoverCardTrigger(card: HoverCardState, text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    val state = rememberControlState()
    // Read only when drawing, so it needn't be state: laid out, the text is drawn after.
    val baseline = remember { floatArrayOf(0f) }
    val ink = t.primary.color()
    Text(
        text,
        modifier
            .hoverCardTrigger(card)
            .box(Zen.radii.sm, shadows = focusRing(state.focusVisible))
            .control(state, role = Role.Button, onClick = onClick)
            // underline-offset-4: the line 4px under the baseline, its thickness the font's (1px here).
            .drawBehind {
                if (state.hovered) {
                    val y = baseline[0] + 4.dp.toPx()
                    drawLine(ink, Offset(0f, y), Offset(size.width, y), 1.dp.toPx())
                }
            },
        color = ink,
        onTextLayout = { baseline[0] = it.firstBaseline },
        inline = true,
    )
}

/**
 * The card: glass, w-72 and padded, below the trigger (above it if there's no room), lined up with
 * its start by default. `offset` is the gap from the trigger.
 */
@Composable
fun HoverCardContent(
    card: HoverCardState,
    modifier: Modifier = Modifier,
    align: PopupAlign = PopupAlign.Start,
    offset: Dp = 8.dp,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = Zen.radii.xl
    // Portaled to the body on the web: the body's text, not the trigger's.
    AnchoredPopup(card.hover.popup, align = align, offset = offset) {
        BodyText {
            Box(
                modifier
                    .width(288.dp)
                    .glass(shape, blur = true)
                    .popupResize()
                    .hoverPopupContent(card.hover)
                    .padding(16.dp),
                content = content,
            )
        }
    }
}
