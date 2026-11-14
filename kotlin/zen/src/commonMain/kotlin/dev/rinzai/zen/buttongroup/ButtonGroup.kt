package dev.rinzai.zen.buttongroup

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.radii

/** The buttons of a ButtonGroup, in order; each is given the shape its place in the group takes. */
class ButtonGroupScope internal constructor() {
    internal val items = mutableListOf<@Composable (Shape) -> Unit>()

    /** One button (or a menu's trigger): give it `shape`, e.g. Button(shape = shape). */
    fun item(content: @Composable (shape: Shape) -> Unit) {
        items += content
    }
}

/**
 * Buttons joined into one: shared edges, rounded only at the ends, e.g. a split button (an action
 * and a menu of others) or Previous / Today / Next. Best with outline buttons, whose hairlines
 * meet. Upright with `Orientation.Vertical`. `label` names the group when the buttons' names
 * don't say what they're for together.
 */
@Composable
fun ButtonGroup(
    modifier: Modifier = Modifier,
    orientation: Orientation = Orientation.Horizontal,
    label: String? = null,
    content: ButtonGroupScope.() -> Unit,
) {
    val items = ButtonGroupScope().apply(content).items
    val r = Zen.radii.lg.topStart
    val none = androidx.compose.foundation.shape.CornerSize(0.dp)
    val shapes = items.indices.map { i ->
        val first = i == 0
        val last = i == items.lastIndex
        when {
            first && last -> Zen.radii.lg
            orientation == Orientation.Horizontal && first -> RoundedCornerShape(r, none, none, r)
            orientation == Orientation.Horizontal && last -> RoundedCornerShape(none, r, r, none)
            first -> RoundedCornerShape(r, r, none, none)
            last -> RoundedCornerShape(none, none, r, r)
            else -> RectangleShape
        }
    }
    val group = modifier.semantics {
        isTraversalGroup = true
        if (label != null) contentDescription = label
    }
    // Each after the first steps back a pixel, so neighbours share one hairline.
    if (orientation == Orientation.Horizontal) {
        Row(group, horizontalArrangement = Arrangement.spacedBy((-1).dp)) { items.forEachIndexed { i, item -> Raised { item(shapes[i]) } } }
    } else {
        Column(group.width(IntrinsicSize.Max), verticalArrangement = Arrangement.spacedBy((-1).dp)) { items.forEachIndexed { i, item -> Raised { item(shapes[i]) } } }
    }
}

/** Raised over its neighbours while hovered or focused, so its whole border and focus ring show. */
@Composable
private fun Raised(content: @Composable () -> Unit) {
    var hovered by remember { mutableStateOf(false) }
    var focused by remember { mutableStateOf(false) }
    Box(
        Modifier
            .zIndex(if (hovered || focused) 1f else 0f)
            .onFocusChanged { focused = it.hasFocus }
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        when (awaitPointerEvent(PointerEventPass.Initial).type) {
                            PointerEventType.Enter -> hovered = true
                            PointerEventType.Exit -> hovered = false
                        }
                    }
                }
            },
    ) { content() }
}
