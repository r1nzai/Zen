package dev.rinzai.zen.showcase.examples.editablecell

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.editablecell.EditableCell
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.moneyinput.MoneyInput

/** Click a value (or Tab to it and press Enter) to edit; Enter or blur saves, Escape cancels. */
@Composable
fun Default() {
    var amount by remember { mutableStateOf<Long?>(1850000) }
    var note by remember { mutableStateOf("Due on the 5th") }
    val muted = Zen.tokens.mutedForeground.color()
    LabelGrid(Modifier.width(320.dp)) {
        Text("Rent", style = TextStyles.sm, color = muted)
        EditableCell(
            amount?.let { formatMoney(it, "INR", "en-IN", showDecimals = false) } ?: "–",
            { close ->
                MoneyInput(amount, { amount = it; close() }, "INR", locale = "en-IN", allowEmpty = true, onCancel = close, compact = true, label = "Rent")
            },
            label = "Rent: ${amount?.let { formatMoney(it, "INR", "en-IN") } ?: "none"}",
        )
        Text("Note", style = TextStyles.sm, color = muted)
        EditableCell(
            note,
            { close ->
                var draft by remember { mutableStateOf(note) }
                var had by remember { mutableStateOf(false) }
                val focus = LocalFocusManager.current
                Input(
                    draft,
                    { draft = it },
                    Modifier
                        .height(28.dp)
                        .onFocusChanged {
                            if (it.hasFocus) had = true
                            else if (had) { note = draft; close() }
                        }
                        .onPreviewKeyEvent { e ->
                            if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                            when (e.key) {
                                Key.Enter -> { focus.clearFocus(); true }
                                Key.Escape -> { close(); true }
                                else -> false
                            }
                        },
                    label = "Note",
                )
            },
            label = "Note: $note",
            textAlign = TextAlign.Start,
        )
    }
}

/** grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2: labels in a column as wide as the widest, values filling the rest. */
@Composable
private fun LabelGrid(modifier: Modifier, content: @Composable () -> Unit) = Layout(content, modifier) { measurables, constraints ->
    val gapX = 16.dp.roundToPx()
    val gapY = 8.dp.roundToPx()
    val labels = measurables.filterIndexed { i, _ -> i % 2 == 0 }.map { it.measure(Constraints()) }
    val first = labels.maxOfOrNull { it.width } ?: 0
    val rest = (constraints.maxWidth - first - gapX).coerceAtLeast(0)
    val values = measurables.filterIndexed { i, _ -> i % 2 == 1 }.map { it.measure(Constraints(minWidth = rest, maxWidth = rest)) }
    val heights = labels.indices.map { maxOf(labels[it].height, values.getOrNull(it)?.height ?: 0) }
    layout(constraints.maxWidth, heights.sum() + gapY * maxOf(0, heights.size - 1)) {
        var y = 0
        heights.forEachIndexed { i, h ->
            labels[i].placeRelative(0, y + (h - labels[i].height) / 2)
            values.getOrNull(i)?.let { it.placeRelative(first + gapX, y + (h - it.height) / 2) }
            y += h + gapY
        }
    }
}
