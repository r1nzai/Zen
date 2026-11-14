package dev.rinzai.zen

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalContext
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.currentCompositionLocalContext
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.focusable
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusManager
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot

/**
 * A layer of the page that parts are drawn in from wherever they're declared, as CSS draws a
 * `position: fixed` element against the viewport, or the browser's top layer draws a popup over
 * everything: declared in place (with its context), drawn here, in the order they came.
 *
 * With `order` (the page's content), the keyboard reaches each part where it's declared, as a
 * fixed element is reached where it is in the DOM: tabbing to that place goes into the part, and
 * out of it carries on from there. Tabbing past either end of the page comes round to `order`.
 */
@Stable
internal class Layer(val order: FocusEnds? = null) {
    class Entry(content: @Composable BoxScope.() -> Unit, locals: CompositionLocalContext) {
        var content by mutableStateOf(content)
        var locals by mutableStateOf(locals)

        // The part's first and last stops here, and the mark where it's declared.
        val ends = FocusEnds()
        val mark = FocusRequester()
        var entering = false
        var passing = false

        /** Carries on `direction` from where the part is declared, past it. */
        fun passOn(direction: FocusDirection, focus: FocusManager) {
            passing = true
            mark.requestFocus()
            focus.moveFocus(direction)
            passing = false
        }
    }

    val entries = mutableStateListOf<Entry>()

    @Composable
    fun Host(backdrop: BackdropSource? = null) {
        val focus = LocalFocusManager.current
        Box(Modifier.fillMaxSize()) {
            for (entry in entries) {
                key(entry) {
                    CompositionLocalProvider(entry.locals) {
                        // A popup or fixed part isn't in the group (a Toolbar) it was declared in.
                        CompositionLocalProvider(LocalBackdrop provides (backdrop ?: LocalBackdrop.current), LocalRoving provides null) {
                            if (order == null) Box(Modifier.matchParentSize()) { entry.content(this) }
                            else Box(Modifier.matchParentSize().then(entry.inOrder(order, focus))) {
                                entry.ends.Head()
                                entry.content(this)
                                entry.ends.Tail()
                            }
                        }
                    }
                }
            }
        }
    }

    private fun Entry.inOrder(order: FocusEnds, focus: FocusManager) = Modifier
        .focusProperties {
            onEnter = {
                val d = requestedFocusDirection
                // Reached here, not from where it's declared: tabbing in from outside the page (nothing focused yet).
                if (!entering && d.tabs) order.reach(d, focus)
            }
            onExit = {
                val d = requestedFocusDirection
                if (d.tabs) passOn(d, focus)
            }
        }
        .focusGroup()
}

private val FocusDirection.tabs get() = this == FocusDirection.Next || this == FocusDirection.Previous

/**
 * A focus group's first and last stops in the keyboard's order, which `requestFocus(direction)`
 * doesn't find (it goes by where things are): marks before and after what's in the group, there
 * only while they're reached for.
 */
internal class FocusEnds {
    /** Tabbing off either end of the group comes round to its other end. */
    fun wrap(focus: FocusManager) = Modifier.focusProperties {
        onExit = {
            val d = requestedFocusDirection
            if (d.tabs) reach(d, focus)
        }
    }

    private val head = FocusRequester()
    private val tail = FocusRequester()
    private var reaching = false

    /** Focuses the first stop (Next) or the last (Previous), or carries on past the group when there's none. */
    fun reach(direction: FocusDirection, focus: FocusManager) {
        reaching = true
        (if (direction == FocusDirection.Previous) tail else head).requestFocus()
        // Not stops themselves: the search goes on from the one focused, past the other when there's nothing between.
        reaching = false
        focus.moveFocus(direction)
    }

    @Composable
    fun Head() = End(head)

    @Composable
    fun Tail() = End(tail)

    @Composable
    private fun End(requester: FocusRequester) =
        Box(Modifier.clearAndSetSemantics {}.focusProperties { canFocus = reaching }.focusRequester(requester).focusable())
}

/**
 * CSS's `position: fixed`: `content` is placed over the window, or the Frame it's in (align it in
 * the BoxScope), and stays put as the page scrolls, under popups, frosting what's behind it as the bars do.
 */
@Composable
fun Fixed(content: @Composable BoxScope.() -> Unit) = Portal(Zen.frame.fixed, content)

/** Draws `content` in `layer`, full-window (align it in the BoxScope), for as long as this is composed. */
@Composable
internal fun Portal(layer: Layer, content: @Composable BoxScope.() -> Unit) {
    val locals = currentCompositionLocalContext
    val entry = remember(layer) { Layer.Entry(content, locals) }
    entry.content = content
    entry.locals = locals
    DisposableEffect(layer, entry) {
        layer.entries += entry
        onDispose { layer.entries -= entry }
    }
    if (layer.order != null) Mark(entry)
}

/** Where a part drawn in an ordered layer is in the keyboard's order: tabbing here goes into it, or past it when there's nothing to focus. */
@Composable
private fun Mark(entry: Layer.Entry) {
    val focus = LocalFocusManager.current
    Box(
        Modifier
            .focusProperties {
                // Focus moved on from in here ends the search there (a redirect), where a cancel would go on looking.
                onEnter = {
                    val d = requestedFocusDirection
                    if (!entry.passing && d.tabs) {
                        entry.entering = true
                        entry.ends.reach(d, focus)
                        entry.entering = false
                    }
                }
            }
            .focusGroup(),
    ) {
        Box(Modifier.clearAndSetSemantics {}.focusRequester(entry.mark).focusable())
    }
}

/**
 * What glass over part of the page frosts: that part drawn into a layer (CSS's backdrop root). Its
 * frame counts up as it's drawn again, so glass over it redraws too.
 */
@Stable
internal class BackdropSource {
    var layer: GraphicsLayer? = null
    var origin = Offset.Zero
    var frame by mutableIntStateOf(0)
}

/** The backdrop glass here frosts: the page under the fixed bars, or everything under a popup. */
internal val LocalBackdrop = staticCompositionLocalOf<BackdropSource?> { null }

/** Draws `content` as usual, and keeps a copy for the glass over it to frost. */
@Composable
internal fun Capture(source: BackdropSource, modifier: Modifier = Modifier.fillMaxSize(), content: @Composable BoxScope.() -> Unit) {
    val layer = rememberGraphicsLayer()
    source.layer = layer
    Box(
        modifier
            .onGloballyPositioned { source.origin = it.positionInRoot() }
            // Its own layer: what's drawn here is recorded again only when it changes.
            .graphicsLayer()
            .drawWithContent {
                layer.record { this@drawWithContent.drawContent() }
                drawLayer(layer)
                source.frame++
            },
    ) { content() }
}
