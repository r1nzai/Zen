package dev.rinzai.zen.codeblock

import dev.rinzai.zen.ScrollArea
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.CompositionLocalProvider
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.monospace
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberCopyToClipboard
import dev.rinzai.zen.transition
import kotlinx.coroutines.launch

/** Whether a CodeBlock is its own lit glass panel, or plain for code inside a card or panel. */
enum class CodeBlockVariant { Glass, Plain }

/**
 * The colours a highlighter gives code in a CodeBlock (the web's --sh-* variables, which
 * sugar-high reads): keywords, strings, comments and so on, for the theme in use.
 */
@Immutable
data class SyntaxColors(
    val `class`: Color,
    val identifier: Color,
    val sign: Color,
    val property: Color,
    val entity: Color,
    val jsxLiterals: Color,
    val string: Color,
    val keyword: Color,
    val comment: Color,
)

/** The syntax colours for the current theme. */
@Composable
fun syntaxColors(): SyntaxColors {
    val t = Zen.tokens
    val light = Zen.page.appearance == Appearance.Light
    return SyntaxColors(
        `class` = t.primary.color(),
        identifier = t.foreground.color(),
        sign = t.mutedForeground.color(),
        property = if (light) Oklch(0.5f, 0.15f, 250f).color() else Oklch(0.8f, 0.1f, 250f).color(),
        entity = if (light) Oklch(0.5f, 0.12f, 200f).color() else Oklch(0.78f, 0.12f, 200f).color(),
        jsxLiterals = t.foreground.color(0.85f),
        string = if (light) Oklch(0.5f, 0.14f, 150f).color() else Oklch(0.8f, 0.12f, 150f).color(),
        keyword = if (light) Oklch(0.5f, 0.2f, 330f).color() else Oklch(0.75f, 0.14f, 330f).color(),
        comment = if (light) t.mutedForeground.color() else t.mutedForeground.color(0.8f),
    )
}

/** CodeBlock's text: ui-monospace at 14px (the inline code size the web's <code> keeps inside the 13px <pre>) on 24px lines. */
val CodeTextStyle: TextStyle get() = TextStyle(fontFamily = monospace, fontSize = 14.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal)

/**
 * Code on a glass panel whose edge catches the pointer light, with a copy button. Give it a max
 * height (modifier) and the code scrolls inside; wider than the block, it fades out at the edge it
 * carries on past. Zen ships no highlighter: pass `highlight` (code → styled text, coloured with
 * syntaxColors()) for colours.
 */
@Composable
fun CodeBlock(
    code: String,
    modifier: Modifier = Modifier,
    /** Passed to `highlight`. */
    language: String? = null,
    /** Turns the code into coloured text. Without it, plain text. */
    highlight: (@Composable (code: String, language: String?) -> AnnotatedString)? = null,
    /** Show the copy button (on hover and focus). */
    copyable: Boolean = true,
    variant: CodeBlockVariant = CodeBlockVariant.Glass,
) {
    val t = Zen.tokens
    val text = code.trim()
    val shape = Zen.radii.xl
    val hover = remember { MutableInteractionSource() }
    val hovered by hover.collectIsHoveredAsState()
    val across = rememberScrollState()
    val down = rememberScrollState()
    // While it scrolls, keyboards need to reach it to scroll it too.
    val scrolls = across.maxValue > 0 || down.maxValue > 0
    val pre = remember { MutableInteractionSource() }
    val preFocused by pre.collectIsFocusedAsState()
    val keyboard = Zen.page.keyboard
    val scope = rememberCoroutineScope()
    val shown = highlight?.invoke(text, language) ?: AnnotatedString(text)

    Box(
        modifier
            .then(if (variant == CodeBlockVariant.Glass) Modifier.glowEdge(shape).glass(shape) else Modifier)
            .hoverable(hover),
    ) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            ScrollArea(
                Modifier
                    .box(RectangleShape, shadows = if (preFocused && keyboard) listOf(Shadow(spread = 2f, color = t.ring.color(0.5f), inset = true)) else emptyList())
                    .onKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                        val (state, by) = when (e.key) {
                            Key.DirectionDown -> down to 40f
                            Key.DirectionUp -> down to -40f
                            Key.DirectionRight -> across to 40f
                            Key.DirectionLeft -> across to -40f
                            Key.PageDown, Key.Spacebar -> down to down.viewportSize * 0.875f
                            Key.PageUp -> down to -down.viewportSize * 0.875f
                            Key.MoveHome -> down to -down.value.toFloat()
                            Key.MoveEnd -> down to (down.maxValue - down.value).toFloat()
                            else -> return@onKeyEvent false
                        }
                        scope.launch { state.animateScrollBy(by) }
                        true
                    }
                    .focusable(scrolls, pre)
                    .fadeEdges(across)
                    .growUncapped(),
                vertical = down,
                horizontal = across,
            ) {
                Box(Modifier.padding(20.dp)) { Text(shown, style = CodeTextStyle, color = t.foreground.color(), softWrap = false) }
            }
        }
        if (copyable) CopyButton(text, hovered, Modifier.align(Alignment.TopEnd).padding(top = 10.dp, end = 10.dp))
    }
}

/**
 * overflow: auto with nothing capping it: as big as the code, where it isn't given a size (scroll
 * containers can't be measured unbounded, so the cap is the content's own size).
 */
private fun Modifier.growUncapped() = layout { measurable, constraints ->
    val width = if (constraints.hasBoundedWidth) constraints.maxWidth else measurable.maxIntrinsicWidth(constraints.maxHeight)
    val height = if (constraints.hasBoundedHeight) constraints.maxHeight else measurable.maxIntrinsicHeight(width)
    val p = measurable.measure(constraints.copy(maxWidth = width, maxHeight = height))
    layout(p.width, p.height) { p.place(0, 0) }
}

/** Fades the code out at an edge it carries on past: 2rem at each end, as the scroll-driven mask does. */
private fun Modifier.fadeEdges(scroll: ScrollState) = this
    .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
    .drawWithContent {
        drawContent()
        val max = scroll.maxValue
        if (max <= 0 || max == Int.MAX_VALUE) return@drawWithContent
        val p = scroll.value.toFloat() / max
        val edge = 32.dp.toPx()
        val l = edge * (p / 0.05f).coerceIn(0f, 1f)
        val r = edge * ((1f - p) / 0.05f).coerceIn(0f, 1f)
        val w = size.width
        drawRect(
            Brush.horizontalGradient(
                0f to Color.Transparent,
                (l / w) to Color.Black,
                ((w - r) / w) to Color.Black,
                1f to Color.Transparent,
            ),
            blendMode = BlendMode.DstIn,
        )
    }

@Composable
private fun CopyButton(text: String, hovered: Boolean, modifier: Modifier) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val clip = rememberCopyToClipboard()
    val state = rememberControlState()
    val shown = hovered || state.focusVisible || clip.copied || coarsePointer
    val alpha by animateFloatAsState(if (shown) 1f else 0f, transition(150))
    val fill by animateColorAsState(
        when {
            state.hovered -> t.tint.color(0.07f)
            coarsePointer -> t.card.color(0.9f)
            else -> t.tint.color(0f)
        },
        transition(150),
    )
    val ink by animateColorAsState(
        when {
            clip.copied -> t.primary.color()
            state.hovered -> t.foreground.color()
            else -> t.mutedForeground.color()
        },
        transition(150),
    )
    Box(
        modifier
            .alpha(alpha)
            .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .control(state) { clip.copyNow(text) }
            .then(if (coarsePointer) Modifier.defaultMinSize(44.dp, 44.dp) else Modifier)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(if (clip.copied) m.copied else m.copy, style = TextStyles.xs.merge(TextStyles.medium), color = ink)
    }
}
