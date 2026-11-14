package dev.rinzai.zen.accordion

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.disclosure.Disclosure
import dev.rinzai.zen.disclosure.DisclosureContent
import dev.rinzai.zen.disclosure.currentDisclosure
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/** Which sections of an Accordion are open: one at a time, or any number with `multiple`. */
@Stable
class AccordionState internal constructor(open: Set<String>, val multiple: Boolean) {
    var open by mutableStateOf(open)

    fun isOpen(value: String) = value in open

    fun setOpen(value: String, on: Boolean) {
        open = when {
            multiple -> if (on) open + value else open - value
            on -> setOf(value)
            else -> emptySet()
        }
    }
}

@Composable
fun rememberAccordionState(vararg open: String, multiple: Boolean = false) =
    remember { AccordionState(open.toSet(), multiple) }

private class Heading {
    val focus = FocusRequester()
    var enabled by mutableStateOf(true)
    var at by mutableStateOf(Offset.Zero)
}

private class AccordionScope(val state: AccordionState) {
    val headings = mutableStateListOf<Heading>()

    /** ↑↓ move between the headings (round from either end), Home and End jump to the first and last. */
    fun move(from: Heading, key: Key): Boolean {
        val usable = headings.filter { it.enabled }.sortedBy { it.at.y }
        val i = usable.indexOf(from).takeIf { it >= 0 } ?: return false
        val to = when (key) {
            Key.DirectionDown -> i + 1
            Key.DirectionUp -> i - 1
            Key.MoveHome -> 0
            Key.MoveEnd -> usable.size - 1
            else -> return false
        }
        usable[(to + usable.size) % usable.size].focus.requestFocus()
        return true
    }
}

private val LocalAccordion = staticCompositionLocalOf<AccordionScope?> { null }
private val LocalHeading = staticCompositionLocalOf<Heading?> { null }

/**
 * Sections under headings that open one at a time (or several, with a `multiple` state), e.g.
 * questions and answers. Each AccordionItem is a Disclosure: an AccordionTrigger and an
 * AccordionContent that grows open and folds shut. ↑↓ move between the headings, Home and End
 * jump to the first and last.
 */
@Composable
fun Accordion(
    modifier: Modifier = Modifier,
    state: AccordionState = rememberAccordionState(),
    content: @Composable ColumnScope.() -> Unit,
) {
    val scope = remember(state) { AccordionScope(state) }
    CompositionLocalProvider(LocalAccordion provides scope) {
        Column(modifier, content = content)
    }
}

/** One section: an AccordionTrigger and its AccordionContent, `value` naming it in the state. */
@Composable
fun AccordionItem(value: String, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val accordion = LocalAccordion.current ?: error("AccordionItem must be inside Accordion")
    val heading = remember { Heading() }
    DisclosureItem(accordion, value, heading, modifier, content)
}

@Composable
private fun DisclosureItem(accordion: AccordionScope, value: String, heading: Heading, modifier: Modifier, content: @Composable ColumnScope.() -> Unit) {
    DisposableEffect(heading) {
        accordion.headings += heading
        onDispose { accordion.headings -= heading }
    }
    val divider = Zen.tokens.tint.color(0.07f)
    // divide-y: a line between sections, above all but the first.
    val first = accordion.headings.minByOrNull { it.at.y } == heading
    Disclosure(accordion.state.isOpen(value), { accordion.state.setOpen(value, it) }) {
        CompositionLocalProvider(LocalHeading provides heading) {
            Column(
                modifier
                    .drawBehind { if (!first) drawRect(divider, size = size.copy(height = 1.dp.toPx())) }
                    .padding(top = if (first) 0.dp else 1.dp),
                content = content,
            )
        }
    }
}

/**
 * The heading and its button: your label, and a chevron that turns over while open. `level` is
 * the heading level it sits in (2–6), to fit the page's outline.
 */
@Composable
fun AccordionTrigger(modifier: Modifier = Modifier, enabled: Boolean = true, level: Int = 3, content: @Composable RowScope.() -> Unit) {
    val d = currentDisclosure("AccordionTrigger")
    val accordion = LocalAccordion.current ?: error("AccordionTrigger must be inside Accordion")
    val heading = LocalHeading.current ?: error("AccordionTrigger must be inside AccordionItem")
    heading.enabled = enabled
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val colour by animateColorAsState(
        if ((state.hovered && enabled) || d.open) t.foreground.color() else t.mutedForeground.color(),
        transition(200),
    )
    Row(
        modifier
            .fillMaxWidth()
            .onGloballyPositioned { heading.at = it.positionInRoot() }
            .alpha(if (enabled) 1f else 0.5f)
            .box(Zen.radii.md, shadows = focusRing(state.focusVisible))
            .focusRequester(heading.focus)
            .onKeyEvent { e -> e.type == KeyEventType.KeyDown && accordion.move(heading, e.key) }
            .control(state, enabled, notAllowed = true) { d.setOpen(!d.open) }
            .semantics {
                heading()
                if (d.open) collapse { d.setOpen(false); true } else expand { d.setOpen(true); true }
            }
            .padding(vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.Start),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // An h1–h4 tracks tight at the size around it (base.css), and the button inherits that spacing.
        val around = LocalTextStyle.current.fontSize
        val tracking = if (level <= 4 && around.isSp) TextStyle(letterSpacing = (around.value * -0.025f).sp) else TextStyle()
        ProvideText(colour, TextStyles.sm.merge(TextStyles.medium).merge(tracking)) {
            Box(Modifier.weight(1f)) { Row(content = content) }
            Chevron(if (d.open) 180f else 0f, Ease.OutSoft)
        }
    }
}

/** What the trigger shows and hides; only composed while open (or folding shut). */
@Composable
fun AccordionContent(
    modifier: Modifier = Modifier,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit,
) {
    ProvideText(Zen.tokens.mutedForeground.color(), TextStyles.sm) {
        DisclosureContent(modifier, PaddingValues(bottom = 16.dp), verticalArrangement, content)
    }
}
