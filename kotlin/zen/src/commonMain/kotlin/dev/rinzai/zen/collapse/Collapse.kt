package dev.rinzai.zen.collapse

import dev.rinzai.zen.LocalPopupEntrance
import dev.rinzai.zen.ScrollArea
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.containInlineSize
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.browserFocusRing
import dev.rinzai.zen.control
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState

private enum class Slot { Items, Widest, More }

/**
 * A row showing as many items as fit on one line, and the rest behind a "+N" button that opens
 * them in a popover. It measures the items as drawn (any content, font or style), and fits again
 * whenever the row resizes. Its width is the room it's given, not its items': size the row with
 * `modifier`; `gap` is the space between items. `moreLabel` follows the count ("+3 tags").
 */
@Composable
fun <T> Collapse(
    items: List<T>,
    modifier: Modifier = Modifier,
    gap: Dp = 0.dp,
    moreLabel: String = "",
    badgeVariant: BadgeVariant = BadgeVariant.Secondary,
    badgeModifier: Modifier = Modifier,
    content: @Composable (item: T, index: Int) -> Unit,
) {
    fun label(n: Int) = "+$n" + if (moreLabel.isNotEmpty()) " $moreLabel" else ""
    // Items measured but not placed stay out of what screen readers hear (they're in the popover).
    var placed by remember { mutableIntStateOf(items.size) }
    SubcomposeLayout(modifier.containInlineSize().clipToBounds()) { constraints ->
        val loose = Constraints()
        val cells = subcompose(Slot.Items) {
            items.forEachIndexed { i, item -> Box(if (i < placed) Modifier else Modifier.clearAndSetSemantics {}) { content(item, i) } }
        }.map { it.measure(loose) }
        // The button measured at its widest (every item hidden).
        val more = subcompose(Slot.Widest) { Badge(badgeModifier.clearAndSetSemantics {}, badgeVariant) { Text(label(items.size)) } }.sumOf { it.measure(loose).width }
        val space = gap.roundToPx()
        val all = cells.sumOf { it.width } + space * maxOf(0, cells.size - 1)
        val room = if (constraints.hasBoundedWidth) constraints.maxWidth else all
        val shown = if (all <= room) cells.size else {
            // As many as fit with the "+N" button after them.
            var used = more
            var n = 0
            while (n < cells.size && used + cells[n].width + space <= room) used += cells[n++].width + space
            n
        }
        placed = shown
        val hidden = items.subList(shown, items.size)
        val button = if (hidden.isEmpty()) null else subcompose(Slot.More) {
            More(label(hidden.size), badgeVariant, badgeModifier) {
                hidden.forEachIndexed { i, item -> Box { content(item, shown + i) } }
            }
        }.single().measure(loose)
        val row = cells.take(shown) + listOfNotNull(button)
        val height = constraints.constrainHeight(row.maxOfOrNull { it.height } ?: 0)
        layout(constraints.constrainWidth(room), height) {
            var x = 0
            for (p in row) {
                p.placeRelative(x, (height - p.height) / 2)
                x += p.width + space
            }
        }
    }
}

/** The "+N" badge, a button opening the items that didn't fit, two to a row. */
@Composable
private fun More(label: String, variant: BadgeVariant, badgeModifier: Modifier, items: @Composable () -> Unit) {
    val popup = rememberPopupState()
    val state = rememberControlState(remember { MutableInteractionSource() }, popupOpen = popup.open)
    val what = label.drop(1)
    val name = LocalMessages.current.showMore(what)
    Box(
        Modifier
            .popupAnchor(popup)
            .browserFocusRing(state.focusVisible)
            .control(state) { popup.toggle() }
            .semantics { contentDescription = name },
    ) {
        Badge(badgeModifier, variant) { Text(label) }
    }
    PopoverContent(popup, label = what) {
        ScrollArea(Modifier.heightIn(max = 240.dp), vertical = rememberScrollState()) { Box(Modifier.padding(8.dp)) { TwoColumns(12.dp, items) } }
    }
}

/** grid-cols-2 gap-3: columns as wide as the widest item, rows as tall as their tallest. */
@Composable
private fun TwoColumns(gap: Dp, items: @Composable () -> Unit) {
    // Each item is one of the popup's rows.
    val entrance = LocalPopupEntrance.current
    Layout(items) { measurables, _ ->
        val placeables = measurables.map { it.measure(Constraints()) }
        val space = gap.roundToPx()
        val column = placeables.maxOfOrNull { it.width } ?: 0
        val rows = placeables.chunked(2)
        val heights = rows.map { r -> r.maxOf { it.height } }
        layout(column * 2 + space, heights.sum() + space * maxOf(0, rows.size - 1)) {
            var y = 0
            rows.forEachIndexed { i, r ->
                r.forEachIndexed { j, p ->
                    val x = j * (column + space)
                    if (entrance == null) p.placeRelative(x, y) else p.placeRelativeWithLayer(x, y, layerBlock = entrance.layer(i * 2 + j))
                }
                y += heights[i] + space
            }
        }
    }
}
