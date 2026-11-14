package dev.rinzai.zen

import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.runtime.getValue
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.foundation.focusable
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.focus.focusProperties
import androidx.compose.foundation.focusGroup
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput

/**
 * A control's state, as CSS's pseudo-classes see it: :hover (only with a hovering pointer, or while
 * its popup is open), :active, :focus-visible (focus from the keyboard).
 */
@Stable
class ControlState internal constructor(
    val source: MutableInteractionSource,
    val hovered: Boolean,
    val pressed: Boolean,
    val focusVisible: Boolean,
)

/** Tracks a control's hover, press and keyboard focus; `popupOpen` holds the hover look while its popup is open. */
@Composable
fun rememberControlState(source: MutableInteractionSource = remember { MutableInteractionSource() }, popupOpen: Boolean = false): ControlState {
    val hovered = source.collectIsHoveredAsState().value && !coarsePointer
    val pressed = source.collectIsPressedAsState().value
    val focused = source.collectIsFocusedAsState().value
    return ControlState(source, hovered || popupOpen, pressed, focused && Zen.page.keyboard)
}

/**
 * A button-like element: clickable (Enter and Space too), focusable, with a pointer cursor; its
 * states land in `state`. Disabled, it's none of those (pointer-events: none), or, `notAllowed`,
 * shows the not-allowed cursor (cursor: not-allowed).
 */
fun Modifier.control(
    state: ControlState,
    enabled: Boolean = true,
    role: Role? = Role.Button,
    label: String? = null,
    notAllowed: Boolean = false,
    onClick: () -> Unit,
): Modifier =
    if (!enabled) (if (notAllowed) pointerHoverIcon(cssCursor(CssCursor.NotAllowed)) else this)
    else this
        .hoverable(state.source)
        .pointerHoverIcon(PointerIcon.Hand)
        .activeElement()
        .clickable(state.source, indication = null, role = role, onClickLabel = label, onClick = onClick)

/** focus-ring: 2px in the ring colour at half, outside the box, while focused from the keyboard. */
@Composable
fun focusRing(visible: Boolean): List<Shadow> =
    if (visible) listOf(ring(Zen.tokens.ring.color(0.5f), 2f)) else emptyList()

/**
 * Chrome's own focus ring (`outline: auto`), for a part that keeps the browser's: a 2px ring at
 * the box, with a 1px edge outside it in the opposite tone so it shows on any background.
 */
@Composable
fun Modifier.browserFocusRing(visible: Boolean): Modifier {
    if (!visible) return this
    val dark = Zen.page.appearance == Appearance.Dark
    val ring = if (dark) Color(0xFFE2E2E4) else Color(0xFF1E1D1F)
    val edge = if (dark) Color(0xFF101010) else Color.White
    return drawWithContent {
        drawContent()
        val px = density
        fun box(grow: Float, radius: Float) = Path().apply {
            addRoundRect(RoundRect(-grow * px, -grow * px, size.width + grow * px, size.height + grow * px, CornerRadius(radius * px)))
        }
        drawPath(Path().apply { op(box(3f, 3.5f), box(2f, 2.5f), PathOperation.Difference) }, edge)
        drawPath(Path().apply { op(box(2f, 2.5f), box(0f, 0.5f), PathOperation.Difference) }, ring)
    }
}

/** The ring colour a focus ring is drawn in, for parts drawing their own. */
val ringColor: Color @Composable get() = Zen.tokens.ring.color(0.5f)

/** HTML's tabindex="-1": focused when asked (focus()), and not a stop when tabbing. */
internal class FocusOnRequest {
    val requester = FocusRequester()
    var asked = false

    fun focus() {
        asked = true
        requester.requestFocus()
    }
}

internal fun Modifier.focusOnRequest(target: FocusOnRequest): Modifier = this
    .focusRequester(target.requester)
    .focusProperties { canFocus = target.asked }
    .onFocusChanged { if (!it.isFocused) target.asked = false }
    .focusable()

/** HTML's `inert`: while `on`, what's inside isn't focused, read or pressed. */
fun Modifier.inert(on: Boolean): Modifier = this
    .then(if (on) Modifier.clearAndSetSemantics {} else Modifier)
    .focusProperties { onEnter = { if (on) cancelFocusChange() } }
    .focusGroup()
    .pointerInput(on) {
        if (on) awaitPointerEventScope {
            while (true) awaitPointerEvent(PointerEventPass.Initial).changes.forEach { it.consume() }
        }
    }

/** `active:scale-[0.97]`: a control gives under the pointer while it's held, over its own transition `spec`. */
@Composable
internal fun Modifier.pressScale(state: ControlState, spec: AnimationSpec<Float>, enabled: Boolean = true): Modifier {
    val scale by animateFloatAsState(if (state.pressed && enabled) 0.97f else 1f, spec)
    return graphicsLayer { scaleX = scale; scaleY = scale }
}
