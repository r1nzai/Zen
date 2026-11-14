package dev.rinzai.zen.showcase.budget

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Oklch
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.ThemeGlow
import dev.rinzai.zen.ThemePreset
import dev.rinzai.zen.ThemeSettings
import dev.rinzai.zen.Zen
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.colorpicker.ColorPicker
import dev.rinzai.zen.control
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.hexToOklch
import dev.rinzai.zen.iconpicker.IconChoice
import dev.rinzai.zen.iconpicker.IconOption
import dev.rinzai.zen.iconpicker.IconPicker
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.loadmore.LoadMore
import dev.rinzai.zen.menu.MenuCheckboxItem
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuRadioGroup
import dev.rinzai.zen.menu.MenuRadioItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.meter.Meter
import dev.rinzai.zen.oklchToHex
import dev.rinzai.zen.progressring.ProgressRing
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.section
import dev.rinzai.zen.segmented.Segmented
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectItem
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList
import dev.rinzai.zen.sparkline.Sparkline
import dev.rinzai.zen.timeline.Timeline
import dev.rinzai.zen.toggle.Toggle
import dev.rinzai.zen.tooltip.TooltipContent
import dev.rinzai.zen.tooltip.rememberTooltipState
import dev.rinzai.zen.tooltip.tooltipTrigger
import dev.rinzai.zen.transition
import dev.rinzai.zen.ViewTransitionStyle
import dev.rinzai.zen.viewTransition
import kotlin.math.ceil
import kotlin.math.roundToInt

/** The categories closest to their limit. */
@Composable
internal fun BudgetMeters(entries: List<Entry>) {
    var byUse by remember { mutableStateOf(true) }
    var all by remember { mutableStateOf(false) }
    val rows = CATEGORIES.filter { it.budget > 0 }
        .map { c -> c to entries.filter { it.kind == Kind.Expense && it.category == c.value }.sumOf { it.amount } }
        .sortedByDescending { (c, spent) -> if (byUse) spent.toDouble() / c.budget else spent.toDouble() }
        .let { if (all) it else it.take(3) }
    val menu = rememberMenuState()
    Card(Modifier.section("watch-list", scrollMargin = 96.dp)) {
        CardHeader {
            CardTitle("Watch list")
            Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "Watch list options", popupOpen = menu.open) {
                Icon(Icons.Ellipsis)
            }
            MenuContent(menu, Modifier.width(208.dp)) {
                MenuRadioGroup(byUse, { byUse = it }, label = "Order") {
                    MenuRadioItem(true) { Text("Closest to budget") }
                    MenuRadioItem(false) { Text("Most spent") }
                }
                MenuSeparator()
                MenuCheckboxItem(all, { all = it }) { Text("Every category") }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
            for ((c, spent) in rows) {
                val status = if (spent > c.budget) "${money(spent - c.budget)} over" else "${money(c.budget - spent)} left"
                Meter(
                    spent.toDouble(),
                    max = c.budget.toDouble(),
                    label = c.label,
                    detail = "${money(spent)} / ${money(c.budget)}",
                    hint = status,
                    valueText = "${money(spent)} of ${money(c.budget)}, $status",
                )
            }
        }
    }
}

/** What happened lately, newest first; it grows as you add, change, import and delete. */
@Composable
internal fun RecentActivity(activity: List<Activity>) {
    var shown by remember { mutableIntStateOf(4) }
    Card(Modifier.section("activity", scrollMargin = 96.dp)) {
        CardHeader { CardTitle("Recent activity") }
        Timeline {
            activity.take(shown).forEachIndexed { i, a ->
                item(a.title, a.time, active = i == 0, content = a.detail?.let { d -> { Text(d) } })
            }
        }
        LoadMore({ shown += 4 }, hasMore = shown < activity.size, auto = false, label = "Earlier")
    }
}

private val ICON_OPTIONS = GOAL_ICONS.map { IconOption(it.value, it.label) { Text(it.icon) } }

/** Each goal opens into its details, morphing out of its row (a view transition, zen-morph). */
@Composable
internal fun Goals() {
    val t = Zen.tokens
    var monthly by remember { mutableFloatStateOf(400f) }
    var openId by remember { mutableStateOf<String?>(null) }
    var order by remember { mutableStateOf(GOALS.map { it.id }) }
    var icons by remember { mutableStateOf(mapOf("emergency" to "lifebuoy", "laptop" to "laptop", "holiday" to "beach")) }
    val transition = Zen.viewTransition
    val show = { id: String? -> transition.start { openId = id } }
    val open = GOALS.firstOrNull { it.id == openId }
    val left = GOALS.sumOf { it.target - it.saved }
    val months = ceil(left / (monthly * 100.0)).toInt()
    val muted = t.mutedForeground.color()
    Card(Modifier.section("goals", scrollMargin = 96.dp)) {
        CardHeader {
            CardTitle("Goals")
            if (open != null) Button({ show(null) }, size = ButtonSize.Sm, variant = ButtonVariant.Ghost) { Text("All goals") }
        }
        if (open != null) {
            Column(Modifier.viewTransition("goal-${open.id}", ViewTransitionStyle.Morph), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    IconPicker(
                        IconChoice(icons.getValue(open.id)),
                        { icons = icons + (open.id to it.icon) },
                        ICON_OPTIONS,
                        "${open.name} icon",
                        colors = emptyList(),
                    )
                    ProgressRing(open.saved.toFloat() / open.target, open.name, size = 88.dp, stroke = 7.dp) {
                        Text("${open.percent}%", style = TextStyles.base.merge(TextStyles.semibold).merge(TextStyles.tabular))
                    }
                    Column {
                        Text("${iconOf(icons.getValue(open.id))} ${open.name}", style = TextStyles.medium)
                        Text("${money(open.saved)} of ${money(open.target)}", style = TextStyles.sm.merge(TextStyles.tabular), color = muted)
                        Text("${money(open.target - open.saved)} to go", style = TextStyles.xs.merge(TextStyles.tabular), color = muted)
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Saved over the last 6 months", style = TextStyles.xs, color = muted)
                    Sparkline(open.history, Modifier.height(64.dp).fillMaxWidth())
                }
            }
            return@Card
        }
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            SortableList(order, { order = it }, gap = 12.dp, label = "Goals, first funded first") { id ->
                val g = GOALS.first { it.id == id }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    SortableHandle(g.id, g.name)
                    val state = rememberControlState()
                    val shape = Zen.radii.xl
                    val fill by animateColorAsState(t.tint.color(if (state.hovered) 0.04f else 0f), transition(150))
                    Row(
                        Modifier
                            .weight(1f)
                            .viewTransition("goal-${g.id}", ViewTransitionStyle.Morph)
                            .box(shape, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
                            .control(state) { show(g.id) }
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        ProgressRing(g.saved.toFloat() / g.target, g.name, size = 56.dp, stroke = 5.dp) {
                            Text("${g.percent}%", style = TextStyles.xs.merge(TextStyles.semibold).merge(TextStyles.tabular))
                        }
                        Column {
                            Text("${iconOf(icons.getValue(g.id))} ${g.name}", style = TextStyles.sm.merge(TextStyles.medium))
                            Text("${money(g.saved)} of ${money(g.target)}", style = TextStyles.xs.merge(TextStyles.tabular), color = muted)
                        }
                    }
                }
            }
            Text("Drag to choose which goal is funded first.", style = TextStyles.xs, color = muted)
            Column(
                Modifier.box(androidx.compose.ui.graphics.RectangleShape, border = SolidColor(t.tint.color(0.07f)), sides = Sides.Top).padding(top = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Put aside each month", style = TextStyles.sm.merge(TextStyles.medium))
                    Text(money((monthly * 100).roundToInt().toLong()), style = TextStyles.sm.merge(TextStyles.tabular), color = muted)
                }
                Slider(
                    monthly,
                    { monthly = it },
                    min = 50f,
                    max = 1500f,
                    step = 50f,
                    label = "Put aside each month",
                    valueText = { money((it * 100).roundToInt().toLong()) },
                )
                Text("All goals reached in about $months months.", style = TextStyles.xs, color = muted)
            }
        }
    }
}

/** A live theme editor: presets, an accent colour, glow and motion, in dark and light. */
@Composable
internal fun Appearance() {
    val page = Zen.page
    var theme by remember { mutableStateOf(ThemeSettings()) }
    var reduceMotion by remember { mutableStateOf(false) }
    // The colour picked, while it's still the theme's hue; after a preset, that hue's own colour.
    var picked by remember { mutableStateOf<String?>(null) }
    val pickedHue = picked?.let { hexToOklch(it)?.h }
    val accent = if (picked != null && pickedHue != null && pickedHue.roundToInt() == theme.hue) picked!!
    else oklchToHex(Oklch(0.72f, 0.13f, theme.hue.toFloat()))
    DisposableEffect(theme) {
        page.theme = theme
        onDispose { }
    }
    DisposableEffect(Unit) { onDispose { page.theme = null } }
    DisposableEffect(reduceMotion) {
        page.reduceMotion = reduceMotion
        onDispose { page.reduceMotion = false }
    }
    val tip = rememberTooltipState()
    Card(Modifier.section("appearance", scrollMargin = 96.dp)) {
        CardHeader {
            CardTitle("Appearance")
            val state = rememberControlState()
            Badge(
                Modifier.box(Zen.radii.md, shadows = focusRing(state.focusVisible)).tooltipTrigger(tip, "About appearance").control(state) {},
                variant = BadgeVariant.Outline,
            ) { Text("?") }
            TooltipContent(tip) {
                Text(
                    "Every colour comes from these few settings, and stays readable in both themes.",
                    Modifier.widthIn(max = 224.dp).padding(12.dp),
                    style = TextStyles.xs.copy(lineHeight = TextStyles.xs.fontSize * 1.666f),
                    color = Zen.tokens.mutedForeground.color(),
                )
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Field("Preset") {
                Select(theme.preset?.name, { theme = theme.applyPreset(ThemePreset.valueOf(it)) }, Modifier.fillMaxWidth(), placeholder = "Custom") {
                    ThemePreset.entries.forEach { SelectItem(it.name, it.label) }
                }
            }
            Field("Accent", hint = "Its hue tints the whole app; lightness stays readable.") {
                ColorPicker(accent, { hex ->
                    picked = hex
                    hexToOklch(hex)?.h?.let { theme = theme.customize(hue = it.roundToInt()) }
                })
            }
            Segmented(theme.glow, { theme = theme.copy(glow = it) }, label = "Glow") {
                SegmentedItem(ThemeGlow.Off) { Text("Off") }
                SegmentedItem(ThemeGlow.Soft) { Text("Soft") }
                SegmentedItem(ThemeGlow.Bright) { Text("Bright") }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Reduce motion", style = TextStyles.sm)
                Toggle(reduceMotion, { reduceMotion = it }, label = "Reduce motion")
            }
        }
    }
}
