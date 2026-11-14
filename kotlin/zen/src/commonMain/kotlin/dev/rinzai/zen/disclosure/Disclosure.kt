package dev.rinzai.zen.disclosure

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.Ease
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.inert
import dev.rinzai.zen.control
import dev.rinzai.zen.outline
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.ringColor
import dev.rinzai.zen.transition
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** A Disclosure's state: whether it's open, and a way to open or close it. */
@Stable
class DisclosureState internal constructor(open: Boolean) {
    var open by mutableStateOf(open)
}

@Composable
fun rememberDisclosureState(open: Boolean = false) = remember { DisclosureState(open) }

/** The enclosing Disclosure: whether it's open, and a way to change it, for building your own trigger or content. */
class DisclosureControl internal constructor(val open: Boolean, val setOpen: (Boolean) -> Unit)

private val LocalDisclosure = staticCompositionLocalOf<DisclosureControl?> { null }

/** The enclosing Disclosure's state, for building your own trigger or content. */
@Composable
fun currentDisclosure(part: String = "This"): DisclosureControl =
    LocalDisclosure.current ?: error("$part must be inside Disclosure")

/**
 * A section that a button shows and hides, e.g. "Past (3)" under a list. Put a DisclosureTrigger
 * and a DisclosureContent inside (it adds no layout of its own). Follows `open`/`onOpenChange`.
 */
@Composable
fun Disclosure(open: Boolean, onOpenChange: (Boolean) -> Unit, content: @Composable () -> Unit) {
    val change by rememberUpdatedState(onOpenChange)
    CompositionLocalProvider(LocalDisclosure provides DisclosureControl(open) { change(it) }, content = content)
}

/** A Disclosure that opens and closes on its own (or from `state`). */
@Composable
fun Disclosure(state: DisclosureState = rememberDisclosureState(), content: @Composable () -> Unit) =
    Disclosure(state.open, { state.open = it }, content)

/** The button: your label after a chevron that turns down as the section opens. Brightens on hover and while open. */
@Composable
fun DisclosureTrigger(modifier: Modifier = Modifier, content: @Composable RowScope.() -> Unit) {
    val d = currentDisclosure("DisclosureTrigger")
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val colour by animateColorAsState(
        if (state.hovered || d.open) t.foreground.color() else t.mutedForeground.color(),
        transition(200),
    )
    Row(
        modifier
            .outline(Zen.radii.md, if (state.focusVisible) ringColor else Color.Transparent, 2.dp, 4.dp)
            .control(state) { d.setOpen(!d.open) }
            .semantics { if (d.open) collapse { d.setOpen(false); true } else expand { d.setOpen(true); true } },
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(colour, TextStyles.sm.merge(TextStyles.medium)) {
            Chevron(if (d.open) 0f else -90f, Ease.OutSoft)
            content()
        }
    }
}

/**
 * What the trigger shows and hides. It grows open and folds shut (the height animates, the content
 * fades and settles). While closed it isn't composed at all, so what's inside costs nothing and
 * can't be found, focused or read; it comes in as it opens and leaves once it has folded shut.
 * `padding` is around the content (pt-2), and `verticalArrangement` spaces it.
 */
@Composable
fun DisclosureContent(
    modifier: Modifier = Modifier,
    padding: PaddingValues = PaddingValues(top = 8.dp),
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit,
) {
    val d = currentDisclosure("DisclosureContent")
    // Open from the start it's simply there; opened later, it grows in.
    val height = remember { Animatable(if (d.open) 1f else 0f) }
    val body = remember { Animatable(if (d.open) 1f else 0f) }
    // In the page while open, and while folding shut after.
    var present by remember { mutableStateOf(d.open) }
    val heightSpec = transition<Float>(300, Ease.OutSoft)
    val bodySpec = transition<Float>(300, Ease.Out)
    LaunchedEffect(d.open) {
        if (d.open) present = true
        val to = if (d.open) 1f else 0f
        coroutineScope {
            launch { body.animateTo(to, bodySpec) }
            height.animateTo(to, heightSpec)
        }
        if (!d.open) present = false
    }
    if (!d.open && !present) return
    val shut = !d.open
    Column(
        Modifier
            .clipToBounds()
            .layout { m, c ->
                val p = m.measure(c.copy(minHeight = 0))
                val h = (p.height * height.value).roundToInt()
                layout(p.width, h) { p.place(0, 0) }
            }
            .inert(shut),
    ) {
        Column(
            modifier
                .graphicsLayer {
                    alpha = body.value
                    translationY = -4.dp.toPx() * (1 - body.value)
                }
                .padding(padding),
            verticalArrangement = verticalArrangement,
            content = content,
        )
    }
}
