package dev.rinzai.zen.iconpicker

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.PointerIcon
import androidx.compose.ui.input.pointer.pointerHoverIcon
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.radii
import dev.rinzai.zen.radio
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState
import dev.rinzai.zen.rememberRadios
import dev.rinzai.zen.ring
import dev.rinzai.zen.transition

/** An icon and its colour, by value: what an IconPicker chooses. */
data class IconChoice(val icon: String, val color: String? = null)

/** One icon to choose: what's stored, its name, and how it looks (yours: emoji work). */
class IconOption(val value: String, val label: String, val icon: @Composable () -> Unit)

/** One colour to choose: what's stored ("blue"), the colour, and its name (the LocaleProvider's for the chart colours, else the value). */
class IconColor(val value: String, val color: Color, val label: String? = null)

/** The chart palette, so a category's colour matches it in charts. */
val IconColors: List<IconColor>
    @Composable get() = Zen.tokens.run {
        listOf(
            IconColor("blue", chart1), IconColor("orange", chart2), IconColor("teal", chart3), IconColor("amber", chart4),
            IconColor("pink", chart5), IconColor("green", chart6), IconColor("violet", chart7), IconColor("red", chart8),
        )
    }

/**
 * Pick an icon and a colour for something, e.g. a spending category: a button showing the choice
 * opens a grid of icons and a row of colours. Both are radio groups, so arrow keys move through
 * them. `label` says what it's the icon of ("Category icon"); the button also says the choice.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun IconPicker(
    value: IconChoice,
    onValueChange: (IconChoice) -> Unit,
    icons: List<IconOption>,
    label: String,
    modifier: Modifier = Modifier,
    colors: List<IconColor> = IconColors,
) {
    val t = Zen.tokens
    val m = LocalMessages.current
    fun nameOf(c: IconColor) = c.label ?: m.colourNames[c.value] ?: c.value
    val popover = rememberPopupState()
    val icon = icons.firstOrNull { it.value == value.icon }
    val color = colors.firstOrNull { it.value == value.color }
    val tint = color?.color ?: t.mutedForeground.color()
    val state = rememberControlState(popupOpen = popover.open)
    val said = listOfNotNull(icon?.label, color?.let(::nameOf)).joinToString(", ").ifEmpty { m.none }
    Box(
        modifier
            .size(40.dp)
            .popupAnchor(popover)
            .box(Zen.radii.xl, fill = SolidColor(tint.copy(alpha = tint.alpha * 0.18f)), shadows = focusRing(state.focusVisible))
            .control(state, label = "$label: $said") { popover.toggle() }
            .semantics { contentDescription = "$label: $said" },
        contentAlignment = Alignment.Center,
    ) {
        ProvideText(color = tint, style = TextStyles.lg) { icon?.icon?.invoke() }
    }
    PopoverContent(popover, label = label) {
        Column(Modifier.width(288.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (colors.isNotEmpty()) {
                val radios = rememberRadios(value.color, { onValueChange(value.copy(color = it)) }, true)
                Column(Modifier.popupRow(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(m.colour, color = t.mutedForeground.color(), style = TextStyles.xs)
                    FlowRow(Modifier.selectableGroup().semantics { contentDescription = m.colour }, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        for (c in colors) {
                            val source = remember { MutableInteractionSource() }
                            val s = rememberControlState(source)
                            val checked = value.color == c.value
                            Box(
                                Modifier
                                    .size(24.dp)
                                    .pointerHoverIcon(PointerIcon.Hand)
                                    .radio(radios, c.value, true)
                                    .selectable(checked, source, indication = null, role = Role.RadioButton) { radios.select(c.value) }
                                    .semantics { contentDescription = nameOf(c) }
                                    // ring-2 with ring-offset-2: the page's colour, then the ring, round the swatch.
                                    .box(
                                        CircleShape,
                                        fill = SolidColor(c.color),
                                        shadows = if (checked) listOf(ring(t.background.color(), 2f), ring(t.foreground.color(0.7f), 4f)) else focusRing(s.focusVisible),
                                    ),
                            )
                        }
                    }
                }
            }
            val radios = rememberRadios(value.icon, { onValueChange(value.copy(icon = it)) }, true)
            Column(Modifier.popupRow(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(m.icon, color = t.mutedForeground.color(), style = TextStyles.xs)
                FlowRow(Modifier.selectableGroup().semantics { contentDescription = m.icon }, horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp), maxItemsInEachRow = 6) {
                    for (i in icons) {
                        val source = remember { MutableInteractionSource() }
                        val s = rememberControlState(source)
                        val checked = value.icon == i.value
                        val fill by animateColorAsState(
                            when {
                                checked -> tint.copy(alpha = tint.alpha * 0.22f)
                                s.hovered -> t.tint.color(0.07f)
                                else -> Color.Transparent
                            },
                            transition(150),
                        )
                        Box(
                            Modifier
                                .size(40.dp)
                                .pointerHoverIcon(PointerIcon.Hand)
                                .radio(radios, i.value, true)
                                .selectable(checked, source, indication = null, role = Role.RadioButton) { radios.select(i.value) }
                                .semantics { contentDescription = i.label }
                                .box(Zen.radii.lg, fill = SolidColor(fill), shadows = focusRing(s.focusVisible)),
                            contentAlignment = Alignment.Center,
                        ) {
                            ProvideText(color = if (checked) tint else Color.Unspecified, style = TextStyles.lg) { i.icon() }
                        }
                    }
                }
            }
        }
    }
}
