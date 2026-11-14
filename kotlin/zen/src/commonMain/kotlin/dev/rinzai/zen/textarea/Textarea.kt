package dev.rinzai.zen.textarea

import dev.rinzai.zen.ScrollArea
import dev.rinzai.zen.SCROLLBAR
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.LayoutModifier
import dev.rinzai.zen.transition
import dev.rinzai.zen.glowFocus
import dev.rinzai.zen.box
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import kotlin.math.ceil
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.fieldControl
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.coarsePointer
import dev.rinzai.zen.fieldBox
import dev.rinzai.zen.placeholder
import dev.rinzai.zen.resizeCursor
import dev.rinzai.zen.selection

/**
 * A multi-line text field, taller than an Input (h-32) and resizable up and down by its corner
 * where there's a pointer to drag it with. `readOnly` shows the text as plain text, without the box.
 * `framed` false drops its border, fill, rounding and resize corner, keeping its focus fill and
 * halo: a field set into a surface of its own, such as a sticky note. `contentPadding` is the room
 * round the text, inside its box.
 */
@Composable
fun Textarea(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    label: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    height: Dp = 128.dp,
    framed: Boolean = true,
    contentPadding: PaddingValues = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
) {
    val t = Zen.tokens
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    var tall by remember(height) { mutableStateOf(height) }
    val density = LocalDensity.current
    val style = LocalTextStyle.current.merge(TextStyles.sm).copy(color = t.foreground.color())
    Box(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .then(ColsWidth(contentPadding, border = framed && !readOnly))
            .fillMaxWidth()
            .height(tall)
            .hoverable(source, enabled && !readOnly)
            .then(
                when {
                    readOnly -> Modifier
                    framed -> Modifier.fieldBox(FieldSize.Default, hovered && !coarsePointer, focused, height = null, padding = PaddingValues())
                    else -> Modifier.unframed(focused)
                },
            ),
    ) {
        CompositionLocalProvider(LocalTextSelectionColors provides t.selection) {
            ScrollArea(Modifier.fillMaxSize(), vertical = rememberScrollState(), resizer = framed && !readOnly && enabled) { BasicTextField(
                value,
                onValueChange,
                Modifier
                    .pointerHoverIcon(if (readOnly) PointerIcon.Default else PointerIcon.Text)
                    .fieldControl(label),
                enabled = enabled,
                readOnly = readOnly,
                textStyle = style,
                cursorBrush = SolidColor(t.foreground.color()),
                interactionSource = source,
                decorationBox = { inner ->
                    // The padding is the field's, as a <textarea>'s is: pressed, it focuses and places the caret.
                    Box(Modifier.padding(contentPadding), propagateMinConstraints = true) {
                        if (value.isEmpty() && placeholder != null) Text(placeholder, style = style.copy(color = t.placeholder))
                        inner()
                    }
                },
            ) }
        }
        // resize-y: the browser's grip in the corner, dragging the height (never below the padding).
        if (framed && !readOnly && enabled && !coarsePointer) {
            val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
            Box(
                Modifier
                    // The scrollbar corner, inside the border.
                    .align(Alignment.BottomEnd)
                    .size(15.dp)
                    .pointerHoverIcon(resizeCursor(vertical = true))
                    .pointerInput(Unit) {
                        detectDragGestures { change, drag ->
                            change.consume()
                            tall = maxOf(with(density) { (with(density) { tall.toPx() } + drag.y).toDp() }, 18.dp)
                        }
                    }
                    .drawBehind { if (rtl) scale(-1f, 1f) { resizer() } else resizer() },
            )
        }
    }
}

private val ResizerDark = Paint().apply { color = Color.Black.copy(alpha = 0.6f); isAntiAlias = false }
private val ResizerLight = Paint().apply { color = Color.White.copy(alpha = 0.6f); isAntiAlias = false }

/** Chrome's resizer, in either theme: two crisp diagonals, each dark with a light one a pixel below for contrast. */
private fun DrawScope.resizer() {
    val px = ceil(density)
    ResizerDark.strokeWidth = px
    ResizerLight.strokeWidth = px
    // From the corner inside the border, in CSS px: the long line, then the short one.
    fun at(x: Float, y: Float) = Offset(size.width + x * density, size.height + y * density)
    drawIntoCanvas { c ->
        clipRect(right = size.width - 2 * density, bottom = size.height - 2 * density) {
            for (n in listOf(8.5f, 4.5f)) {
                c.drawLine(at(-2.5f, -n), at(-n, -2.5f), ResizerDark)
                c.drawLine(at(-2.5f, 1 - n), at(-n, -1.5f), ResizerLight)
            }
        }
    }
}

/** A field's box with its border, fill and rounding taken away: only the focus fill and halo are left. */
@Composable
private fun Modifier.unframed(focused: Boolean): Modifier {
    val t = Zen.tokens
    val bg by animateColorAsState(if (focused) t.tint.color(0.05f) else t.tint.color(0f), transition(200))
    return box(RectangleShape, fill = SolidColor(bg), shadows = if (focused) t.glowFocus else emptyList())
}

/**
 * The width a <textarea> keeps where nothing else sizes it (in a box as wide as its content), as
 * Chrome sizes one (cols="20"): 20 average characters (Geist's 0.581em, OS/2 xAvgCharWidth, at
 * text-sm) and the room its scrollbar keeps, plus its padding and border.
 */
private class ColsWidth(val padding: PaddingValues, val border: Boolean) : LayoutModifier {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val p = measurable.measure(constraints)
        return layout(p.width, p.height) { p.place(0, 0) }
    }

    private fun IntrinsicMeasureScope.cols(): Int {
        val chars = ceil(20 * 0.581f * 14f * 64f) / 64f
        val gutter = if (coarsePointer) 0f else SCROLLBAR.value
        val room = padding.calculateLeftPadding(layoutDirection).value + padding.calculateRightPadding(layoutDirection).value + if (border) 2f else 0f
        return (chars + gutter + room).dp.roundToPx()
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = cols()
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurable: IntrinsicMeasurable, height: Int) = cols()
    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.minIntrinsicHeight(width)
    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurable: IntrinsicMeasurable, width: Int) = measurable.maxIntrinsicHeight(width)

    override fun equals(other: Any?) = other is ColsWidth && other.padding == padding && other.border == border
    override fun hashCode() = padding.hashCode() * 31 + border.hashCode()
}
