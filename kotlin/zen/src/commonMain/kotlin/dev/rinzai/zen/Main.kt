package dev.rinzai.zen

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import androidx.compose.ui.Modifier
import kotlin.math.sqrt
import kotlin.math.roundToInt
import kotlin.math.abs
import androidx.compose.animation.core.tween
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.LayoutCoordinates

/**
 * The page's main content, as HTML's `<main>`: where a Header's skip link takes the keyboard, past
 * the bar's links. Focused that way it shows no ring, and the next Tab goes to the first thing in
 * it; it isn't a stop of its own when tabbing through the page.
 */
@Composable
fun Modifier.main(): Modifier {
    val page = LocalPage.current
    val main = remember { FocusOnRequest() }
    DisposableEffect(page, main) {
        page.main = main
        onDispose { if (page.main === main) page.main = null }
    }
    return focusOnRequest(main)
}

/** A part of the page a link can go to, as an element with an id is. */
internal class Section {
    val focus = FocusOnRequest()
    var coordinates: LayoutCoordinates? = null
    var scrollMargin = 0f
}

/**
 * Names this part of the page (a heading, a section) `id`, as HTML's id does, so a
 * TableOfContents can link to it and light up while it's being read. Scrolled to, it stops
 * `scrollMargin` below the top (CSS's scroll-margin-top), clear of a sticky bar.
 */
@Composable
fun Modifier.section(id: String, scrollMargin: Dp = 0.dp): Modifier {
    val page = LocalPage.current
    val section = remember { Section() }
    section.scrollMargin = with(LocalDensity.current) { scrollMargin.toPx() }
    DisposableEffect(page, id, section) {
        page.sections[id] = section
        onDispose { if (page.sections[id] === section) page.sections.remove(id) }
    }
    return onGloballyPositioned { section.coordinates = it }.focusOnRequest(section.focus)
}

/**
 * Follows an in-page link to section `id`, as followSectionLink does: the page scrolls it to the
 * top, smoothly (at once with reduced motion), and focus moves to it, so the keyboard carries on
 * from there. A link to nothing on the page does nothing.
 */
internal suspend fun Page.followSection(id: String, reduced: Boolean) {
    // Once there, so focusing it doesn't scroll as well.
    if (scrollToSection(id, reduced)) sections[id]?.focus?.focus()
}

/** Scrolls section `id` to the top, past its scroll margin; whether it's on the page. */
private suspend fun Page.scrollToSection(id: String, reduced: Boolean): Boolean {
    val section = sections[id] ?: return false
    val at = section.coordinates?.takeIf { it.isAttached } ?: return false
    val doc = document?.takeIf { it.isAttached } ?: return false
    val target = (doc.localPositionOf(at, Offset.Zero).y - section.scrollMargin).roundToInt().coerceIn(0, scroll.maxValue)
    val delta = abs(target - scroll.value)
    // Chrome's smooth scroll: √distance / 60 seconds, eased in and out.
    if (reduced || delta == 0) scroll.scrollTo(target)
    else scroll.animateScrollTo(target, tween((sqrt(delta.toFloat()) / 60f * 1000f).roundToInt(), easing = Ease.CssInOut))
    return true
}

/**
 * Scrolls the page to a section (Modifier.section), as an element's scrollIntoView({ block:
 * 'start' }) does: smoothly, at once with reduced motion. Focus stays where it is.
 */
@Composable
fun rememberScrollToSection(): (id: String) -> Unit {
    val page = LocalPage.current
    val scope = rememberCoroutineScope()
    val reduced by rememberUpdatedState(reducedMotion())
    return remember(page, scope) { { id -> scope.launch { page.scrollToSection(id, reduced) } } }
}
