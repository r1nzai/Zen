package dev.rinzai.zen.table

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.FLICK_SPEED
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Sides
import dev.rinzai.zen.SwipeHandlers
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.insetRing
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.touchSwipe
import kotlinx.coroutines.launch

/** What a swipe row's cells answer: the finger swiping them, and a tap that puts the actions away. */
internal val LocalSwipeGesture = compositionLocalOf<Modifier> { Modifier }

/**
 * A row whose actions sit behind it at its end: swipe it toward its start to reveal them (back,
 * or tap the row, to put them away). They also come out when focused, so the keyboard reaches
 * them. Use it in a TableContainer, inside a TableBody.
 */
@Composable
fun TableSwipeRow(
    actions: @Composable RowScope.() -> Unit,
    selected: Boolean = false,
    content: @Composable () -> Unit,
) {
    TableRow(selected) {
        val row = LocalRow.current!!
        row.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
        val scope = rememberCoroutineScope()
        val haptics = LocalHapticFeedback.current
        val sticky = LocalStickyScroll.current
        var open by remember { mutableStateOf(false) }
        var swiping by remember { mutableStateOf(false) }
        var width by remember { mutableFloatStateOf(0f) }
        fun show(px: Float) = scope.launch { row.swipe.snapTo(maxOf(0f, px)) }
        fun settle(next: Boolean) {
            open = next
            scope.launch { row.swipe.animateTo(if (next) width else 0f, tween(300, easing = Ease.OutSoft)) }
        }
        // Past the actions' width, the row only gives a little.
        fun resist(px: Float) = if (px > width) width + (px - width) / 4f else px
        val gesture = Modifier
            .touchSwipe(
                row,
                horizontal = true,
                // Toward the start to open, back toward the end to close.
                sign = { (if (open) 1f else -1f) * if (row.rtl) -1f else 1f },
                // A table scrolled sideways scrolls first.
                scrollsFirst = {
                    val h = sticky ?: return@touchSwipe false
                    if (open) h.value > 0 else h.value < h.maxValue
                },
                haptics = haptics,
                handlers = {
                    SwipeHandlers(
                        move = { d -> show(resist(if (open) width - d else d)) },
                        release = { d, speed -> settle(open != (d > width / 2f || speed > FLICK_SPEED)) },
                        cancel = { settle(open) },
                        threshold = { width / 2f },
                    )
                },
                swiping = { swiping = it },
            )
            // Open, a tap on the row puts the actions away, and is nothing else.
            .pointerInput(row) {
                awaitPointerEventScope {
                    while (true) {
                        val e = awaitPointerEvent(PointerEventPass.Initial)
                        val c = e.changes.firstOrNull { it.pressed && !it.previousPressed } ?: continue
                        if (!open || swiping) continue
                        c.consume()
                        while (true) {
                            val up = awaitPointerEvent(PointerEventPass.Initial).changes.firstOrNull { it.id == c.id } ?: break
                            up.consume()
                            if (!up.pressed) break
                        }
                        if (!swiping) settle(false)
                    }
                }
            }
        CompositionLocalProvider(LocalSwipeGesture provides gesture, content = content)
        val t = Zen.tokens
        Box(
            Modifier
                .then(CellData(row, LocalPart.current, null, start = false, span = false, tray = true))
                .motion(row, sticky = false)
                .box(RectangleShape, border = SolidColor(t.tint.color(0.045f)), sides = Sides.Bottom)
                .clipToBounds(),
            contentAlignment = Alignment.CenterEnd,
        ) {
            Row(
                Modifier
                    .wrapContentWidth(Alignment.End, unbounded = true)
                    .fillMaxHeight()
                    .onSizeChanged { width = it.width.toFloat() }
                    .onFocusChanged { if (it.hasFocus != open) settle(it.hasFocus) }
                    // An action done, they go away.
                    .pointerInput(Unit) {
                        awaitPointerEventScope {
                            while (true) {
                                val e = awaitPointerEvent(PointerEventPass.Final)
                                if (e.changes.any { !it.pressed && it.previousPressed }) settle(false)
                            }
                        }
                    },
                content = actions,
            )
        }
    }
}

/** The scroll a swipe row's table scrolls sideways by, in a TableContainer. */
internal val LocalStickyScroll = compositionLocalOf<androidx.compose.foundation.ScrollState?> { null }

/** One of a swipe row's actions: fills the row's height, flush with its end. `negative` for a destructive one (Delete). */
@Composable
fun TableSwipeAction(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    negative: Boolean = false,
    label: String? = null,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val state = rememberControlState()
    val fill by animateColorAsState(
        when {
            negative && state.hovered -> t.destructive.color()
            negative -> t.destructive.color(0.9f)
            state.hovered -> t.tint.color(0.14f)
            else -> t.tint.color(0.09f)
        },
        tween(150),
    )
    Box(
        modifier
            .fillMaxHeight()
            .box(RectangleShape, fill = SolidColor(fill), shadows = if (state.focusVisible) listOf(insetRing(t.ring.color(0.5f), 2f)) else emptyList())
            .control(state, onClick = onClick)
            .semantics { if (label != null) contentDescription = label }
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        ProvideText(
            color = if (negative) t.destructiveForeground.color() else androidx.compose.ui.graphics.Color.Unspecified,
            style = TextStyles.sm.merge(TextStyles.medium),
        ) { content() }
    }
}
