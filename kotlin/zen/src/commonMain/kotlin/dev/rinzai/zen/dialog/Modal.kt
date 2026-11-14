package dev.rinzai.zen.dialog

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector1D
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.LockPage
import dev.rinzai.zen.Modal
import dev.rinzai.zen.Zen
import dev.rinzai.zen.backdropBlur
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.reducedMotion
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/** A modal surface's state while it opens, shows and closes: see rememberModal. */
@Stable
internal class ModalState(val modal: Modal) {
    /** The surface's opacity and scale (.95 to 1), over 200ms. */
    val shown = Animatable(0f)
    /** The scrim's opacity, over 150ms. */
    val scrim = Animatable(0f)
    /** In the top layer: from opening until it has faded out. */
    var mounted by mutableStateOf(false)
        internal set
    /** The centre of the control it was opened from (in the window), which it grows out of and shrinks back into. */
    internal var from: Offset? = null
    internal var surface: LayoutCoordinates? = null
}

/**
 * What showModal() gives a surface: while `open`, the page holds still, its popups close and
 * focus is kept to the topmost modal (Escape there calls `cancel`); closing gives focus back to the
 * control that had it. The state animates it in and out.
 */
@Composable
internal fun rememberModal(open: Boolean, cancel: () -> Unit, grow: Boolean = true): ModalState {
    val page = LocalPage.current
    val reduced = reducedMotion()
    val onCancel by rememberUpdatedState(cancel)
    val state = remember { ModalState(Modal { onCancel() }) }
    LaunchedEffect(open) {
        if (open) {
            state.mounted = true
            // Before focus moves into it: what had focus is what it was opened from.
            state.from = if (grow) page.activeElement?.bounds?.center else null
        }
        val to = if (open) 1f else 0f
        if (reduced) {
            state.shown.snapTo(to)
            state.scrim.snapTo(to)
        } else coroutineScope {
            launch { state.shown.animateTo(to, tween(if (state.from != null) 280 else 200, easing = Ease.OutSoft)) }
            launch { state.scrim.animateTo(to, tween(150, easing = Ease.Css)) }
        }
        if (!open) state.mounted = false
    }
    if (open) {
        LockPage()
        DisposableEffect(state.modal) {
            page.popups.hideAll()
            // What had focus gets it back once it closes, as a dialog gives it back.
            val opener = page.activeElement
            page.modals += state.modal
            onDispose {
                page.modals -= state.modal
                opener?.focus()
            }
        }
    }
    return state
}

/** A modal surface fading and scaling up as it opens (from .95, or from .4 out of the control it was opened from), and back as it closes. */
internal fun Modifier.modalSurface(state: ModalState) = this
    .onGloballyPositioned { state.surface = it }
    .graphicsLayer {
        val shown = state.shown.value
        val from = state.from
        val start = if (from != null) 0.4f else 0.95f
        val scale = start + (1f - start) * shown
        alpha = shown
        scaleX = scale
        scaleY = scale
        val at = state.surface?.takeIf { it.isAttached }?.positionInWindow()
        if (from != null && at != null && size.width > 0f && size.height > 0f) {
            transformOrigin = TransformOrigin((from.x - at.x) / size.width, (from.y - at.y) / size.height)
        }
    }

/** The ::backdrop, blurred: a press on it is a press on the dialog outside its content, and calls `onPress`. */
@Composable
internal fun BoxScope.ModalScrim(alpha: () -> Float, onPress: () -> Unit) {
    val press by rememberUpdatedState(onPress)
    Box(
        Modifier
            .matchParentSize()
            .graphicsLayer { this.alpha = alpha() }
            .then(if (coarsePointer) Modifier else Modifier.backdropBlur(RectangleShape, 8f))
            .box(RectangleShape, fill = SolidColor(Zen.tokens.backdropScrim))
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    var pressed = false
                    while (true) {
                        val e = awaitPointerEvent()
                        e.changes.forEach { it.consume() }
                        when (e.type) {
                            PointerEventType.Press -> pressed = true
                            PointerEventType.Release -> if (pressed) { pressed = false; press() }
                        }
                    }
                }
            },
    )
}

/** Toasts show over the topmost modal, not under its scrim. */
@Composable
internal fun BoxScope.ModalToasts(state: ModalState) {
    val page = LocalPage.current
    if (page.modals.lastOrNull() === state.modal) page.toastDeck?.invoke(this)
}
