package dev.rinzai.zen.colorpicker

import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Canvas
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.ImageShader
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Shader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.Hsv
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.PickerField
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.activeElement
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.hexColor
import dev.rinzai.zen.hexToHsv
import dev.rinzai.zen.hsvToHex
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.insetRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.radio
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.rememberRadios
import dev.rinzai.zen.ring
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.slider.drawThumb
import kotlin.math.roundToInt

/** A colour to pick in one press: `value` is hex, like the picker's. */
@Immutable
class ColorSwatch(val label: String, val value: String)

private val BLACK = Hsv(0f, 0f, 0f, 1f)
private val HUES = Brush.horizontalGradient(listOf(0f, 60f, 120f, 180f, 240f, 300f, 360f).map { hueColor(it) })

private fun hueColor(h: Float) = hexColor(hsvToHex(Hsv(h, 1f, 1f)))!!
private fun pct(x: Float) = (x * 100f).roundToInt()

/** The value as the picker keeps it: lower-case, and opaque without `alpha`. */
private fun normalize(value: String, alpha: Boolean) = hexToHsv(value)?.let { hsvToHex(if (alpha) it else it.copy(a = 1f)) }

/** The checkerboard under a colour that may be see-through: 8dp tiles of grey-400 and grey-100. */
private class Checker(private val px: Float) : ShaderBrush() {
    private val image by lazy {
        val n = (px * 8f).roundToInt().coerceAtLeast(2)
        val half = n / 2f
        ImageBitmap(n, n).also { img ->
            val canvas = Canvas(img)
            val dark = Paint().apply { color = Color(0xFF9CA3AF) }
            val light = Paint().apply { color = Color(0xFFF3F4F6) }
            canvas.drawRect(0f, 0f, n.toFloat(), n.toFloat(), light)
            canvas.drawRect(half, 0f, n.toFloat(), half, dark)
            canvas.drawRect(0f, half, half, n.toFloat(), dark)
        }
    }

    override fun createShader(size: Size): Shader = ImageShader(image, TileMode.Repeated, TileMode.Repeated)
    override fun equals(other: Any?) = other is Checker && other.px == px
    override fun hashCode() = px.hashCode()
}

/** `color` over the checkerboard, as `linear-gradient(c, c), CHECKER` paints it. */
@Composable
private fun checkered(color: Color): Brush {
    val density = LocalDensity.current.density
    return remember(color, density) { Brush.composite(Checker(density), Brush.linearGradient(listOf(color, color)), BlendMode.SrcOver) }
}

private class Panel {
    var hsv by mutableStateOf(BLACK)
    var seen: String? = null
    var alpha = false
    var onChange: (String) -> Unit = {}
    var onCommit: ((String) -> Unit)? = null

    val hex get() = hsvToHex(hsv)

    fun set(h: Float = hsv.h, s: Float = hsv.s, v: Float = hsv.v, a: Float = hsv.a): String {
        hsv = Hsv(h, s, v, if (alpha) a else 1f)
        return hex.also(onChange)
    }

    fun commit(to: String = hex) = onCommit?.invoke(to)

    fun pick(hex: String) {
        hsv = hexToHsv(hex)!!
        onChange(hex)
        commit(hex)
    }
}

/**
 * Everything ColorPicker opens: a saturation and brightness area, hue and alpha sliders, the
 * hex, and your swatches. Use it inline, or in a popup of your own. Values are hex: "#rrggbb", or
 * "#rrggbbaa" with `alpha`. `onValueChange` runs on every change, while dragging too;
 * `onValueCommit` once a change is made (letting go of the area or a slider, a key, a hex
 * entered, a swatch picked).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ColorPanel(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    onValueCommit: ((String) -> Unit)? = null,
    alpha: Boolean = false,
    swatches: List<ColorSwatch> = emptyList(),
) {
    val m = LocalMessages.current
    val t = Zen.tokens
    val panel = remember { Panel().apply { hsv = hexToHsv(value) ?: BLACK; seen = value } }
    panel.alpha = alpha
    panel.onChange = onValueChange
    panel.onCommit = onValueCommit
    // Kept as HSV, so the hue survives greys and black, where hex has none.
    if (value != panel.seen) {
        panel.seen = value
        val next = normalize(value, alpha)
        if (next != null && next != panel.hex) panel.hsv = hexToHsv(next)!!
    }
    val hsv = panel.hsv
    val hex = panel.hex
    val opaque = hexColor(hsvToHex(hsv.copy(a = 1f)))!!

    Column(modifier.width(256.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Area(panel, opaque, Modifier.popupRow())
        Slider(
            hsv.h.roundToInt().toFloat(),
            { panel.set(h = it) },
            Modifier.popupRow(),
            min = 0f,
            max = 359f,
            onValueCommit = { panel.commit() },
            track = { HUES },
            thumbColor = hueColor(hsv.h),
            label = m.hue,
            valueText = { m.hueValue(it.roundToInt()) },
        )
        if (alpha) {
            val checker = checkered(Color.Transparent)
            val track = remember(opaque, checker) {
                Brush.composite(checker as ShaderBrush, Brush.horizontalGradient(listOf(opaque.copy(alpha = 0f), opaque)), BlendMode.SrcOver)
            }
            Slider(
                pct(hsv.a).toFloat(),
                { panel.set(a = it / 100f) },
                Modifier.popupRow(),
                min = 0f,
                max = 100f,
                onValueCommit = { panel.commit() },
                track = { track },
                thumbColor = opaque,
                label = m.opacity,
                valueText = { m.opacityValue(it.roundToInt()) },
            )
        }
        var draft by remember { mutableStateOf<String?>(null) }
        fun applyDraft() {
            val d = draft ?: return
            val next = normalize(if (d.startsWith("#")) d else "#$d", alpha)
            draft = null
            if (next == null || next == panel.hex) return
            panel.pick(next)
        }
        Input(
            draft ?: hex,
            { draft = it },
            Modifier
                .popupRow()
                .height(36.dp)
                .onFocusChanged { if (!it.hasFocus) applyDraft() }
                .onPreviewKeyEvent { e ->
                    if (e.type == KeyEventType.KeyDown && e.key == Key.Enter) applyDraft()
                    false
                },
            label = m.hex,
            style = TextStyles.mono.merge(TextStyles.tabular),
        )
        if (swatches.isNotEmpty()) {
            val chosen = swatches.firstOrNull { normalize(it.value, alpha) == hex }?.value
            val radios = rememberRadios(chosen, { v -> normalize(v, alpha)?.let(panel::pick) }, true)
            FlowRow(
                Modifier.popupRow().selectableGroup().semantics { contentDescription = m.swatches },
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                for (sw in swatches) {
                    val source = remember { MutableInteractionSource() }
                    val s = rememberControlState(source)
                    val checked = sw.value == chosen
                    Box(
                        Modifier
                            .size(24.dp)
                            .pointerHoverIcon(PointerIcon.Hand)
                            .radio(radios, sw.value, true)
                            .selectable(checked, source, indication = null, role = Role.RadioButton) { radios.select(sw.value) }
                            .semantics { contentDescription = sw.label }
                            // ring-2 with ring-offset-2: the page's colour, then the ring, round the swatch.
                            .box(
                                CircleShape,
                                fill = checkered(hexColor(sw.value) ?: Color.Transparent),
                                shadows = listOf(insetRing(t.tint.color(0.12f), 1f)) +
                                    if (checked) listOf(ring(t.background.color(), 2f), ring(t.foreground.color(0.7f), 4f)) else focusRing(s.focusVisible),
                            ),
                    )
                }
            }
        }
    }
}

private val ARROWS = mapOf(
    Key.DirectionLeft to (-1 to 0),
    Key.DirectionRight to (1 to 0),
    Key.DirectionDown to (0 to -1),
    Key.DirectionUp to (0 to 1),
)

/** The saturation (across) and brightness (up) area, for the hue, with its marker. */
@Composable
private fun Area(panel: Panel, opaque: Color, modifier: Modifier) {
    val m = LocalMessages.current
    val hsv = panel.hsv
    val source = remember { MutableInteractionSource() }
    val state = rememberControlState(source)
    val focus = remember { FocusRequester() }
    val hue = hueColor(hsv.h)
    val fill = remember(hue) {
        Brush.composite(
            Brush.horizontalGradient(listOf(Color.White, hue)) as ShaderBrush,
            Brush.verticalGradient(listOf(Color.Transparent, Color.Black)) as ShaderBrush,
            BlendMode.SrcOver,
        )
    }
    val shade = remember { Paint() }
    val marker = listOf(ring(Color.Black.copy(alpha = 0.3f), 1f), Shadow(blur = 12f, color = Color.Black.copy(alpha = 0.35f)))
    val current by rememberUpdatedState(hsv)
    Box(
        modifier
            .fillMaxWidth()
            .height(160.dp)
            .semantics {
                contentDescription = m.saturationBrightness
                progressBarRangeInfo = ProgressBarRangeInfo(pct(hsv.s).toFloat(), 0f..100f)
                stateDescription = m.saturationBrightnessValue(pct(hsv.s), pct(hsv.v))
            }
            .onKeyEvent { e ->
                if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                val (dx, dy) = ARROWS[e.key] ?: return@onKeyEvent false
                val by = (if (e.isShiftPressed) 10 else 1) / 100f
                fun clamp(x: Float) = ((x + 1e-6f) * 100f).roundToInt().coerceIn(0, 100) / 100f
                panel.commit(panel.set(s = clamp(current.s + dx * by), v = clamp(current.v + dy * by)))
                true
            }
            .focusRequester(focus)
            .activeElement()
            .focusable(interactionSource = source)
            .pointerHoverIcon(PointerIcon.Crosshair)
            .pointerInput(Unit) {
                fun at(p: Offset): String {
                    val s = (p.x / size.width).coerceIn(0f, 1f)
                    val v = 1f - (p.y / size.height).coerceIn(0f, 1f)
                    return panel.set(s = s, v = v)
                }
                awaitEachGesture {
                    val down = awaitFirstDown()
                    focus.requestFocus()
                    var last = at(down.position)
                    down.consume()
                    while (true) {
                        val c = awaitPointerEvent().changes.firstOrNull { it.id == down.id } ?: break
                        if (!c.pressed) break
                        last = at(c.position)
                        c.consume()
                    }
                    panel.commit(last)
                }
            }
            .box(Zen.radii.lg, fill = fill, shadows = listOf(insetRing(Zen.tokens.tint.color(0.1f), 1f)) + focusRing(state.focusVisible))
            .drawWithContent {
                drawContent()
                drawThumb(Offset(hsv.s * size.width, (1f - hsv.v) * size.height), 8.dp.toPx(), 2.dp.toPx(), opaque, shade, marker, null)
            },
    )
}

/**
 * A field showing a colour and its hex that opens a ColorPanel: drag or use the arrow keys in the
 * area, slide the hue (and opacity, with `alpha`), type a hex or pick a swatch. Works in a Field
 * like any input.
 */
@Composable
fun ColorPicker(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    onValueCommit: ((String) -> Unit)? = null,
    alpha: Boolean = false,
    swatches: List<ColorSwatch> = emptyList(),
    enabled: Boolean = true,
    size: FieldSize = FieldSize.Default,
    label: String? = null,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    val popup = rememberPopupState()
    PickerField(
        popup,
        shown = value,
        placeholder = "",
        popupLabel = m.chooseColour,
        modifier = modifier,
        enabled = enabled,
        size = size,
        label = label,
        onClear = null,
        clearLabel = "",
        icon = { open -> Chevron(if (open) 180f else 0f, color = t.mutedForeground.color()) },
        leading = {
            Box(Modifier.size(20.dp).box(Zen.radii.md, fill = checkered(hexColor(value) ?: Color.Transparent), shadows = listOf(insetRing(t.tint.color(0.15f), 1f))))
        },
        textStyle = TextStyles.sm.merge(TextStyles.mono).merge(TextStyles.tabular),
    ) {
        ColorPanel(value, onValueChange, onValueCommit = onValueCommit, alpha = alpha, swatches = swatches)
    }
}
