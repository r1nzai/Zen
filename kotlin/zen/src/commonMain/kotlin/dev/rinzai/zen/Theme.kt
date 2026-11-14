package dev.rinzai.zen

import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.gestures.LocalBringIntoViewSpec
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max

/** Dark glass (the default) or the light palette: the `.dark` and `.light` classes. */
enum class Appearance { Dark, Light }

val Appearance.tokens get() = if (this == Appearance.Dark) Tokens.Dark else Tokens.Light

/** The theme in effect: its tokens, as CSS custom properties are in effect for the web library. */
val LocalTokens = compositionLocalOf { Tokens.Dark }

/** What Zen reads in place of the browser: the theme and the page around a component. */
object Zen {
    val tokens: Tokens @Composable get() = LocalTokens.current
    val page: Page @Composable get() = LocalPage.current
}

/**
 * The page a Zen app runs in, which the browser gives the web library: the viewport's size, how
 * the pointer works, whether focus came from the keyboard, and the document's scroll.
 */
@Stable
class Page internal constructor(val scroll: ScrollState) {
    /** The window (or the screen, on a phone), as CSS's viewport. */
    var viewport by mutableStateOf(DpSize(1280.dp, 800.dp))
        internal set

    /** The larger page this one is part of, if it is (ZenTheme's embed). */
    internal var embed by mutableStateOf<Embed?>(null)

    /** The window around this one, if it's framed in a page (ZenTheme's host). */
    internal var host by mutableStateOf<HostWindow?>(null)

    /**
     * The page's own colours, from a few settings (the web library's applyTheme): every part of it
     * in them, its popups and dialogs too. Null for Zen's own.
     */
    var theme by mutableStateOf<ThemeSettings?>(null)

    /** The app's own switch to skip motion (html.reduce-motion): on, motion is instant, as with the OS setting. */
    var reduceMotion by mutableStateOf(false)

    /** Last input was a key: focus rings show (CSS's :focus-visible). */
    var keyboard by mutableStateOf(false)
        internal set

    /** The pointer light Backdrop drives: the glow edges read it. */
    val light = PointerLight()

    /** The theme now, and a way to switch it (ThemeToggle does, with its wave). */
    var appearance by mutableStateOf(Appearance.Dark)
        internal set

    /** The page's theme wave, which changes it. */
    internal lateinit var wave: ThemeWave

    /** Switches the theme from a point on the screen (the wave starts there), or at once without one. */
    fun changeTheme(to: Appearance, from: Offset? = null) {
        if (to != appearance) wave.change(to, from) { appearance = to }
    }

    /** At least this wide (Tailwind's sm, md, lg…): `md` is 48rem. */
    fun atLeast(width: Dp) = (embed?.viewportWidth ?: viewport.width) >= width

    /** CSS's vmax, in dp. */
    val vmax: Dp get() = max(viewport.width, viewport.height)

    internal val popups = PopupStack()

    /** Where the focused control is (document.activeElement's box), if focus is on one. */
    internal var activeElement: ActiveElement? = null

    /** The document as it scrolls, for placing a section (Modifier.section) in it. */
    internal var document: LayoutCoordinates? = null

    /** The sections a link can go to (Modifier.section), by id. */
    internal val sections = mutableStateMapOf<String, Section>()

    /** The page's main content (Modifier.main), for a Header's skip link. */
    internal var main: FocusOnRequest? = null

    /** The open modal dialogs, oldest first: the topmost answers Escape, and the page under them is inert. */
    internal val modals = mutableStateListOf<Modal>()

    /** The toast deck, drawn in the topmost modal dialog while one's open, as the web moves it into one. */
    internal var toastDeck by mutableStateOf<(@Composable BoxScope.() -> Unit)?>(null)

    /** How many open sheets and dialogs hold the page still (overflow: hidden on the root). */
    internal var locks by mutableIntStateOf(0)
    val locked: Boolean get() = locks > 0

    /** Keys the whole page answers (a toast deck's F8), heard once what has focus has had its say. */
    internal val keys = mutableListOf<(androidx.compose.ui.input.key.KeyEvent) -> Boolean>()

    /** The page's content, where tabbing comes round to past either end. */
    internal val content = FocusEnds()
    /** The viewport's frame, which the page's fixed parts are placed in. */
    internal val frame = FrameState(order = content)
    internal val top = Layer()
    internal val allBackdrop = BackdropSource()

    /** The page's view transitions (Zen.viewTransition). */
    val transition = ViewTransition()
}

/**
 * What fixed parts (a Header, a PlayerBar, a TabBar, the Backdrop) are placed against: the
 * viewport, or a Frame. It keeps the space the fixed bars take at its bottom, for the content to
 * pad its end by.
 */
@Stable
class FrameState internal constructor(order: FocusEnds? = null, private val around: FrameState? = null) {
    /** --zen-player-bar-height: what a PlayerBar covers at the bottom. */
    var playerBarHeight by mutableStateOf(0.dp)
        internal set

    /** --zen-tab-bar-height: what a TabBar covers at the bottom. */
    var tabBarHeight by mutableStateOf(0.dp)
        internal set

    internal val fixed = Layer(order)
    internal val under = Layer()
    /** What's under the page in the frame (the Backdrop), on its own: what glass inside the page frosts. */
    internal val underBackdrop = BackdropSource()
    /**
     * What's under the page here: the frame's own Backdrop, or with none, what's under the frame it's
     * in, as an element with no background of its own shows what's behind it.
     */
    internal val shownUnder: BackdropSource get() = if (under.entries.isEmpty() && around != null) around.shownUnder else underBackdrop
    /** What the fixed parts' glass frosts: what's under them in the frame. */
    internal val backdrop = BackdropSource()
    /** Where the frame is, from the top left of the window's content. */
    internal var origin by mutableStateOf(Offset.Zero)
}

internal val LocalFrame = staticCompositionLocalOf<FrameState?> { null }

/** The frame fixed parts here are placed in: the page's viewport, or the Frame around. */
val Zen.frame: FrameState @Composable get() = LocalFrame.current ?: LocalPage.current.frame

/**
 * A box that's the viewport for the fixed parts inside it (a Backdrop, a Header, a PlayerBar, a
 * TabBar), as a CSS transform makes an element the containing block of its fixed descendants: they
 * are placed against it, clipped to it, and its bars' heights are its own. For previews and demos.
 */
@Composable
fun Frame(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    val around = Zen.frame
    val frame = remember { FrameState(around = around) }
    CompositionLocalProvider(LocalFrame provides frame) {
        Box(modifier.clipToBounds().onPlaced { frame.origin = it.positionInRoot() }) {
            Capture(frame.backdrop) {
                Capture(frame.underBackdrop, Modifier.matchParentSize()) { frame.under.Host() }
                Box(Modifier.matchParentSize(), content = content)
            }
            Box(Modifier.matchParentSize()) { frame.fixed.Host(backdrop = frame.backdrop) }
        }
    }
}

/** Tailwind's breakpoints. */
object Breakpoint {
    val Sm = 640.dp
    val Md = 768.dp
    val Lg = 1024.dp
    val Xl = 1280.dp
}

val LocalPage = staticCompositionLocalOf<Page> { error("Zen components must be inside ZenTheme") }

/**
 * The root of a Zen app, as `<html>` is for the web library with Zen's theme and base.css: the
 * theme's tokens and text, a scrolling page for `content` (the document), and the layers fixed
 * parts (a Header, a PlayerBar, the Backdrop) and popups (the browser's top layer) draw in. Glass
 * over the page frosts what's behind it, as `backdrop-filter` does.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ZenTheme(
    appearance: Appearance = Appearance.Dark,
    /** Shown as part of a larger page, not as a page of its own. */
    embed: Embed? = null,
    /** Framed in a page with a Backdrop of its own: this one's carries on from it. */
    host: HostWindow? = null,
    content: @Composable () -> Unit,
) {
    val scroll = rememberScrollState()
    val page = remember { Page(scroll).also { it.appearance = appearance } }
    page.embed = embed
    page.host = host
    // The page first: the wave reads its motion switch.
    CompositionLocalProvider(LocalPage provides page) { ZenPage(page, content) }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ZenPage(page: Page, content: @Composable () -> Unit) {
    val scroll = page.scroll
    val embed = page.embed
    val wave = rememberThemeWave().also { page.wave = it }
    val appearance = page.appearance
    val theme = page.theme
    val tokens = remember(appearance, theme) { theme?.let { appearance.tokens.themed(it, appearance) } ?: appearance.tokens }
    CompositionLocalProvider(LocalThemeWave provides wave, LocalTokens provides tokens, LocalBringIntoViewSpec provides FocusScroll, LocalHapticFeedback provides (platformHaptics ?: LocalHapticFeedback.current)) {
        ColorScheme(page.appearance)
        val canvas = Zen.tokens.background.color()
        BoxWithConstraints(
            Modifier
                .fillMaxSize()
                // html's background (base.css): the whole canvas, under the scrollbar too.
                .drawBehind { drawRect(canvas) }
                // :focus-visible: rings for keyboard focus, not for a click.
                .onPreviewKeyEvent { page.keyboard = true; false }
                // Escape closes the topmost popup, else the topmost dialog, once what has focus has had its say.
                .onKeyEvent { e ->
                    val escape = e.type == KeyEventType.KeyDown && e.key == Key.Escape
                    (escape && (page.popups.escape() || page.modals.lastOrNull()?.let { it.cancel(); true } == true)) || page.keys.any { it(e) }
                }
                // The pointer, for the light (Backdrop moves it); a press ends keyboard focus rings.
                .pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) {
                            val e = awaitPointerEvent(PointerEventPass.Initial)
                            when (e.type) {
                                PointerEventType.Press -> {
                                    page.keyboard = false
                                    page.popups.press(e.changes.first().position)
                                }
                                PointerEventType.Exit -> page.light.inside = false
                                PointerEventType.Move, PointerEventType.Enter -> {
                                    page.light.target = e.changes.first().position
                                    page.light.inside = true
                                }
                            }
                        }
                    }
                },
        ) {
            page.viewport = DpSize(maxWidth, maxHeight)
            val focusManager = LocalFocusManager.current
            // scrollbar-gutter: stable (base.css): room for the scrollbar is always kept, and what's
            // fixed is placed in the viewport beside it, as CSS places it. An embed's page scrolls instead.
            val scrolls = embed == null
            val beside = Modifier.fillMaxSize().padding(end = if (coarsePointer || !scrolls) 0.dp else SCROLLBAR)
            BodyText {
                wave.Surface { page.transition.Host {
                    // Inert under a modal dialog: focus doesn't go in, and comes back where it was after.
                    Box(
                        Modifier
                            .fillMaxSize()
                            .focusProperties { onEnter = { if (page.modals.isNotEmpty()) cancelFocusChange() } }
                            .focusGroup(),
                    ) {
                        Capture(page.allBackdrop) {
                            Capture(page.frame.backdrop) {
                                Capture(page.frame.underBackdrop, beside) { page.frame.under.Host() }
                                // Tabbing off either end comes round to the other: there's no browser around it to go to.
                                Column(beside.verticalScroll(scroll, enabled = !page.locked).onPlaced { page.document = it }.then(page.content.wrap(focusManager)).focusGroup()) {
                                    page.content.Head()
                                    content()
                                    page.content.Tail()
                                }
                                if (scrolls && !page.locked) PageScrollbar(scroll)
                            }
                            Box(beside) { page.frame.fixed.Host(backdrop = page.frame.backdrop) }
                        }
                    }
                    Box(beside) { page.top.Host(backdrop = page.allBackdrop) }
                } }
            }
        }
    }
}

/**
 * A Zen app shown as part of a larger page (a live example in a docs page, framed): that page
 * scrolls, so this keeps no scrollbar or gutter of its own, and its breakpoints (atLeast) follow
 * the page's viewport, `viewportWidth`, as the page's own content does.
 */
@Immutable
data class Embed(val viewportWidth: Dp)

/**
 * The window a framed Zen page sits in: where the frame is in it (`offset`), its size, and how far
 * its Backdrop's aurora had drifted when this was made (`auroraMs`). The Backdrop draws as that
 * window's would, so the two meet without a seam.
 */
@Immutable
data class HostWindow(val offset: DpOffset, val size: DpSize, val auroraMs: Long = 0)

/**
 * Corner rounding, derived from --radius as theme.css derives Tailwind's scale: lg is the radius,
 * surfaces (cards, popups, dialogs) round more (xl, 2xl), small parts less (md, sm).
 */
@Immutable
class Radii internal constructor(radius: Float) {
    val sm = RoundedCornerShape((radius - 4).dp)
    val md = RoundedCornerShape((radius - 2).dp)
    val lg = RoundedCornerShape(radius.dp)
    val xl = RoundedCornerShape((radius + 2).dp)
    val xl2 = RoundedCornerShape((radius + 6).dp)
}

/** The theme's corner rounding: `Zen.radii.lg` is Tailwind's rounded-lg here. */
val Zen.radii: Radii @Composable get() = LocalTokens.current.let { t -> remember(t.radius) { Radii(t.radius) } }

/** An open modal dialog, as the page keeps it: Escape cancels the topmost. */
internal class Modal(val cancel: () -> Unit)

/** Holds the page still while composed: no scrolling it, and no scrollbar (overflow: hidden). */
@Composable
internal fun LockPage() {
    val page = LocalPage.current
    DisposableEffect(page) {
        page.locks++
        onDispose { page.locks-- }
    }
}
