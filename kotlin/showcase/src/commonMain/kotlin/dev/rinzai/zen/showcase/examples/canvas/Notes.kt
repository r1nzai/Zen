package dev.rinzai.zen.showcase.examples.canvas

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.canvas.Canvas
import dev.rinzai.zen.canvas.CanvasItem
import dev.rinzai.zen.canvas.CanvasPlaced
import dev.rinzai.zen.canvas.CanvasRect
import dev.rinzai.zen.control
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.textarea.Textarea
import dev.rinzai.zen.toOklch

private data class Note(override val id: String, override val rect: CanvasRect, val color: Int, val text: String) : CanvasPlaced<Note> {
    override fun at(rect: CanvasRect) = copy(rect = rect)
}

/**
 * Sticky notes with a field in each: typing, selecting text and the × button work as usual, because
 * presses on fields and buttons inside an item go to them. Drag a note by its edge or top strip.
 */
@Composable
fun Notes() {
    val t = Zen.tokens
    val colors = listOf(t.chart4, t.chart3, t.chart5, t.chart1)
    var notes by remember {
        mutableStateOf(
            listOf(
                Note("n1", CanvasRect(24.0, 24.0, 170.0, 150.0), 0, "Rent goes out on the 1st"),
                Note("n2", CanvasRect(220.0, 60.0, 170.0, 150.0), 1, "Move $400 to the holiday fund"),
                Note("n3", CanvasRect(420.0, 30.0, 170.0, 150.0), 2, "Cancel the old phone plan"),
            ),
        )
    }
    var selected by remember { mutableStateOf(emptyList<String>()) }
    var count by remember { mutableIntStateOf(3) }
    fun edit(id: String, text: String) {
        notes = notes.map { if (it.id == id) it.copy(text = text) else it }
    }
    Column(Modifier.widthIn(max = 768.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Canvas(
            620, 260, notes, { notes = it },
            label = "Notes",
            fit = true,
            minSize = 120,
            selected = selected,
            onSelectedChange = { selected = it },
        ) {
            val shape = Zen.radii.xl
            notes.forEachIndexed { i, note -> key(note.id) {
                val color = colors[note.color]
                val paper = t.card.mix(color.toOklch(), 0.22f).color()
                CanvasItem(
                    note.id,
                    "Note ${i + 1}",
                    Modifier
                        .box(shape, fill = SolidColor(paper), shadows = listOf(Shadow(y = 10f, blur = 30f, spread = -12f, color = Color.Black.copy(alpha = 0.6f))))
                        .clip(shape),
                    shape = shape,
                ) {
                    Column(Modifier.fillMaxSize()) {
                        Row(
                            Modifier.fillMaxWidth().height(28.dp).padding(start = 12.dp, end = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(Modifier.width(32.dp).height(4.dp).box(CircleShape, fill = SolidColor(color)))
                            val state = rememberControlState()
                            Box(
                                Modifier
                                    .size(24.dp)
                                    .clip(Zen.radii.md)
                                    .control(state, label = "Remove note ${i + 1}") { notes = notes.filter { it.id != note.id } },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("×", color = if (state.hovered) t.foreground.color() else t.mutedForeground.color(), style = TextStyles.md)
                            }
                        }
                        Textarea(
                            note.text,
                            { edit(note.id, it) },
                            Modifier.weight(1f),
                            label = "Note ${i + 1}",
                            framed = false,
                            contentPadding = PaddingValues(start = 12.dp, end = 12.dp, bottom = 8.dp),
                        )
                    }
                }
            } }
        }
        Box {
            Button(
                {
                    count++
                    val id = "n$count"
                    notes = notes + Note(id, CanvasRect(225.0, 55.0, 170.0, 150.0), count % colors.size, "")
                    selected = listOf(id)
                },
                size = ButtonSize.Sm,
                variant = ButtonVariant.Secondary,
            ) { Text("Add a note") }
        }
    }
}
