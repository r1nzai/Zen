package dev.rinzai.zen.dialog

import dev.rinzai.zen.ScrollArea
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.dialog
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.LockPage
import dev.rinzai.zen.Modal
import dev.rinzai.zen.Portal
import dev.rinzai.zen.SheetSide
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.backdropBlur
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.transition
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberSheetMotion
import dev.rinzai.zen.sheetSwipe
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** The edge a dialog comes in from as a sheet. */
enum class DialogSide { Bottom, Left, Right }

/** A centred dialog's width: 28rem, or 60rem for a large one. */
enum class DialogSize { Md, Lg }

private val LocalDialogClose = staticCompositionLocalOf<() -> Unit> { {} }

/**
 * A modal dialog, as the browser shows one with showModal(): over a blurred scrim, in glass, with
 * its `title` and a close button; the page under it holds still and takes no focus. It opens with
 * focus on its first control (or `initialFocus`) and gives focus back where it was as it closes.
 * Escape, a press on the scrim and the close button close it (unless it's not `dismissible`).
 * Centred, it scales up; with a `side` it's a sheet sliding in from that edge, swiped back to close.
 */
@Composable
fun Dialog(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    dismissible: Boolean = true,
    initialFocus: FocusRequester? = null,
    size: DialogSize = DialogSize.Md,
    side: DialogSide? = null,
    closeLabel: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val page = LocalPage.current
    val t = Zen.tokens
    val m = LocalMessages.current
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val haptics = LocalHapticFeedback.current
    val close by rememberUpdatedState { onOpenChange(false) }
    val cancel = { if (dismissible) close() }

    val sheet = rememberSheetMotion(open && side != null)
    val state = rememberModal(open, { cancel() }, grow = side == null)
    val focus = remember { FocusRequester() }
    val focusManager = LocalFocusManager.current
    var holding by remember { mutableStateOf(true) }
    LaunchedEffect(open) { if (open) holding = true }
    if (!state.mounted && !sheet.mounted) return

    val shape = when (side) {
        null -> Zen.radii.xl
        DialogSide.Bottom -> RoundedCornerShape(topStart = (t.radius + 6).dp, topEnd = (t.radius + 6).dp)
        DialogSide.Right -> if (rtl) RoundedCornerShape(topEnd = (t.radius + 6).dp, bottomEnd = (t.radius + 6).dp)
        else RoundedCornerShape(topStart = (t.radius + 6).dp, bottomStart = (t.radius + 6).dp)
        DialogSide.Left -> if (rtl) RoundedCornerShape(topStart = (t.radius + 6).dp, bottomStart = (t.radius + 6).dp)
        else RoundedCornerShape(topEnd = (t.radius + 6).dp, bottomEnd = (t.radius + 6).dp)
    }
    val swipe = sheet.swipe
    val scroll = rememberScrollState()
    Portal(page.top) {
        ModalScrim({ state.scrim.value * (1f - swipe.progress) }) { cancel() }
        val window = page.viewport
        // Where it sits, and its margin: outside the caller's modifier, whose size wins over the default one.
        val at = when (side) {
            null -> Modifier.align(Alignment.Center).padding(16.dp)
            DialogSide.Bottom -> Modifier.align(Alignment.BottomCenter)
            DialogSide.Left, DialogSide.Right ->
                Modifier.align(if (side == DialogSide.Left) Alignment.CenterStart else Alignment.CenterEnd)
        }
        val placed = when (side) {
            null -> Modifier
                .width(if (size == DialogSize.Lg) 960.dp else 448.dp)
                .heightIn(max = window.height - 32.dp)
                .modalSurface(state)
            DialogSide.Bottom -> Modifier
                .widthIn(max = 672.dp)
                .fillMaxWidth()
                .heightIn(max = window.height * 0.85f)
                .graphicsLayer {
                    translationY = sheet.offset(this.size.height)
                    alpha = sheet.shown.value
                }
            DialogSide.Left, DialogSide.Right -> Modifier
                .fillMaxHeight()
                .width(384.dp)
                .widthIn(max = window.width - 40.dp)
                .graphicsLayer {
                    // Left and right are the page's, not the text's: a left sheet is on the left.
                    val way = if (side == DialogSide.Left) -1f else 1f
                    translationX = sheet.offset(this.size.width) * way * if (rtl) -1f else 1f
                    alpha = sheet.shown.value
                }
        }
        val swipeSide = when (side) {
            DialogSide.Bottom -> SheetSide.Bottom
            DialogSide.Left -> if (rtl) SheetSide.Right else SheetSide.Left
            DialogSide.Right -> if (rtl) SheetSide.Left else SheetSide.Right
            null -> null
        }
        Box(
            at
                .then(modifier)
                .then(placed)
                .sheetSwipe(
                    swipe,
                    if (dismissible && open) swipeSide else null,
                    rtl,
                    if (side == DialogSide.Bottom) scroll else null,
                    haptics,
                    { it.animateTo(0f, tween(320, easing = Ease.Sheet)) },
                    { close() },
                )
                .glowEdge(shape)
                .glass(shape, blur = true, sides = Sides.All, background = t.card.color(0.9f))
                .semantics {
                    dialog()
                    paneTitle = title
                },
        ) {
            // Once it's laid out in the top layer (a frame on), focus goes to the first control in
            // it in tab order, or the dialog itself if it has none, as the browser's dialog focusing
            // steps go.
            if (open) LaunchedEffect(Unit) {
                withFrameNanos {}
                if (initialFocus != null) runCatching { initialFocus.requestFocus() }
                else {
                    runCatching { focus.requestFocus() }
                    focusManager.moveFocus(FocusDirection.Next)
                }
            }
            CompositionLocalProvider(LocalDialogClose provides { close() }) {
                ScrollArea(
                    Modifier
                        .focusRequester(focus)
                        // Focusable until focus is in it, so it can hold focus itself (with no control
                        // in it) but is never a stop in tab order.
                        .onFocusChanged { if (it.hasFocus && !it.isFocused) holding = false }
                        .focusable(holding)
                        // A side panel's content is at least as tall as the panel, so what's weighted (mt-auto) takes up the rest.
                        .then(if (side == DialogSide.Left || side == DialogSide.Right) Modifier.layout { m, c ->
                            val p = m.measure(if (c.hasBoundedHeight) c.copy(minHeight = c.maxHeight) else c)
                            layout(p.width, p.height) { p.place(0, 0) }
                        } else Modifier),
                    vertical = scroll,
                ) { Column(
                    Modifier.padding(start = 24.dp, end = 24.dp, bottom = 24.dp, top = if (side == DialogSide.Bottom) 12.dp else 24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    // A bottom sheet's grip: says it came up from the edge.
                    if (side == DialogSide.Bottom) {
                        Box(
                            Modifier
                                .align(Alignment.CenterHorizontally)
                                .size(40.dp, 4.dp)
                                .box(CircleShape, fill = SolidColor(t.tint.color(0.2f))),
                        )
                    }
                    Column(
                        Modifier.padding(end = if (dismissible) 32.dp else 0.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            title,
                            Modifier.semantics { heading() },
                            style = TextStyles.lg.merge(TextStyles.semibold).merge(TextStyles.tight).copy(lineBreak = LineBreak.Heading),
                        )
                        if (description != null) {
                            Text(description, style = TextStyles.sm, color = t.mutedForeground.color())
                        }
                    }
                    content()
                } }
            }
            if (dismissible) CloseButton(closeLabel ?: m.close, top = if (side == DialogSide.Bottom) 30.dp else 22.dp) { close() }
        }
        ModalToasts(state)
    }
}

@Composable
private fun BoxScope.CloseButton(label: String, top: androidx.compose.ui.unit.Dp, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val bg by animateColorAsState(t.tint.color(if (state.hovered) 0.07f else 0f), transition(150, Ease.Css))
    val ink by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150, Ease.Css))
    Box(
        Modifier
            .align(Alignment.TopEnd)
            .padding(top = top, end = 16.dp)
            .size(32.dp)
            .box(Zen.radii.lg, fill = SolidColor(bg), shadows = focusRing(state.focusVisible))
            .control(state, label = label, onClick = onClick)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) { Icon(Icons.XMarkMicro, size = 16.dp, color = ink) }
}

/** A row of the dialog's actions, at its end; given more height (weight, as mt-auto in a side panel), at its bottom. */
@Composable
fun DialogFooter(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) =
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalAlignment = Alignment.Bottom, content = content)

/** A button that closes the dialog it's in, after its own `onClick`. */
@Composable
fun DialogClose(
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    enabled: Boolean = true,
    tone: ButtonTone = ButtonTone.Default,
    focus: FocusRequester? = null,
    onClick: () -> Unit = {},
    content: @Composable RowScope.() -> Unit,
) {
    val close = LocalDialogClose.current
    Button({ onClick(); close() }, if (focus != null) modifier.focusRequester(focus) else modifier, variant, size, enabled, tone, content = content)
}
