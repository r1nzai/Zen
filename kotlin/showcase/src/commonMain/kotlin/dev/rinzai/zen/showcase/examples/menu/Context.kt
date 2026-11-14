package dev.rinzai.zen.showcase.examples.menu

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.ZeroCornerSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.menuContextTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.radii
import dev.rinzai.zen.ring
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone
import dev.rinzai.zen.transition

private data class Entry(val id: Int, val label: String, val amount: String)

private val ENTRIES = listOf(
    Entry(1, "Weekly shop", "−$165"),
    Entry(2, "Train pass", "−$92"),
    Entry(3, "Salary", "+$4,200"),
)

/** Right-click an entry (or press and hold on a phone) for its actions. One menu serves the whole list. */
@Composable
fun Context() {
    val toast = LocalToaster.current
    val menu = rememberMenuState()
    var entry by remember { mutableStateOf(ENTRIES[0]) }
    val t = Zen.tokens
    val shape = Zen.radii.xl
    Column(Modifier.widthIn(max = 384.dp).fillMaxWidth().glowEdge(shape).glass(shape)) {
        ENTRIES.forEachIndexed { i, e ->
            val source = remember { MutableInteractionSource() }
            val focused = source.collectIsFocusedAsState().value && Zen.page.keyboard
            val fill by animateColorAsState(t.primary.color(if (menu.open && entry == e) 0.12f else 0f), transition(150))
            val itemShape = when (i) {
                0 -> shape.copy(bottomStart = ZeroCornerSize, bottomEnd = ZeroCornerSize)
                ENTRIES.lastIndex -> shape.copy(topStart = ZeroCornerSize, topEnd = ZeroCornerSize)
                else -> androidx.compose.ui.graphics.RectangleShape
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .box(
                        itemShape,
                        fill = SolidColor(fill),
                        border = if (i > 0) SolidColor(t.tint.color(0.06f)) else null,
                        sides = Sides.Top,
                        shadows = if (focused) listOf(ring(t.ring.color(0.4f), 2f)) else emptyList(),
                    )
                    .pointerInput(e) { awaitEachGesture { awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial); entry = e } }
                    .onFocusChanged { if (it.isFocused) entry = e }
                    .menuContextTrigger(menu)
                    .focusable(interactionSource = source)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                ProvideText(style = TextStyles.sm) {
                    Text(e.label)
                    Text(e.amount, style = TextStyles.tabular)
                }
            }
        }
    }
    MenuContent(menu, label = "${entry.label} actions") {
        MenuItem({ toast("Editing ${entry.label}") }) { Text("Edit") }
        MenuItem({ toast("Duplicated ${entry.label}", tone = ToastTone.Positive) }) { Text("Duplicate") }
        MenuSeparator()
        MenuItem({ toast("Deleted ${entry.label}", tone = ToastTone.Negative) }, negative = true) { Text("Delete") }
    }
}
