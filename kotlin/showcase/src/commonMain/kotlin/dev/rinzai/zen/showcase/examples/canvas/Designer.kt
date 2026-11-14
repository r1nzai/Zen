package dev.rinzai.zen.showcase.examples.canvas

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonTone
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.canvas.Canvas
import dev.rinzai.zen.canvas.CanvasItem
import dev.rinzai.zen.canvas.CanvasPlaced
import dev.rinzai.zen.canvas.CanvasRect
import dev.rinzai.zen.colorpicker.ColorPicker
import dev.rinzai.zen.control
import dev.rinzai.zen.drawEllipseGradient
import dev.rinzai.zen.farthestCorner
import dev.rinzai.zen.hexColor
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.input.InputType
import dev.rinzai.zen.kbd.kbdInline
import dev.rinzai.zen.radialGradient
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList
import dev.rinzai.zen.toOklch
import kotlin.math.floor

private enum class Kind { Text, Bar, Image }

private data class Layer(
    override val id: String,
    val kind: Kind,
    val name: String,
    val color: String,
    override val rect: CanvasRect,
    override val locked: Boolean = false,
) : CanvasPlaced<Layer> {
    override fun at(rect: CanvasRect) = copy(rect = rect)
}

private const val W = 640
private const val H = 360

private val START = listOf(
    Layer("scene", Kind.Image, "Backdrop", "#1b1630", CanvasRect(0.0, 0.0, W.toDouble(), H.toDouble()), locked = true),
    Layer("cam", Kind.Image, "Camera", "#7c5cff", CanvasRect(404.0, 20.0, 216.0, 122.0)),
    Layer("title", Kind.Text, "Title", "#ffffff", CanvasRect(24.0, 252.0, 300.0, 40.0)),
    Layer("goal", Kind.Bar, "Sub goal", "#2bb3a3", CanvasRect(24.0, 304.0, 300.0, 16.0)),
)

/** A new layer of each kind: its name, colour and size. */
private val NEW = mapOf(
    Kind.Text to Triple("Text", "#ffffff", 200.0 to 32.0),
    Kind.Bar to Triple("Bar", "#f0a83a", 220.0 to 14.0),
    Kind.Image to Triple("Image", "#ef5a7a", 120.0 to 120.0),
)

private fun js(v: Double) = if (v == floor(v)) v.toLong().toString() else v.toString()

/**
 * A small overlay designer: a 640×360 scene that fits its width, a layers list whose order is the
 * stacking (drag to reorder), and an inspector for the selected card. `onItemsChangeEnd` gives each
 * change with the items before it, which is all Undo needs. Try ⌘Z, ⇧⌘Z and Delete.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Designer() {
    val t = Zen.tokens
    var items by remember { mutableStateOf(START) }
    var selected by remember { mutableStateOf(listOf("title")) }
    var past by remember { mutableStateOf(emptyList<List<Layer>>()) }
    var future by remember { mutableStateOf(emptyList<List<Layer>>()) }
    val editing = remember { arrayOfNulls<List<Layer>>(1) }
    var count by remember { mutableIntStateOf(0) }

    fun record(before: List<Layer>) {
        past = past + listOf(before)
        future = emptyList()
    }
    fun commit(next: List<Layer>) {
        record(items)
        items = next
    }
    // Live edits (a colour being dragged) become one step of history when they end.
    fun live(next: List<Layer>) {
        if (editing[0] == null) editing[0] = items
        items = next
    }
    fun settle() {
        editing[0]?.let { record(it) }
        editing[0] = null
    }
    fun undo() {
        if (past.isEmpty()) return
        future = listOf(items) + future
        items = past.last()
        past = past.dropLast(1)
    }
    fun redo() {
        if (future.isEmpty()) return
        past = past + listOf(items)
        items = future.first()
        future = future.drop(1)
    }
    fun add(kind: Kind) {
        count++
        val id = "${kind.name.lowercase()}-$count"
        val (name, color, size) = NEW.getValue(kind)
        val (w, h) = size
        commit(items + Layer(id, kind, "$name $count", color, CanvasRect((W - w) / 2, (H - h) / 2, w, h)))
        selected = listOf(id)
    }
    fun remove() {
        val gone = selected.filter { id -> items.find { it.id == id }?.locked != true }.toSet()
        if (gone.isEmpty()) return
        commit(items.filter { it.id !in gone })
        selected = emptyList()
    }

    // Top of the stack first; the locked backdrop stays at the bottom.
    val layers = items.filter { !it.locked }.reversed()
    val one = if (selected.size == 1) items.find { it.id == selected[0] } else null
    fun update(change: (Layer) -> Layer) {
        if (one != null) commit(items.map { if (it.id == one.id) change(it) else it })
    }

    @Composable
    fun RowScope.Field(key: String, label: String, max: Int, get: (CanvasRect) -> Double, set: (CanvasRect, Double) -> CanvasRect) {
        InputGroup(Modifier.weight(1f).height(36.dp)) {
            InputGroupAddon(Modifier.width(12.dp)) { Text(key.uppercase()) }
            InputGroupInput(
                one?.let { js(get(it.rect)) } ?: "",
                { text ->
                    val v = (text.trim().ifEmpty { "0" }.toDoubleOrNull() ?: Double.NaN).let { floor(it + 0.5) }
                    val least = if (key == "w" || key == "h") 8.0 else 0.0
                    if (one != null && v.isFinite()) update { l -> l.copy(rect = set(l.rect, minOf(max.toDouble(), maxOf(least, v)))) }
                },
                label = label,
                type = InputType.Number,
                enabled = one != null && !one.locked,
                style = TextStyles.tabular,
                min = 0.0,
                max = max.toDouble(),
            )
        }
    }

    @Composable
    fun Heading(text: String) {
        Text(text.uppercase(), style = TextStyles.xs.merge(TextStyles.medium).merge(TextStyle(letterSpacing = 0.1.em)), color = t.mutedForeground.color())
    }

    @Composable
    fun Swatch(color: String) {
        Box(Modifier.size(12.dp).box(Zen.radii.sm, fill = SolidColor(hexColor(color) ?: Color.Black)))
    }

    Column(
        Modifier
            .widthIn(max = 768.dp)
            .fillMaxWidth()
            .onPreviewKeyEvent { e ->
                if (e.type == KeyEventType.KeyDown && (e.isMetaPressed || e.isCtrlPressed) && e.key == Key.Z) {
                    if (e.isShiftPressed) redo() else undo()
                    true
                } else false
            },
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            itemVerticalAlignment = Alignment.CenterVertically,
        ) {
            for (kind in Kind.entries) {
                Button({ add(kind) }, size = ButtonSize.Sm, variant = ButtonVariant.Secondary) { Text(kind.name) }
            }
            Box(Modifier.weight(1f))
            Button(::undo, size = ButtonSize.Sm, variant = ButtonVariant.Ghost, enabled = past.isNotEmpty()) { Text("Undo") }
            Button(::redo, size = ButtonSize.Sm, variant = ButtonVariant.Ghost, enabled = future.isNotEmpty()) { Text("Redo") }
            Button(::remove, size = ButtonSize.Sm, variant = ButtonVariant.Ghost, tone = ButtonTone.Negative, enabled = selected.isNotEmpty()) { Text("Delete") }
        }

        Canvas(
            W, H, items, { items = it },
            label = "Scene",
            fit = true,
            snap = true,
            onItemsChangeEnd = { _, before -> record(before) },
            selected = selected,
            onSelectedChange = { selected = it },
        ) {
            val density = LocalDensity.current
            for (layer in items) key(layer.id) {
                val color = hexColor(layer.color) ?: Color.Black
                CanvasItem(
                    layer.id,
                    layer.name,
                    Modifier.onKeyEvent { e ->
                        if (e.type == KeyEventType.KeyDown && (e.key == Key.Delete || e.key == Key.Backspace)) {
                            remove()
                            true
                        } else false
                    },
                    shape = if (layer.kind == Kind.Image && !layer.locked) Zen.radii.xl else androidx.compose.ui.graphics.RectangleShape,
                ) {
                    when (layer.kind) {
                        Kind.Text -> Text(
                            "Live in 5 minutes",
                            Modifier.align(Alignment.CenterStart),
                            style = TextStyle(
                                fontSize = with(density) { (layer.rect.h * 0.72).dp.toSp() },
                                lineHeight = 1.em,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = (-0.025).em,
                            ),
                            color = color,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            softWrap = false,
                        )
                        Kind.Bar -> Box(Modifier.fillMaxSize().clip(CircleShape).box(CircleShape, fill = SolidColor(Color.White.copy(alpha = 0.1f)))) {
                            Box(Modifier.fillMaxHeight().fillMaxWidth(0.6f).box(CircleShape, fill = SolidColor(color)))
                        }
                        Kind.Image -> if (layer.locked) {
                            Box(
                                Modifier.fillMaxSize().drawBehind {
                                    drawEllipseGradient(Offset(size.width * 0.2f, 0f), 0f to color, 0.7f to (hexColor("#0b0a12") ?: Color.Black))
                                },
                            )
                        } else {
                            val light = color.toOklch().mix(Color.White.toOklch(), 0.3f).color()
                            Box(
                                Modifier.fillMaxSize().box(
                                    Zen.radii.xl,
                                    fill = radialGradient(
                                        { s -> Offset(s.width * 0.3f, s.height * 0.25f) },
                                        { s -> farthestCorner(Offset(s.width * 0.3f, s.height * 0.25f), s) },
                                        0f to light,
                                        1f to color,
                                    ),
                                ),
                            )
                        }
                    }
                }
            }
        }

        val columns = Zen.page.atLeast(Breakpoint.Sm)
        val layersPanel = @Composable { modifier: Modifier ->
            Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Heading("Layers")
                SortableList(
                    layers.map { it.id },
                    { order -> commit(items.filter { it.locked } + order.reversed().map { id -> items.first { it.id == id } }) },
                    label = "Layers",
                ) { id ->
                    val layer = items.first { it.id == id }
                    val shape = Zen.radii.lg
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .box(shape, fill = if (id in selected) SolidColor(t.primary.color(0.1f)) else null)
                            .padding(end = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        SortableHandle(id, layer.name)
                        val state = rememberControlState()
                        Row(
                            Modifier.weight(1f).control(state) { selected = listOf(id) }.padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Swatch(layer.color)
                            Text(layer.name, style = TextStyles.sm, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
                ProvideText(t.mutedForeground.color(), TextStyles.sm) {
                    for (layer in items.filter { it.locked }) {
                        Row(
                            Modifier.fillMaxWidth().padding(start = 36.dp, top = 6.dp, bottom = 6.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Swatch(layer.color)
                            Text(layer.name)
                            Box(Modifier.weight(1f))
                            Text("Locked", Modifier.padding(end = 8.dp), style = TextStyles.xs)
                        }
                    }
                }
            }
        }
        val inspector = @Composable { modifier: Modifier ->
            Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Heading(one?.name ?: if (selected.isNotEmpty()) "${selected.size} selected" else "Nothing selected")
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Field("x", "X", W, { it.x }, { r, v -> r.copy(x = v) })
                        Field("y", "Y", H, { it.y }, { r, v -> r.copy(y = v) })
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Field("w", "Width", W, { it.w }, { r, v -> r.copy(w = v) })
                        Field("h", "Height", H, { it.h }, { r, v -> r.copy(h = v) })
                    }
                }
                ColorPicker(
                    one?.color ?: "#000000",
                    { color -> if (one != null) live(items.map { if (it.id == one.id) it.copy(color = color) else it }) },
                    onValueCommit = { settle() },
                    enabled = one != null,
                    label = "Colour",
                )
                ProvideText(t.mutedForeground.color(), TextStyles.xs) {
                    Text(
                        buildAnnotatedString {
                            appendInlineContent("shift")
                            append(" keeps a card's shape as you resize; draw a box to select several.")
                        },
                        inlineContent = mapOf("shift" to kbdInline("Shift")),
                    )
                }
            }
        }
        if (columns) {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                layersPanel(Modifier.weight(1f))
                inspector(Modifier.weight(1f))
            }
        } else {
            layersPanel(Modifier)
            inspector(Modifier)
        }
    }
}
